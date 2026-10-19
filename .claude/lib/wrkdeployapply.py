#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
CCOS WRKOPS 1.8.2 — wrkdeployapply (transactional deployment apply engine)
==========================================================================
B7. The layer that turns a B6 deployment plan into filesystem reality, or
refuses to, or undoes what it started.

    a READY wrkdeployplan.DeploymentPlan
  + an explicit backup root for rollback material
  ------------------------------------------------------------------
  = a fully computed transaction, then mutation, then a durable receipt

B6 PLANS. B7 APPLIES. B6 deliberately exposes no write surface at all; this
module is the only place in the archive that creates a directory or writes a
byte into a deployment root. That asymmetry is the point: a planner that can
also apply is a planner that deploys by accident, and an applier that can also
plan is an applier that invents its own authority when the plan it was handed
says no.

The three laws this module exists to enforce
--------------------------------------------
1. NOTHING IS MUTATED UNTIL EVERYTHING IS PROVEN. `preflight()` resolves every
   effective target, proves containment, proves every parent and every backup
   path is representable, reads every payload into memory, and re-verifies
   every source digest — all before the first `mkdir`. A transaction that
   cannot be completely described is refused whole, and a refusal has touched
   nothing.

2. A PARTIAL WRITE IS NEVER REPORTED AS A CLEAN SUCCESS. `status` is
   `success` only when every entry in the transaction was performed. The
   moment one operation fails, the journal is unwound and the receipt says
   `rolled_back`, or `rollback_failed` if the unwinding could not restore the
   prior shape of the tree. `failed` with `mutated: true` is a legal, honest
   outcome — it means the deployment root is partially written and the receipt
   names exactly which entries got that far.

3. THE DEPLOYMENT ROOT IS NEVER INFERRED. It arrives inside the plan, where
   B6 already held it to wrkroot's F024/F031 classification, and this module
   re-validates it rather than trusting it: a root that existed at plan time
   may be gone at apply time. `cwd` is not consulted. `CCOS_WORKSPACE_ROOT` is
   not consulted — an env var that happens to be set is not an operator saying
   "deploy into this tree", and the B6 test suite proves the planner refuses
   it even when it is perfectly valid. A value still carrying a `${...}` /
   `%...%` placeholder is refused outright: the manifest's own
   `"deployment_root": "${WORKSPACE_ROOT}"` is a declaration that something
   else must supply the real root, never a path to obey.

Canonical containment, at apply time, again
-------------------------------------------
B6 already refused lexical escapes. That is not enough to write with, because
lexical normalisation cannot see the filesystem:

  - CASE. On Windows (and on case-insensitive macOS volumes),
    `.claude/lib/x.py` and `.claude/Lib/x.py` are two distinct posix strings —
    so B6's duplicate-target law sees no collision — and exactly one file.
    Applying both would silently deploy one projection's bytes over the
    other's. Apply-time identity is therefore `normcase(normpath(path))`, and
    a collision under that key is refused.
  - SYMLINKS AND JUNCTIONS. A contained-looking relative path whose parent is
    a reparse point writes wherever the link points. So every existing
    ancestor from the deployment root down is checked, and a link anywhere in
    the chain is a refusal, not a redirection. The deepest existing ancestor's
    `realpath` must still land inside the root's `realpath`.
  - PATH SHAPE. One projection writing the file `a/b` and another writing
    `a/b/c` is a conflict no single projection can see. Both are refused.

Rollback material lives OUTSIDE the deployment root
---------------------------------------------------
Previous bytes are copied into `<backup_root>/wrkops-apply-<plan digest>/`,
under an explicit caller-supplied `backup_root` that must not be inside the
deployment root. Backups written into the tree being deployed would be
undeclared targets, could collide with a real projection target, and could
land inside a declared preserve surface — a rollback store that can be
overwritten by the very apply it protects is not a rollback store. If any
target already exists as a file and no usable `backup_root` was supplied, the
transaction is refused before mutation rather than applied without the means
to undo it.

Rollback is idempotent where practical: an entry whose target is already back
in its prior state is reported as `already_clean` rather than re-applied, so
running it twice is safe. It is deliberately NOT willing to delete a directory
it created that now holds content the transaction did not create — that
content belongs to someone else. Such a directory is `retained`, and because
the tree did not return to its exact prior shape, the receipt says
`rollback_failed`. Saying "rolled back" about a tree that still carries new
directories would be the same lie as law 2.

Dependency law: standard library only, plus the sibling module `wrkdeployplan`
(whose vocabulary, target normalisation, preserve matcher and digest helpers
are reused rather than reimplemented) and, through it, `wrkroot` and
`wrksettings`. CLAUDECLI.2.02 NO_INSTALL forbids pip dependencies in shipped
code.
"""
import json
import os
import re
import shutil
import sys
from dataclasses import dataclass
from pathlib import Path
from typing import Optional, Tuple

_HERE = Path(__file__).resolve().parent
if str(_HERE) not in sys.path:
    sys.path.insert(0, str(_HERE))

import wrkdeployplan
import wrkroot

__version__ = "1.0.0"

__all__ = [
    "Refusal",
    "TransactionEntry",
    "Transaction",
    "RollbackResult",
    "ApplyReceipt",
    "BACKUP_DIR_PREFIX",
    "BACKUP_FILES_DIR",
    "TEMP_SUFFIX",
    "TX_READY",
    "TX_REFUSED",
    "TX_STATUSES",
    "OP_CREATE_DIR",
    "OP_WRITE_FILE",
    "OPERATIONS",
    "UNDO_NONE",
    "UNDO_REMOVE_DIR",
    "UNDO_REMOVE_FILE",
    "UNDO_RESTORE_FILE",
    "UNDO_KINDS",
    "APPLY_SUCCESS",
    "APPLY_FAILED",
    "APPLY_ROLLED_BACK",
    "APPLY_ROLLBACK_FAILED",
    "APPLY_STATUSES",
    "ROLLBACK_COMPLETE",
    "ROLLBACK_INCOMPLETE",
    "ROLLBACK_NOT_ATTEMPTED",
    "ROLLBACK_STATUSES",
    "REFUSE_PLAN_NOT_READY",
    "REFUSE_PLAN_MALFORMED",
    "REFUSE_ARCHIVE_ROOT_UNRESOLVED",
    "REFUSE_DEPLOYMENT_ROOT_UNRESOLVED",
    "REFUSE_BACKUP_ROOT_REQUIRED",
    "REFUSE_BACKUP_ROOT_UNRESOLVED",
    "REFUSE_BACKUP_ROOT_INSIDE_DEPLOYMENT_ROOT",
    "REFUSE_BACKUP_DIR_NOT_EMPTY",
    "REFUSE_BACKUP_PATH_UNSAFE",
    "REFUSE_UNSUPPORTED_ACTION",
    "REFUSE_TARGET_ESCAPES_ROOT",
    "REFUSE_TARGET_COLLISION",
    "REFUSE_TARGET_PATH_CONFLICT",
    "REFUSE_TARGET_KIND_CONFLICT",
    "REFUSE_SYMLINKED_PATH",
    "REFUSE_PRESERVE_OVERWRITE",
    "REFUSE_PAYLOAD_UNAVAILABLE",
    "REFUSE_SOURCE_CHANGED",
    "REFUSE_TEMP_PATH_OCCUPIED",
    "REFUSALS",
    "FAIL_BACKUP_CAPTURE",
    "FAIL_OPERATION",
    "FAIL_TEMP_REMOVAL",
    "FAIL_MATERIAL_MISSING",
    "FAIL_MATERIAL_MISMATCH",
    "FAIL_KIND_CHANGED",
    "FAIL_ROLLBACK",
    "FAILURES",
    "canonical_key",
    "contains",
    "effective_target",
    "plan_digest",
    "preserve_patterns",
    "preflight",
    "apply_plan",
    "rollback",
    "rollback_receipt",
    "render_receipt",
    "write_receipt",
]

# --- frozen vocabulary ------------------------------------------------------

# Backup directory naming. The plan digest makes the name a function of the
# plan, so the same plan always addresses the same rollback store and a
# DIFFERENT plan can never quietly overwrite it.
BACKUP_DIR_PREFIX = "wrkops-apply-"
BACKUP_FILES_DIR = "files"

# Sibling scratch name used for write-then-replace. Never left behind by a
# successful entry; recorded on the entry so a failed one is inspectable.
TEMP_SUFFIX = ".wrkops-new"

# Transaction-level outcome.
TX_READY = "ready"
TX_REFUSED = "refused"
TX_STATUSES = (TX_READY, TX_REFUSED)

# The only two things this engine does to a deployment root.
OP_CREATE_DIR = "create_dir"
OP_WRITE_FILE = "write_file"
OPERATIONS = (OP_CREATE_DIR, OP_WRITE_FILE)

# How one entry is undone. Derived at preflight from the target's PRIOR state,
# never guessed during rollback.
UNDO_NONE = "none"                    # target already had the required shape
UNDO_REMOVE_DIR = "remove_dir"        # we created this directory
UNDO_REMOVE_FILE = "remove_file"      # we created this file
UNDO_RESTORE_FILE = "restore_file"    # we overwrote it; previous bytes kept
UNDO_KINDS = (UNDO_NONE, UNDO_REMOVE_DIR, UNDO_REMOVE_FILE, UNDO_RESTORE_FILE)

# Apply-level outcome. Exactly these four; a preflight refusal is `failed`
# with `mutated` false and `refused_before_mutation` true, because a refusal
# is a failure to deploy, not a fifth kind of success.
APPLY_SUCCESS = "success"
APPLY_FAILED = "failed"
APPLY_ROLLED_BACK = "rolled_back"
APPLY_ROLLBACK_FAILED = "rollback_failed"
APPLY_STATUSES = (APPLY_SUCCESS, APPLY_FAILED, APPLY_ROLLED_BACK,
                  APPLY_ROLLBACK_FAILED)

# Rollback-level outcome.
ROLLBACK_COMPLETE = "complete"
ROLLBACK_INCOMPLETE = "incomplete"
ROLLBACK_NOT_ATTEMPTED = "not_attempted"
ROLLBACK_STATUSES = (ROLLBACK_COMPLETE, ROLLBACK_INCOMPLETE,
                     ROLLBACK_NOT_ATTEMPTED)

# Refusal vocabulary: reasons a transaction will not be performed at all.
# Every preflight rejection names exactly one of these; nothing is reported as
# free prose alone.
REFUSE_PLAN_NOT_READY = "plan_not_ready"
REFUSE_PLAN_MALFORMED = "plan_object_malformed"
REFUSE_ARCHIVE_ROOT_UNRESOLVED = "archive_root_unresolved"
REFUSE_DEPLOYMENT_ROOT_UNRESOLVED = "deployment_root_unresolved"
REFUSE_BACKUP_ROOT_REQUIRED = "backup_root_required"
REFUSE_BACKUP_ROOT_UNRESOLVED = "backup_root_unresolved"
REFUSE_BACKUP_ROOT_INSIDE_DEPLOYMENT_ROOT = "backup_root_inside_deployment_root"
REFUSE_BACKUP_DIR_NOT_EMPTY = "backup_dir_not_empty"
REFUSE_BACKUP_PATH_UNSAFE = "backup_path_unsafe"
REFUSE_UNSUPPORTED_ACTION = "unsupported_action"
REFUSE_TARGET_ESCAPES_ROOT = "target_escapes_deployment_root"
REFUSE_TARGET_COLLISION = "canonical_target_collision"
REFUSE_TARGET_PATH_CONFLICT = "planned_target_path_conflict"
REFUSE_TARGET_KIND_CONFLICT = "target_kind_conflict"
REFUSE_SYMLINKED_PATH = "symlinked_target_path"
REFUSE_PRESERVE_OVERWRITE = "preserve_surface_overwrite"
REFUSE_PAYLOAD_UNAVAILABLE = "payload_unavailable"
REFUSE_SOURCE_CHANGED = "source_changed_since_plan"
REFUSE_TEMP_PATH_OCCUPIED = "temp_path_occupied"

REFUSALS = (
    REFUSE_PLAN_NOT_READY,
    REFUSE_PLAN_MALFORMED,
    REFUSE_ARCHIVE_ROOT_UNRESOLVED,
    REFUSE_DEPLOYMENT_ROOT_UNRESOLVED,
    REFUSE_BACKUP_ROOT_REQUIRED,
    REFUSE_BACKUP_ROOT_UNRESOLVED,
    REFUSE_BACKUP_ROOT_INSIDE_DEPLOYMENT_ROOT,
    REFUSE_BACKUP_DIR_NOT_EMPTY,
    REFUSE_BACKUP_PATH_UNSAFE,
    REFUSE_UNSUPPORTED_ACTION,
    REFUSE_TARGET_ESCAPES_ROOT,
    REFUSE_TARGET_COLLISION,
    REFUSE_TARGET_PATH_CONFLICT,
    REFUSE_TARGET_KIND_CONFLICT,
    REFUSE_SYMLINKED_PATH,
    REFUSE_PRESERVE_OVERWRITE,
    REFUSE_PAYLOAD_UNAVAILABLE,
    REFUSE_SOURCE_CHANGED,
    REFUSE_TEMP_PATH_OCCUPIED,
)

# Failure vocabulary: reasons something went wrong DURING mutation or
# rollback. Kept separate from REFUSALS on purpose — a refusal means nothing
# happened, a failure means something did, and collapsing the two is exactly
# how a partial write starts looking like a clean refusal.
FAIL_BACKUP_CAPTURE = "backup_capture_failed"
FAIL_OPERATION = "operation_failed"
FAIL_TEMP_REMOVAL = "temp_removal_failed"
FAIL_MATERIAL_MISSING = "rollback_material_missing"
FAIL_MATERIAL_MISMATCH = "rollback_material_mismatch"
FAIL_KIND_CHANGED = "rollback_kind_changed"
FAIL_ROLLBACK = "rollback_failed"

FAILURES = (
    FAIL_BACKUP_CAPTURE,
    FAIL_OPERATION,
    FAIL_TEMP_REMOVAL,
    FAIL_MATERIAL_MISSING,
    FAIL_MATERIAL_MISMATCH,
    FAIL_KIND_CHANGED,
    FAIL_ROLLBACK,
)

# The B6 actions this engine knows how to perform. An action outside this map
# is refused rather than ignored: silently skipping an operation nobody
# implements is how a deployment quietly ships incomplete.
_ACTION_OPERATIONS = {
    wrkdeployplan.ACTION_COPY_FILE: OP_WRITE_FILE,
    wrkdeployplan.ACTION_MATERIALIZE_FILE: OP_WRITE_FILE,
    wrkdeployplan.ACTION_COMPOSE_FILE: OP_WRITE_FILE,
    wrkdeployplan.ACTION_CREATE_DIR: OP_CREATE_DIR,
}

# Any $VAR / ${VAR} / %VAR% token left in a root value. Checked independently
# of wrkroot, because wrkroot's placeholder rule names CLAUDE_PROJECT_DIR
# specifically while the deployment manifest ships `${WORKSPACE_ROOT}`. An
# unresolved placeholder of ANY spelling is not filesystem authority.
_PLACEHOLDER_RE = re.compile(r"\$\{?[A-Za-z_][A-Za-z0-9_]*\}?"
                             r"|%[A-Za-z_][A-Za-z0-9_]*%")


# --- canonical path identity ------------------------------------------------

def canonical_key(path):
    """The apply-time identity of a filesystem path.

    `normcase` folds case and separator spelling on the platforms where the
    filesystem itself does, so two targets that differ only in case are ONE
    file here and collide, exactly as they would on disk. On a case-sensitive
    platform `normcase` is the identity function and nothing is conflated.
    """
    return os.path.normcase(os.path.normpath(str(path)))


def contains(root, path):
    """True if `path` is `root` or lies strictly beneath it, canonically."""
    r = canonical_key(root)
    p = canonical_key(path)
    return p == r or p.startswith(r + os.sep)


def _real(path):
    """`realpath` that never raises — an unresolvable path is its own answer."""
    try:
        return os.path.realpath(str(path))
    except OSError:
        return os.path.normpath(str(path))


def _deepest_existing(path):
    """The deepest ancestor of `path` (inclusive) that exists, or None.

    `lexists`, not `exists`: a broken symlink is a thing that is THERE, and
    pretending it is absent is how an apply writes through it.
    """
    current = os.path.normpath(str(path))
    while True:
        try:
            if os.path.lexists(current):
                return current
        except OSError:
            return current
        parent = os.path.dirname(current)
        if parent == current:
            return None
        current = parent


def effective_target(root_real, normalized):
    """(absolute effective path, error) for one normalised target.

    `root_real` must already be the REAL (link-resolved) deployment root.
    Containment is proven twice — lexically against the joined path, then
    against the real path of the deepest ancestor that actually exists — so a
    string that looks contained cannot reach outside through a reparse point.
    """
    joined, error = wrkdeployplan.join_target(root_real, normalized)
    if error:
        return None, error
    if not contains(root_real, joined) \
            or canonical_key(joined) == canonical_key(root_real):
        return None, (f"target {normalized!r} does not resolve strictly "
                      f"beneath the deployment root")
    anchor = _deepest_existing(joined)
    if anchor is not None and not contains(root_real, _real(anchor)):
        return None, (f"target {normalized!r} resolves through {anchor!r}, "
                      f"which really lives outside the deployment root")
    return joined, None


# --- digests ----------------------------------------------------------------
# Reused from B6 rather than reimplemented: one digest implementation in the
# archive means a plan and its receipt can never disagree about what a file is.

def _sha256_file(path):
    return wrkdeployplan.sha256_file(path)


def _sha256_bytes(data):
    return wrkdeployplan.sha256_bytes(data)


def _size(path):
    try:
        return os.path.getsize(str(path))
    except OSError:
        return None


# --- deterministic rendering ------------------------------------------------

def _render(payload):
    """Deterministic UTF-8 bytes: LF, two-space indent, sorted keys, one final
    LF. The same rendering contract B5 and B6 use, so every artefact this
    archive emits is byte-comparable by the same rule."""
    text = json.dumps(payload, indent=2, sort_keys=True, ensure_ascii=False,
                      separators=(",", ": "))
    return (text + "\n").encode("utf-8")


# --- structured surface -----------------------------------------------------

@dataclass(frozen=True)
class Refusal:
    """One named reason a transaction was refused, or one named failure during
    mutation or rollback. Same shape either way, so a caller inspecting "what
    went wrong" never has to switch data structures halfway."""
    code: str
    projection_id: Optional[str]
    detail: str

    def to_dict(self):
        return {"code": self.code, "projection_id": self.projection_id,
                "detail": self.detail}


@dataclass(frozen=True)
class TransactionEntry:
    """One intended operation, fully described BEFORE anything is mutated.

    `payload` is the only field that is not JSON-safe and the only one omitted
    from `to_dict()`: a receipt is evidence, not a second copy of the bytes.
    Its digest and length are recorded instead, which is what a later
    verification actually needs.
    """
    seq: int
    projection_id: str
    operation: str
    action: str
    target: str
    target_path: str
    existed: bool
    pre_kind: Optional[str]
    pre_sha256: Optional[str]
    pre_size: Optional[int]
    payload: Optional[bytes]
    payload_sha256: Optional[str]
    payload_size: Optional[int]
    source: Optional[str]
    backup_path: Optional[str]
    temp_path: Optional[str]
    undo: str

    def to_dict(self):
        return {
            "seq": self.seq,
            "projection_id": self.projection_id,
            "operation": self.operation,
            "action": self.action,
            "target": self.target,
            "target_path": self.target_path,
            "existed": self.existed,
            "pre_kind": self.pre_kind,
            "pre_sha256": self.pre_sha256,
            "pre_size": self.pre_size,
            "payload_sha256": self.payload_sha256,
            "payload_size": self.payload_size,
            "source": self.source,
            "backup_path": self.backup_path,
            "temp_path": self.temp_path,
            "undo": self.undo,
        }


@dataclass(frozen=True)
class Transaction:
    """The complete intended mutation, or a refusal to intend one.

    `status` is `ready` only when NOTHING was refused. A transaction with one
    unsafe entry is an unsafe transaction, and applying "the safe part of it"
    is precisely the partial deployment this layer exists to prevent.
    """
    status: str
    plan_digest: Optional[str]
    plan_status: Optional[str]
    manifest_version: Optional[str]
    target_release: Optional[str]
    stack: Optional[str]
    archive_root: Optional[str]
    deployment_root: Optional[str]
    deployment_root_real: Optional[str]
    backup_root: Optional[str]
    backup_dir: Optional[str]
    entries: Tuple[TransactionEntry, ...]
    planned_projections: Tuple[str, ...]
    skipped_projections: Tuple[str, ...]
    preserved_surfaces: Tuple[str, ...]
    pre_existing_targets: Tuple[str, ...]
    refusals: Tuple[Refusal, ...]
    diagnostics: Tuple[str, ...]

    @property
    def is_ready(self):
        return self.status == TX_READY

    @property
    def refused_projections(self):
        return tuple(sorted({r.projection_id for r in self.refusals
                             if r.projection_id}))

    @property
    def refusal_codes(self):
        return tuple(sorted({r.code for r in self.refusals}))

    def by_operation(self, operation):
        return tuple(e for e in self.entries if e.operation == operation)

    def by_target(self, target):
        for entry in self.entries:
            if entry.target == target:
                return entry
        return None

    def requires_backup(self):
        return tuple(e for e in self.entries if e.undo == UNDO_RESTORE_FILE)

    def to_dict(self):
        return {
            "status": self.status,
            "plan_digest": self.plan_digest,
            "plan_status": self.plan_status,
            "manifest_version": self.manifest_version,
            "target_release": self.target_release,
            "stack": self.stack,
            "archive_root": self.archive_root,
            "deployment_root": self.deployment_root,
            "deployment_root_real": self.deployment_root_real,
            "backup_root": self.backup_root,
            "backup_dir": self.backup_dir,
            "entries": [e.to_dict() for e in self.entries],
            "planned_projections": list(self.planned_projections),
            "skipped_projections": list(self.skipped_projections),
            "preserved_surfaces": list(self.preserved_surfaces),
            "pre_existing_targets": list(self.pre_existing_targets),
            "refusals": [r.to_dict() for r in self.refusals],
            "refusal_codes": list(self.refusal_codes),
            "diagnostics": list(self.diagnostics),
        }

    def to_json(self):
        return _render(self.to_dict())


@dataclass(frozen=True)
class RollbackResult:
    """What unwinding the journal actually achieved.

    `retained_dirs` is neither an error nor a success: it names a directory
    this transaction created that now holds content the transaction did not
    create. Deleting it would destroy someone else's data; leaving it means
    the tree did not return to its exact prior shape. Both facts are true and
    both are reported, which is why a retained directory still makes the
    rollback `incomplete`.
    """
    status: str
    restored: Tuple[str, ...]
    removed_files: Tuple[str, ...]
    removed_dirs: Tuple[str, ...]
    removed_temps: Tuple[str, ...]
    already_clean: Tuple[str, ...]
    retained_dirs: Tuple[str, ...]
    failures: Tuple[Refusal, ...]
    diagnostics: Tuple[str, ...]

    @property
    def is_complete(self):
        return self.status == ROLLBACK_COMPLETE

    def to_dict(self):
        return {
            "status": self.status,
            "restored": list(self.restored),
            "removed_files": list(self.removed_files),
            "removed_dirs": list(self.removed_dirs),
            "removed_temps": list(self.removed_temps),
            "already_clean": list(self.already_clean),
            "retained_dirs": list(self.retained_dirs),
            "failures": [f.to_dict() for f in self.failures],
            "diagnostics": list(self.diagnostics),
        }


@dataclass(frozen=True)
class ApplyReceipt:
    """The durable record of one apply attempt.

    Everything a later operator, verifier or rollback needs is here, and
    nothing here is inferred at read time: the plan it came from, both roots,
    where the rollback material lives, which projections were applied, skipped
    and refused, which targets already existed, and the full transaction.
    """
    status: str
    mutated: bool
    refused_before_mutation: bool
    backup_dir_created: bool
    plan_digest: Optional[str]
    plan_status: Optional[str]
    manifest_version: Optional[str]
    target_release: Optional[str]
    stack: Optional[str]
    archive_root: Optional[str]
    deployment_root: Optional[str]
    backup_root: Optional[str]
    backup_dir: Optional[str]
    applied: Tuple[str, ...]
    skipped: Tuple[str, ...]
    refused: Tuple[str, ...]
    written_files: Tuple[str, ...]
    created_dirs: Tuple[str, ...]
    preserved_surfaces: Tuple[str, ...]
    pre_existing_targets: Tuple[str, ...]
    entries: Tuple[TransactionEntry, ...]
    journal: Tuple[int, ...]
    failed_entry: Optional[int]
    rollback: Optional[RollbackResult]
    refusals: Tuple[Refusal, ...]
    diagnostics: Tuple[str, ...]

    @property
    def is_success(self):
        return self.status == APPLY_SUCCESS

    @property
    def refusal_codes(self):
        return tuple(sorted({r.code for r in self.refusals}))

    def journal_entries(self):
        """The entries this apply actually attempted, in attempt order."""
        by_seq = {e.seq: e for e in self.entries}
        return tuple(by_seq[s] for s in self.journal if s in by_seq)

    def to_dict(self):
        return {
            "status": self.status,
            "mutated": self.mutated,
            "refused_before_mutation": self.refused_before_mutation,
            "backup_dir_created": self.backup_dir_created,
            "plan_digest": self.plan_digest,
            "plan_status": self.plan_status,
            "manifest_version": self.manifest_version,
            "target_release": self.target_release,
            "stack": self.stack,
            "archive_root": self.archive_root,
            "deployment_root": self.deployment_root,
            "backup_root": self.backup_root,
            "backup_dir": self.backup_dir,
            "applied": list(self.applied),
            "skipped": list(self.skipped),
            "refused": list(self.refused),
            "written_files": list(self.written_files),
            "created_dirs": list(self.created_dirs),
            "preserved_surfaces": list(self.preserved_surfaces),
            "pre_existing_targets": list(self.pre_existing_targets),
            "entries": [e.to_dict() for e in self.entries],
            "journal": list(self.journal),
            "failed_entry": self.failed_entry,
            "rollback": self.rollback.to_dict() if self.rollback else None,
            "refusals": [r.to_dict() for r in self.refusals],
            "refusal_codes": list(self.refusal_codes),
            "diagnostics": list(self.diagnostics),
        }

    def to_json(self):
        """Deterministic UTF-8 bytes: LF, two-space indent, sorted keys, one
        final LF. Two receipts over identical outcomes render identically."""
        return _render(self.to_dict())


# --- plan identity ----------------------------------------------------------

def plan_digest(plan):
    """Stable SHA256 of a plan's deterministic rendering, or None.

    This is the plan's identity in a receipt: it changes if anything the plan
    describes changes, and it is computable again later from the same plan
    without keeping the plan object around.
    """
    render = getattr(plan, "to_json", None)
    if not callable(render):
        return None
    try:
        return _sha256_bytes(render())
    except (TypeError, ValueError):
        return None


def preserve_patterns(plan):
    """((projection id, declared pattern), ...) for a plan's preserve surfaces.

    Read from the plan rather than from the manifest: the plan is the authority
    this engine was handed, and re-reading the manifest would let an applier
    disagree with the plan it is applying.
    """
    patterns = []
    for projection in getattr(plan, "projections", ()) or ():
        if getattr(projection, "kind", None) != "preserve":
            continue
        path = getattr(projection, "preserve_path", None)
        if isinstance(path, str) and path.strip():
            patterns.append((projection.id, path.strip().replace("\\", "/")))
    return tuple(patterns)


# --- preflight --------------------------------------------------------------

def _classify_root(label, value, code, refusals):
    """Hold one root to wrkroot's F024/F031 rules plus the placeholder law.

    Returns the resolved path string, or None having appended a refusal. The
    placeholder check is deliberately independent of wrkroot: the manifest
    ships `${WORKSPACE_ROOT}`, which wrkroot classifies merely as
    "not absolute", and an unresolved placeholder deserves to be named as
    exactly what it is.
    """
    raw = value
    if isinstance(raw, Path):
        raw = str(raw)
    if raw is None:
        raw = ""
    if not isinstance(raw, str):
        refusals.append(Refusal(
            code, None,
            f"{label} must be a path or string, got {type(value).__name__}"))
        return None
    raw = raw.strip()
    if _PLACEHOLDER_RE.search(raw):
        refusals.append(Refusal(
            code, None,
            f"{label}={raw!r} still carries an unresolved placeholder token; "
            f"a placeholder is a declaration that something else must supply "
            f"the real path, never filesystem authority"))
        return None
    kind, reason = wrkroot.classify_root(raw)
    if kind == "valid":
        return raw
    if kind == "empty":
        refusals.append(Refusal(
            code, None,
            f"{label} was not supplied. It is never inferred from the current "
            f"working directory or from the environment; it must be declared "
            f"explicitly."))
        return None
    refusals.append(Refusal(
        code, None,
        f"{label}={raw!r} {wrkroot.UNUSABLE_MESSAGES[reason]}. This engine "
        f"fails closed rather than widening to a root nobody named."))
    return None


def _pre_state(path):
    """(existed, kind, sha256, size, is_link) for a target before apply."""
    try:
        if not os.path.lexists(path):
            return False, None, None, None, False
        if os.path.islink(path):
            return True, "symlink", None, None, True
        if os.path.isdir(path):
            return True, "dir", None, None, False
        if os.path.isfile(path):
            return True, "file", _sha256_file(path), _size(path), False
        return True, "other", None, None, False
    except OSError:
        # An unreadable target is not an absent one. Report it as present and
        # unclassifiable, so preflight refuses rather than writing blind.
        return True, "other", None, None, False


def _payload_for(projection, archive_root, refusals):
    """(bytes|None, source path|None) for one writing projection.

    Payloads are read HERE, during preflight, for two reasons. A source that
    vanished or changed between planning and applying must refuse the whole
    transaction rather than fail halfway through it; and a write that is
    already holding its bytes cannot half-fail on a read.
    """
    if projection.action == wrkdeployplan.ACTION_COMPOSE_FILE:
        payload = projection.planned_bytes
        if not isinstance(payload, bytes):
            refusals.append(Refusal(
                REFUSE_PAYLOAD_UNAVAILABLE, projection.id,
                "composed bytes are absent from the plan; a compose "
                "projection without its planned bytes cannot be applied"))
            return None, None
        return payload, None

    sources = projection.sources or ()
    if len(sources) != 1:
        refusals.append(Refusal(
            REFUSE_PAYLOAD_UNAVAILABLE, projection.id,
            f"expected exactly one declared source, the plan carries "
            f"{len(sources)}"))
        return None, None

    check = sources[0]
    absolute = os.path.join(str(archive_root), *check.path.split("/"))
    actual = _sha256_file(absolute)
    if actual is None:
        refusals.append(Refusal(
            REFUSE_PAYLOAD_UNAVAILABLE, projection.id,
            f"archive source {check.path!r} is not a readable file at apply "
            f"time"))
        return None, check.path
    if actual != check.declared_sha256:
        refusals.append(Refusal(
            REFUSE_SOURCE_CHANGED, projection.id,
            f"archive source {check.path!r} now digests {actual}, the plan "
            f"verified {check.declared_sha256}; the archive changed after it "
            f"was planned"))
        return None, check.path
    try:
        payload = Path(absolute).read_bytes()
    except OSError as exc:
        refusals.append(Refusal(
            REFUSE_PAYLOAD_UNAVAILABLE, projection.id,
            f"archive source {check.path!r} could not be read: {exc}"))
        return None, check.path
    if _sha256_bytes(payload) != check.declared_sha256:
        refusals.append(Refusal(
            REFUSE_SOURCE_CHANGED, projection.id,
            f"archive source {check.path!r} changed while it was being read"))
        return None, check.path
    return payload, check.path


def _ancestor_targets(normalized):
    """Deployment-root-relative ancestor directories of a normalised target,
    shallowest first, excluding the deployment root itself."""
    parts = normalized.split("/")
    return ["/".join(parts[:i]) for i in range(1, len(parts))]


def preflight(plan, backup_root=None):
    """Compute the complete transaction for a plan. Mutates nothing.

    plan         a READY wrkdeployplan.DeploymentPlan (or an object carrying
                 the same surface). A blocked plan is refused: B6 blocks a
                 plan precisely when applying it would be unsafe, and an
                 applier that second-guesses that is an applier with its own
                 deployment policy.
    backup_root  explicit directory OUTSIDE the deployment root where previous
                 bytes are kept. Required only when a target already exists as
                 a file; validated whenever it is supplied.

    Returns a Transaction. Never raises for an input fault — every defect comes
    back as a named Refusal, so one unsafe target cannot hide the rest.
    """
    refusals = []
    diagnostics = []

    def refused(**over):
        base = dict(
            status=TX_REFUSED, plan_digest=None, plan_status=None,
            manifest_version=None, target_release=None, stack=None,
            archive_root=None, deployment_root=None,
            deployment_root_real=None, backup_root=None, backup_dir=None,
            entries=tuple(), planned_projections=tuple(),
            skipped_projections=tuple(), preserved_surfaces=tuple(),
            pre_existing_targets=tuple())
        base.update(over)
        base["status"] = TX_REFUSED
        base["refusals"] = tuple(refusals)
        base["diagnostics"] = tuple(diagnostics)
        return Transaction(**base)

    # --- the plan object itself ---------------------------------------------
    required = ("status", "projections", "archive_root", "deployment_root",
                "archive_root_status", "deployment_root_status")
    missing = [name for name in required if not hasattr(plan, name)]
    if missing:
        refusals.append(Refusal(
            REFUSE_PLAN_MALFORMED, None,
            f"not a deployment plan: missing {missing}"))
        return refused()

    identity = dict(
        plan_digest=plan_digest(plan),
        plan_status=plan.status,
        manifest_version=getattr(plan, "manifest_version", None),
        target_release=getattr(plan, "target_release", None),
        stack=getattr(plan, "stack", None),
    )

    if plan.status != wrkdeployplan.PLAN_READY:
        refusals.append(Refusal(
            REFUSE_PLAN_NOT_READY, None,
            f"plan status is {plan.status!r} with blockers "
            f"{list(getattr(plan, 'blockers', ()))}; only a ready plan may be "
            f"applied"))
        return refused(**identity)

    # --- both roots, re-validated at apply time -----------------------------
    archive_root = _classify_root("archive root", plan.archive_root,
                                  REFUSE_ARCHIVE_ROOT_UNRESOLVED, refusals)
    deployment_root = _classify_root("deployment root", plan.deployment_root,
                                     REFUSE_DEPLOYMENT_ROOT_UNRESOLVED,
                                     refusals)
    if plan.archive_root_status != wrkdeployplan.ROOT_EXPLICIT:
        refusals.append(Refusal(
            REFUSE_ARCHIVE_ROOT_UNRESOLVED, None,
            f"plan reports archive root status {plan.archive_root_status!r}; "
            f"only an explicitly resolved root may be applied from"))
    if plan.deployment_root_status != wrkdeployplan.ROOT_EXPLICIT:
        refusals.append(Refusal(
            REFUSE_DEPLOYMENT_ROOT_UNRESOLVED, None,
            f"plan reports deployment root status "
            f"{plan.deployment_root_status!r}; only an explicitly resolved "
            f"root may be applied to"))
    if refusals:
        return refused(archive_root=archive_root,
                       deployment_root=deployment_root, **identity)

    root_real = _real(deployment_root)
    roots = dict(archive_root=archive_root, deployment_root=deployment_root,
                 deployment_root_real=root_real)

    # --- which projections are in play --------------------------------------
    planned = [p for p in plan.projections
               if p.status == wrkdeployplan.PROJ_PLANNED]
    skipped = tuple(p.id for p in plan.projections
                    if p.status == wrkdeployplan.PROJ_ARCHIVE_ONLY)
    surfaces = preserve_patterns(plan)
    preserved = tuple(pattern for _, pattern in surfaces)

    # --- claims on canonical paths ------------------------------------------
    # Directories are collected separately from files so they can be performed
    # shallowest-first (a parent always precedes its child) while files keep
    # plan order. Every claim on a canonical path is recorded, so a second
    # claimant is refused rather than silently winning.
    dir_claims = {}    # canonical key -> (depth, relative, absolute, pid)
    file_claims = []   # (projection, relative, absolute, payload, source, ...)
    claimed = {}       # canonical key -> (projection id, operation)
    pre_existing = []

    def claim(key, pid, operation, relative):
        previous = claimed.get(key)
        if previous is None:
            claimed[key] = (pid, operation)
            return True
        other_pid, other_op = previous
        if operation == OP_CREATE_DIR and other_op == OP_CREATE_DIR:
            return False   # the same directory claimed twice is not a conflict
        code = REFUSE_TARGET_COLLISION if operation == other_op \
            else REFUSE_TARGET_PATH_CONFLICT
        refusals.append(Refusal(
            code, pid,
            f"{relative!r} canonically resolves to the same filesystem path "
            f"{other_pid!r} already claims; distinct declared targets that are "
            f"one path on this filesystem are refused rather than silently "
            f"applied over one another"))
        return False

    def check_preserve(pid, relative, what):
        for surface_id, pattern in surfaces:
            if wrkdeployplan.matches_preserve(relative, pattern):
                refusals.append(Refusal(
                    REFUSE_PRESERVE_OVERWRITE, pid,
                    f"{what} {relative!r} falls inside preserve surface "
                    f"{pattern!r} declared by {surface_id!r}; a deployment "
                    f"must never overwrite it"))
                return False
        return True

    def resolve(pid, target):
        """(normalised, absolute) for one declared target, or (None, None)."""
        normalized, error = wrkdeployplan.normalize_target(target)
        if error:
            refusals.append(Refusal(REFUSE_TARGET_ESCAPES_ROOT, pid, error))
            return None, None
        absolute, error = effective_target(root_real, normalized)
        if error:
            refusals.append(Refusal(REFUSE_TARGET_ESCAPES_ROOT, pid, error))
            return None, None
        return normalized, absolute

    for projection in planned:
        pid = projection.id
        operation = _ACTION_OPERATIONS.get(projection.action)
        if operation is None:
            refusals.append(Refusal(
                REFUSE_UNSUPPORTED_ACTION, pid,
                f"action {projection.action!r} is not an operation this engine "
                f"implements; supported actions are "
                f"{sorted(_ACTION_OPERATIONS)}"))
            continue

        normalized, absolute = resolve(pid, projection.target)
        if normalized is None:
            continue
        if not check_preserve(pid, normalized, "target"):
            continue

        # Every ancestor directory is proven representable and, where absent,
        # becomes an entry of its own — so rollback can remove exactly the
        # directories this transaction created and no others.
        ancestors_ok = True
        for relative in _ancestor_targets(normalized):
            parent_abs, error = effective_target(root_real, relative)
            if error:
                refusals.append(Refusal(REFUSE_TARGET_ESCAPES_ROOT, pid,
                                        error))
                ancestors_ok = False
                break
            existed, kind, _, _, link = _pre_state(parent_abs)
            if link:
                refusals.append(Refusal(
                    REFUSE_SYMLINKED_PATH, pid,
                    f"target parent {relative!r} is a symlink or reparse "
                    f"point; writing through it would leave the deployment "
                    f"root"))
                ancestors_ok = False
                break
            if existed and kind != "dir":
                refusals.append(Refusal(
                    REFUSE_TARGET_KIND_CONFLICT, pid,
                    f"target parent {relative!r} exists as {kind!r}, not a "
                    f"directory"))
                ancestors_ok = False
                break
            if not existed:
                key = canonical_key(parent_abs)
                if key not in dir_claims and claim(key, pid, OP_CREATE_DIR,
                                                   relative):
                    dir_claims[key] = (len(relative.split("/")), relative,
                                       parent_abs, pid)
        if not ancestors_ok:
            continue

        existed, kind, pre_sha, pre_len, link = _pre_state(absolute)
        if link:
            refusals.append(Refusal(
                REFUSE_SYMLINKED_PATH, pid,
                f"target {normalized!r} exists as a symlink or reparse point; "
                f"writing through it would leave the deployment root"))
            continue
        if existed:
            pre_existing.append(normalized)

        key = canonical_key(absolute)

        if operation == OP_CREATE_DIR:
            if existed and kind != "dir":
                refusals.append(Refusal(
                    REFUSE_TARGET_KIND_CONFLICT, pid,
                    f"scaffold target {normalized!r} exists as {kind!r}, not "
                    f"a directory"))
                continue
            already = key in dir_claims
            if not already and not claim(key, pid, OP_CREATE_DIR, normalized):
                continue
            # An explicit scaffold takes ownership of a directory an implicit
            # parent may already have scheduled: the manifest named it, so the
            # receipt should attribute it to the projection that declared it.
            dir_claims[key] = (len(normalized.split("/")), normalized,
                               absolute, pid)
            continue

        if existed and kind != "file":
            refusals.append(Refusal(
                REFUSE_TARGET_KIND_CONFLICT, pid,
                f"target {normalized!r} exists as {kind!r}; this engine will "
                f"not replace it with a file"))
            continue
        if not claim(key, pid, OP_WRITE_FILE, normalized):
            continue

        payload, source = _payload_for(projection, archive_root, refusals)
        if payload is None:
            continue
        file_claims.append((projection, normalized, absolute, payload, source,
                            existed, kind, pre_sha, pre_len))

    # --- the rollback store, only if something will be overwritten ----------
    overwrites = [c for c in file_claims if c[5]]
    resolved_backup_root = None
    backup_dir = None
    supplied = backup_root is not None and not (
        isinstance(backup_root, str) and not backup_root.strip())

    if overwrites and not supplied:
        refusals.append(Refusal(
            REFUSE_BACKUP_ROOT_REQUIRED, None,
            f"{len(overwrites)} target(s) already exist as files and would be "
            f"overwritten; an explicit backup root is required so their "
            f"previous bytes can be preserved. Targets: "
            f"{sorted(c[1] for c in overwrites)}"))
    elif supplied:
        # A backup root supplied where none is needed is validated anyway, so
        # a caller is never told "fine" about a root that would have failed.
        resolved_backup_root = _classify_root(
            "backup root", backup_root, REFUSE_BACKUP_ROOT_UNRESOLVED,
            refusals)

    if resolved_backup_root is not None:
        backup_real = _real(resolved_backup_root)
        if contains(root_real, backup_real) or contains(backup_real, root_real):
            refusals.append(Refusal(
                REFUSE_BACKUP_ROOT_INSIDE_DEPLOYMENT_ROOT, None,
                f"backup root {resolved_backup_root!r} and deployment root "
                f"{deployment_root!r} contain one another; rollback material "
                f"kept inside the tree being deployed can be overwritten by "
                f"the very apply it protects"))
        else:
            digest = identity["plan_digest"]
            name = BACKUP_DIR_PREFIX + (digest[:16] if digest else "unknown")
            backup_dir = os.path.normpath(os.path.join(backup_real, name))
            try:
                if os.path.lexists(backup_dir):
                    if not os.path.isdir(backup_dir) \
                            or os.path.islink(backup_dir):
                        refusals.append(Refusal(
                            REFUSE_BACKUP_PATH_UNSAFE, None,
                            f"backup directory {backup_dir!r} exists and is "
                            f"not a plain directory"))
                        backup_dir = None
                    elif os.listdir(backup_dir):
                        refusals.append(Refusal(
                            REFUSE_BACKUP_DIR_NOT_EMPTY, None,
                            f"backup directory {backup_dir!r} already holds "
                            f"rollback material; refusing to overwrite the "
                            f"means of undoing an earlier apply"))
                        backup_dir = None
            except OSError as exc:
                refusals.append(Refusal(
                    REFUSE_BACKUP_PATH_UNSAFE, None,
                    f"backup directory {backup_dir!r} is not inspectable: "
                    f"{exc}"))
                backup_dir = None

    # --- assemble the entries -----------------------------------------------
    entries = []
    seq = 0
    for depth, relative, absolute, pid in sorted(dir_claims.values()):
        existed, kind, _, _, _ = _pre_state(absolute)
        entries.append(TransactionEntry(
            seq=seq, projection_id=pid, operation=OP_CREATE_DIR,
            action=wrkdeployplan.ACTION_CREATE_DIR, target=relative,
            target_path=absolute, existed=existed, pre_kind=kind,
            pre_sha256=None, pre_size=None, payload=None, payload_sha256=None,
            payload_size=None, source=None, backup_path=None, temp_path=None,
            undo=UNDO_NONE if existed else UNDO_REMOVE_DIR))
        seq += 1

    backup_keys = {}
    for (projection, relative, absolute, payload, source, existed, kind,
         pre_sha, pre_len) in file_claims:
        temp_path = absolute + TEMP_SUFFIX
        if os.path.lexists(temp_path):
            refusals.append(Refusal(
                REFUSE_TEMP_PATH_OCCUPIED, projection.id,
                f"scratch path {temp_path!r} is occupied; this engine writes "
                f"through a sibling scratch file and will not clobber one it "
                f"did not create"))
            continue
        if canonical_key(temp_path) in claimed:
            refusals.append(Refusal(
                REFUSE_TEMP_PATH_OCCUPIED, projection.id,
                f"scratch path {temp_path!r} is itself a declared target"))
            continue
        if not check_preserve(projection.id, relative + TEMP_SUFFIX,
                              "scratch path for"):
            continue

        backup_path = None
        if existed:
            if backup_dir is None:
                # The missing/unusable store was already refused above; without
                # one there is no safe entry to build.
                continue
            candidate = os.path.normpath(os.path.join(
                backup_dir, BACKUP_FILES_DIR, *relative.split("/")))
            if not contains(backup_dir, candidate):
                refusals.append(Refusal(
                    REFUSE_BACKUP_PATH_UNSAFE, projection.id,
                    f"rollback material for {relative!r} would not be "
                    f"representable under {backup_dir!r}"))
                continue
            if pre_sha is None:
                refusals.append(Refusal(
                    REFUSE_BACKUP_PATH_UNSAFE, projection.id,
                    f"previous content of {relative!r} could not be digested, "
                    f"so no rollback material can be proven"))
                continue
            key = canonical_key(candidate)
            if key in backup_keys:
                refusals.append(Refusal(
                    REFUSE_BACKUP_PATH_UNSAFE, projection.id,
                    f"rollback material for {relative!r} collides with "
                    f"{backup_keys[key]!r} under {backup_dir!r}"))
                continue
            backup_keys[key] = relative
            backup_path = candidate

        entries.append(TransactionEntry(
            seq=seq, projection_id=projection.id, operation=OP_WRITE_FILE,
            action=projection.action, target=relative, target_path=absolute,
            existed=existed, pre_kind=kind, pre_sha256=pre_sha,
            pre_size=pre_len, payload=payload,
            payload_sha256=_sha256_bytes(payload), payload_size=len(payload),
            source=source, backup_path=backup_path, temp_path=temp_path,
            undo=UNDO_RESTORE_FILE if existed else UNDO_REMOVE_FILE))
        seq += 1

    # A transaction with any refusal is refused WHOLE. The entries that would
    # have been safe are discarded rather than returned, so no caller can ever
    # perform "the good part" of a refused transaction — the refusals already
    # say what was wrong, and a half-applicable transaction is the exact hazard
    # this layer exists to remove.
    if refusals and entries:
        diagnostics.append(
            f"{len(entries)} computed entry/ies were discarded: a transaction "
            f"carrying any refusal is refused whole, so there is nothing left "
            f"to half-apply")
        entries = []

    return Transaction(
        status=TX_REFUSED if refusals else TX_READY,
        entries=tuple(entries),
        planned_projections=tuple(p.id for p in planned),
        skipped_projections=skipped,
        preserved_surfaces=preserved,
        pre_existing_targets=tuple(sorted(set(pre_existing))),
        backup_root=resolved_backup_root,
        backup_dir=backup_dir,
        refusals=tuple(refusals),
        diagnostics=tuple(diagnostics),
        **roots, **identity)


# --- mutation ---------------------------------------------------------------

def _write_backup(entry):
    """Copy an entry's previous bytes into its rollback store. Raises OSError.

    The copy is verified against the digest preflight recorded, so a backup
    that did not actually capture the previous content is an error BEFORE the
    target is touched, not a surprise during rollback.
    """
    os.makedirs(os.path.dirname(entry.backup_path), exist_ok=True)
    shutil.copyfile(entry.target_path, entry.backup_path)
    actual = _sha256_file(entry.backup_path)
    if actual != entry.pre_sha256:
        raise OSError(f"rollback material for {entry.target!r} digests "
                      f"{actual}, previous content digested "
                      f"{entry.pre_sha256}")


def _perform(entry):
    """Perform one transaction entry. Raises OSError on failure."""
    if entry.operation == OP_CREATE_DIR:
        if entry.existed:
            return
        os.mkdir(entry.target_path)
        return
    # Write through a sibling scratch file and replace: a failed write leaves
    # either the previous bytes or the new ones, never a truncated target.
    with open(entry.temp_path, "wb") as handle:
        handle.write(entry.payload)
    os.replace(entry.temp_path, entry.target_path)


def apply_plan(plan, backup_root=None, rollback_on_failure=True):
    """Apply a READY B6 deployment plan to the plan's explicit deployment root.

    plan                 a READY wrkdeployplan.DeploymentPlan. A blocked plan
                         is refused.
    backup_root          explicit directory outside the deployment root for
                         rollback material. Required only when a target
                         already exists as a file.
    rollback_on_failure  unwind the journal when an operation fails (default).
                         Pass False only when an operator wants the partial
                         state preserved for inspection — the receipt then
                         says `failed` with `mutated` true and names exactly
                         how far it got.

    Returns an ApplyReceipt. Never raises for an input fault: a refusal and a
    failure are both structured, inspectable results, because an exception
    escaping here would take the record of what was already written with it.
    """
    transaction = preflight(plan, backup_root=backup_root)

    def receipt(**over):
        base = dict(
            status=APPLY_FAILED, mutated=False, refused_before_mutation=False,
            backup_dir_created=False,
            plan_digest=transaction.plan_digest,
            plan_status=transaction.plan_status,
            manifest_version=transaction.manifest_version,
            target_release=transaction.target_release,
            stack=transaction.stack,
            archive_root=transaction.archive_root,
            deployment_root=transaction.deployment_root,
            backup_root=transaction.backup_root,
            backup_dir=transaction.backup_dir,
            applied=tuple(), skipped=transaction.skipped_projections,
            refused=transaction.refused_projections,
            written_files=tuple(), created_dirs=tuple(),
            preserved_surfaces=transaction.preserved_surfaces,
            pre_existing_targets=transaction.pre_existing_targets,
            entries=transaction.entries, journal=tuple(), failed_entry=None,
            rollback=None, refusals=transaction.refusals,
            diagnostics=transaction.diagnostics)
        base.update(over)
        return ApplyReceipt(**base)

    if not transaction.is_ready:
        return receipt(
            status=APPLY_FAILED, refused_before_mutation=True,
            diagnostics=transaction.diagnostics + (
                f"refused before mutation: {list(transaction.refusal_codes)}; "
                f"nothing was written to {transaction.deployment_root!r}",))

    diagnostics = list(transaction.diagnostics)
    failures = []
    backup_dir_created = False
    journal = []
    mutated = False

    # Phase 1: capture ALL rollback material first. Until every previous byte
    # is safely stored, no target is touched — a store that is only half built
    # is a rollback that is only half possible.
    needs_backup = transaction.requires_backup()
    if needs_backup:
        try:
            os.makedirs(transaction.backup_dir, exist_ok=True)
            backup_dir_created = True
            for entry in needs_backup:
                _write_backup(entry)
        except OSError as exc:
            failures.append(Refusal(FAIL_BACKUP_CAPTURE, None, str(exc)))
            diagnostics.append(
                f"rollback material could not be captured ({exc}); the "
                f"deployment root was not touched")
            return receipt(status=APPLY_FAILED, mutated=False,
                           backup_dir_created=backup_dir_created,
                           refusals=tuple(failures),
                           diagnostics=tuple(diagnostics))

    # Phase 2: perform the transaction in its computed order. Every entry is
    # journalled BEFORE it is attempted, so a half-performed operation is
    # still something rollback knows to look at.
    failed_entry = None
    for entry in transaction.entries:
        journal.append(entry.seq)
        try:
            _perform(entry)
            if not (entry.operation == OP_CREATE_DIR and entry.existed):
                mutated = True
        except OSError as exc:
            failed_entry = entry.seq
            failures.append(Refusal(
                FAIL_OPERATION, entry.projection_id,
                f"{entry.operation} {entry.target!r}: {exc}"))
            diagnostics.append(
                f"entry {entry.seq} ({entry.operation} {entry.target!r}) "
                f"failed: {exc}")
            break

    attempted = set(journal)
    performed = [e for e in transaction.entries if e.seq in attempted]
    written = tuple(e.target for e in performed
                    if e.operation == OP_WRITE_FILE and e.seq != failed_entry)
    created = tuple(e.target for e in performed
                    if e.operation == OP_CREATE_DIR and not e.existed
                    and e.seq != failed_entry)
    touched = {e.projection_id for e in performed if e.seq != failed_entry}

    if failed_entry is None:
        return receipt(
            status=APPLY_SUCCESS, mutated=mutated,
            backup_dir_created=backup_dir_created,
            applied=tuple(pid for pid in transaction.planned_projections
                          if pid in touched),
            written_files=written, created_dirs=created,
            journal=tuple(journal), diagnostics=tuple(diagnostics))

    # Phase 3: a partial write is never a success.
    if not rollback_on_failure:
        diagnostics.append(
            f"rollback was not attempted; {transaction.deployment_root!r} is "
            f"PARTIALLY WRITTEN and holds {len(written)} file(s) and "
            f"{len(created)} directory/ies from this transaction")
        return receipt(
            status=APPLY_FAILED, mutated=mutated,
            backup_dir_created=backup_dir_created,
            applied=tuple(), written_files=written, created_dirs=created,
            journal=tuple(journal), failed_entry=failed_entry,
            rollback=RollbackResult(
                status=ROLLBACK_NOT_ATTEMPTED, restored=tuple(),
                removed_files=tuple(), removed_dirs=tuple(),
                removed_temps=tuple(), already_clean=tuple(),
                retained_dirs=tuple(), failures=tuple(),
                diagnostics=("rollback_on_failure was false",)),
            refusals=tuple(failures), diagnostics=tuple(diagnostics))

    undo = rollback(performed)
    diagnostics.append(
        f"rollback {undo.status}: restored {len(undo.restored)}, removed "
        f"{len(undo.removed_files)} file(s) and {len(undo.removed_dirs)} "
        f"directory/ies")
    return receipt(
        status=APPLY_ROLLED_BACK if undo.is_complete
        else APPLY_ROLLBACK_FAILED,
        mutated=mutated, backup_dir_created=backup_dir_created,
        applied=tuple(), written_files=written, created_dirs=created,
        journal=tuple(journal), failed_entry=failed_entry, rollback=undo,
        refusals=tuple(failures), diagnostics=tuple(diagnostics))


# --- rollback ---------------------------------------------------------------

def rollback(entries):
    """Undo performed transaction entries, last first.

    `entries` are the entries an apply actually attempted, in attempt order;
    they are unwound in reverse, so a child is always removed before the
    directory that holds it.

    Idempotent where practical: an entry whose target is already back in its
    prior state is reported as `already_clean` and left alone, so calling this
    twice — or after a partially successful rollback — is safe.
    """
    restored = []
    removed_files = []
    removed_dirs = []
    removed_temps = []
    already_clean = []
    retained_dirs = []
    failures = []
    diagnostics = []

    for entry in reversed(list(entries)):
        # A failed write-then-replace can leave the scratch file behind. It is
        # ours, it is named in the transaction, and it goes first.
        if entry.temp_path:
            try:
                if os.path.lexists(entry.temp_path) \
                        and not os.path.isdir(entry.temp_path):
                    os.remove(entry.temp_path)
                    removed_temps.append(entry.temp_path)
            except OSError as exc:
                failures.append(Refusal(
                    FAIL_TEMP_REMOVAL, entry.projection_id,
                    f"{entry.temp_path}: {exc}"))

        if entry.undo == UNDO_NONE:
            already_clean.append(entry.target)
            continue

        try:
            if entry.undo == UNDO_RESTORE_FILE:
                current = _sha256_file(entry.target_path)
                if current == entry.pre_sha256:
                    already_clean.append(entry.target)
                    continue
                material = _sha256_file(entry.backup_path)
                if material is None:
                    failures.append(Refusal(
                        FAIL_MATERIAL_MISSING, entry.projection_id,
                        f"{entry.target!r}: rollback material "
                        f"{entry.backup_path!r} is not a readable file"))
                    continue
                if material != entry.pre_sha256:
                    failures.append(Refusal(
                        FAIL_MATERIAL_MISMATCH, entry.projection_id,
                        f"{entry.target!r}: rollback material digests "
                        f"{material}, previous content digested "
                        f"{entry.pre_sha256}; refusing to restore content that "
                        f"is not what was there"))
                    continue
                shutil.copyfile(entry.backup_path, entry.target_path)
                restored.append(entry.target)

            elif entry.undo == UNDO_REMOVE_FILE:
                if not os.path.lexists(entry.target_path):
                    already_clean.append(entry.target)
                    continue
                if os.path.isdir(entry.target_path) \
                        and not os.path.islink(entry.target_path):
                    failures.append(Refusal(
                        FAIL_KIND_CHANGED, entry.projection_id,
                        f"{entry.target!r} is now a directory; this engine "
                        f"created a file there and will not remove a directory "
                        f"it did not create"))
                    continue
                current = _sha256_file(entry.target_path)
                if current is not None and entry.payload_sha256 is not None \
                        and current != entry.payload_sha256:
                    diagnostics.append(
                        f"{entry.target!r} was modified after it was written "
                        f"(digests {current}, this apply wrote "
                        f"{entry.payload_sha256}); removing it anyway, because "
                        f"its prior state was absence")
                os.remove(entry.target_path)
                removed_files.append(entry.target)

            elif entry.undo == UNDO_REMOVE_DIR:
                if not os.path.lexists(entry.target_path):
                    already_clean.append(entry.target)
                    continue
                if not os.path.isdir(entry.target_path) \
                        or os.path.islink(entry.target_path):
                    failures.append(Refusal(
                        FAIL_KIND_CHANGED, entry.projection_id,
                        f"{entry.target!r} is no longer a plain directory; "
                        f"refusing to remove it"))
                    continue
                try:
                    os.rmdir(entry.target_path)
                    removed_dirs.append(entry.target)
                except OSError:
                    # Non-empty: it now holds content this transaction did not
                    # create. Removing it would destroy someone else's data,
                    # so it stays — and the rollback is honestly incomplete.
                    retained_dirs.append(entry.target)
                    diagnostics.append(
                        f"{entry.target!r} was created by this transaction but "
                        f"now holds content the transaction did not create; "
                        f"retained rather than deleted")
        except OSError as exc:
            failures.append(Refusal(FAIL_ROLLBACK, entry.projection_id,
                                    f"{entry.target!r}: {exc}"))

    status = ROLLBACK_INCOMPLETE if (failures or retained_dirs) \
        else ROLLBACK_COMPLETE

    return RollbackResult(
        status=status, restored=tuple(restored),
        removed_files=tuple(removed_files), removed_dirs=tuple(removed_dirs),
        removed_temps=tuple(removed_temps),
        already_clean=tuple(already_clean), retained_dirs=tuple(retained_dirs),
        failures=tuple(failures), diagnostics=tuple(diagnostics))


def rollback_receipt(receipt):
    """Undo the apply a receipt describes, from the receipt's own journal.

    This is the operator-facing path for undoing a `success` after the fact,
    and for re-running an incomplete rollback. It reads only what the receipt
    records, so it needs neither the plan nor the archive.
    """
    return rollback(receipt.journal_entries())


# --- durable receipt --------------------------------------------------------

def render_receipt(receipt):
    """Deterministic receipt bytes, without writing anything."""
    return receipt.to_json()


def write_receipt(receipt, path):
    """Write a receipt to an EXPLICIT path. Returns the Path written.

    The path is the caller's: a receipt is evidence, and where evidence lives
    is an operator decision, not something this engine may invent inside a
    deployment root it has just finished writing. Raises OSError if the write
    cannot be completed — a receipt that silently failed to persist is worse
    than no receipt at all.
    """
    target = Path(path)
    parent = target.parent
    if str(parent) and not parent.exists():
        os.makedirs(str(parent), exist_ok=True)
    temp = Path(str(target) + TEMP_SUFFIX)
    with open(str(temp), "wb") as handle:
        handle.write(receipt.to_json())
    os.replace(str(temp), str(target))
    return target
