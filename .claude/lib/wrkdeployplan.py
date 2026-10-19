#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
CCOS WRKOPS 1.8.2 — wrkdeployplan (deterministic read-only deployment planner)
==============================================================================
B6. The layer between the deployment manifest and an actual deployment.

    DEPLOYMENT_MANIFEST.json
  + an explicit archive root
  + an explicit deployment root
  + the B5 settings composer
  -----------------------------------------------------------------
  = a deterministic, fully inspectable, READ-ONLY deployment plan

B6 PLANS. B7 APPLIES. Nothing in this module writes, creates, deletes, moves
or renames anything. There is deliberately no apply entrypoint, no transaction
journal, no receipt and no rollback — those are B7's contract, and a planner
that can also apply is a planner that deploys by accident. The single
"near-write" this module performs is holding the composed
`.claude/settings.json` bytes in memory, so that a plan can be inspected
before anyone is allowed to materialise them.

Why an EXPLICIT deployment root, and never cwd
----------------------------------------------
The manifest itself declares `"deployment_root": "${WORKSPACE_ROOT}"` — a
placeholder, on purpose: an archive must not hardcode the machine it will be
installed onto. Something has to supply the real one, and the one thing that
must NEVER supply it is the current working directory. `Path(x).resolve()` on
a relative value silently answers "wherever this process happens to be
standing", which is how a deployment lands in the wrong tree while every log
line still looks correct. So both roots are caller-supplied, and both are held
to wrkroot's F024/F031 classification: absolute, existing, no unresolved
placeholder token. Anything else is `deployment_root_unresolved` and the plan
is BLOCKED — it never falls back, never guesses, and never widens.

This is stricter than `wrkroot.resolve_workspace_root()` on purpose. That
resolver exists for hooks, which legitimately read their root from the
environment. A deployment planner has no such licence: an env var that happens
to be set is not an operator saying "deploy into this tree".

Fail-closed classification
--------------------------
Every projection in the manifest is classified, and every defect is reported
as a named blocker rather than an exception, so one bad projection cannot hide
the other ninety. `plan_deployment()` therefore never raises for an input
fault — it returns a plan whose `status` is `blocked` and whose `blockers`
name every reason. Only `load_manifest()` raises, because a manifest that
cannot be read is not a plan with problems, it is the absence of a plan.

The archive is never walked. The manifest is the only list of files this
module will ever consult, so a plan describes exactly what was declared and
nothing a directory scan happened to turn up.

Dependency law: standard library only, plus the sibling modules `wrkroot`
(root classification) and `wrksettings` (B5 composition). CLAUDECLI.2.02
NO_INSTALL forbids pip dependencies in shipped code.
"""
import fnmatch
import hashlib
import json
import os
import re
import sys
from dataclasses import dataclass, replace
from pathlib import Path
from typing import Optional, Tuple

_HERE = Path(__file__).resolve().parent
if str(_HERE) not in sys.path:
    sys.path.insert(0, str(_HERE))

import wrkroot
import wrksettings

__version__ = "1.0.0"

__all__ = [
    "DeployPlanError",
    "DeploymentPlan",
    "PlannedProjection",
    "SourceCheck",
    "MANIFEST_FILENAME",
    "SETTINGS_SCHEMA_SOURCE",
    "SETTINGS_BASE_FILENAME",
    "BASE_STACK",
    "HASH_ALGORITHM",
    "PLAN_READY",
    "PLAN_BLOCKED",
    "PLAN_STATUSES",
    "PROJ_PLANNED",
    "PROJ_ARCHIVE_ONLY",
    "PROJ_PRESERVED",
    "PROJ_BLOCKED",
    "PROJECTION_STATUSES",
    "ACTION_COPY_FILE",
    "ACTION_MATERIALIZE_FILE",
    "ACTION_COMPOSE_FILE",
    "ACTION_CREATE_DIR",
    "ACTION_PRESERVE",
    "ACTION_NONE",
    "ACTIONS",
    "ROOT_EXPLICIT",
    "ROOT_UNRESOLVED",
    "BLOCK_MANIFEST_MALFORMED",
    "BLOCK_UNSUPPORTED_HASH_ALGORITHM",
    "BLOCK_ARCHIVE_ROOT_UNRESOLVED",
    "BLOCK_DEPLOYMENT_ROOT_UNRESOLVED",
    "BLOCK_MALFORMED_PROJECTION",
    "BLOCK_UNSUPPORTED_KIND",
    "BLOCK_SOURCE_MISSING",
    "BLOCK_SOURCE_SHA256_MISMATCH",
    "BLOCK_TARGET_ESCAPES_ROOT",
    "BLOCK_DUPLICATE_TARGET",
    "BLOCK_PRESERVE_OVERWRITE",
    "BLOCK_SETTINGS_STACK_UNKNOWN",
    "BLOCK_SETTINGS_COMPOSE_FAILED",
    "BLOCKERS",
    "KIND_ACTIONS",
    "SUPPORTED_KINDS",
    "DEPLOYING_KINDS",
    "PRIVACY_CLASSES",
    "sha256_bytes",
    "sha256_file",
    "load_manifest",
    "validate_manifest",
    "resolve_archive_root",
    "resolve_deployment_root",
    "normalize_target",
    "join_target",
    "stack_name",
    "manifest_stacks",
    "preserve_surfaces",
    "matches_preserve",
    "plan_deployment",
]

# --- frozen vocabulary ------------------------------------------------------

MANIFEST_FILENAME = "DEPLOYMENT_MANIFEST.json"

# The composed-settings schema. The manifest independently declares and
# hash-verifies this same path as its `b5.schema.settings` projection, so the
# constant here is a lookup convenience, not a second source of truth.
SETTINGS_SCHEMA_SOURCE = "library/schemas/settings.schema.json"

SETTINGS_BASE_FILENAME = "settings.base.json"
BASE_STACK = "base"

# The only digest this planner can verify. A manifest that declares another
# one is not "probably fine" — it is unverifiable, and says so.
HASH_ALGORITHM = "sha256"

# Plan-level outcome.
PLAN_READY = "ready"
PLAN_BLOCKED = "blocked"
PLAN_STATUSES = (PLAN_READY, PLAN_BLOCKED)

# Per-projection outcome.
PROJ_PLANNED = "planned"            # B7 would act on this
PROJ_ARCHIVE_ONLY = "archive_only"  # verified, deliberately not deployed
PROJ_PRESERVED = "preserved"        # declared no-touch surface
PROJ_BLOCKED = "blocked"            # a defect was found; B7 must not proceed
PROJECTION_STATUSES = (PROJ_PLANNED, PROJ_ARCHIVE_ONLY, PROJ_PRESERVED,
                       PROJ_BLOCKED)

# The operation a B7 applier WOULD perform. Named as intent; never performed
# here.
ACTION_COPY_FILE = "copy_file"
ACTION_MATERIALIZE_FILE = "materialize_file"
ACTION_COMPOSE_FILE = "compose_file"
ACTION_CREATE_DIR = "create_dir"
ACTION_PRESERVE = "preserve"
ACTION_NONE = "none"
ACTIONS = (ACTION_COPY_FILE, ACTION_MATERIALIZE_FILE, ACTION_COMPOSE_FILE,
           ACTION_CREATE_DIR, ACTION_PRESERVE, ACTION_NONE)

# Root resolution outcome.
ROOT_EXPLICIT = "explicit"
ROOT_UNRESOLVED = "unresolved"

# Blocker vocabulary. Every rejection path in this module names exactly one of
# these; nothing is reported as free prose alone.
BLOCK_MANIFEST_MALFORMED = "manifest_malformed"
BLOCK_UNSUPPORTED_HASH_ALGORITHM = "unsupported_hash_algorithm"
BLOCK_ARCHIVE_ROOT_UNRESOLVED = "archive_root_unresolved"
BLOCK_DEPLOYMENT_ROOT_UNRESOLVED = "deployment_root_unresolved"
BLOCK_MALFORMED_PROJECTION = "malformed_projection"
BLOCK_UNSUPPORTED_KIND = "unsupported_projection_kind"
BLOCK_SOURCE_MISSING = "source_missing"
BLOCK_SOURCE_SHA256_MISMATCH = "source_sha256_mismatch"
BLOCK_TARGET_ESCAPES_ROOT = "target_escapes_deployment_root"
BLOCK_DUPLICATE_TARGET = "duplicate_target_collision"
BLOCK_PRESERVE_OVERWRITE = "preserve_surface_overwrite"
BLOCK_SETTINGS_STACK_UNKNOWN = "settings_stack_unknown"
BLOCK_SETTINGS_COMPOSE_FAILED = "settings_composition_failed"

BLOCKERS = (
    BLOCK_MANIFEST_MALFORMED,
    BLOCK_UNSUPPORTED_HASH_ALGORITHM,
    BLOCK_ARCHIVE_ROOT_UNRESOLVED,
    BLOCK_DEPLOYMENT_ROOT_UNRESOLVED,
    BLOCK_MALFORMED_PROJECTION,
    BLOCK_UNSUPPORTED_KIND,
    BLOCK_SOURCE_MISSING,
    BLOCK_SOURCE_SHA256_MISMATCH,
    BLOCK_TARGET_ESCAPES_ROOT,
    BLOCK_DUPLICATE_TARGET,
    BLOCK_PRESERVE_OVERWRITE,
    BLOCK_SETTINGS_STACK_UNKNOWN,
    BLOCK_SETTINGS_COMPOSE_FAILED,
)

# Manifest `kind` -> the operation it implies. An unlisted kind is refused
# rather than ignored: silently skipping a projection nobody understands is
# how a deployment quietly ships incomplete.
KIND_ACTIONS = {
    "copy": ACTION_COPY_FILE,
    "mirror": ACTION_COPY_FILE,
    "materialize": ACTION_MATERIALIZE_FILE,
    "compose": ACTION_COMPOSE_FILE,
    "scaffold": ACTION_CREATE_DIR,
    "preserve": ACTION_PRESERVE,
    "not_deployed": ACTION_NONE,
}
SUPPORTED_KINDS = tuple(sorted(KIND_ACTIONS))

# Kinds that put something into the deployment root. The target laws (escape,
# collision, preserve) apply to exactly these.
DEPLOYING_KINDS = ("compose", "copy", "materialize", "mirror", "scaffold")

# Kinds carrying a single `source` + `source_sha256` pair.
_SINGLE_SOURCE_KINDS = ("copy", "mirror", "materialize", "not_deployed")

PRIVACY_CLASSES = ("archive_only", "operator_local_private", "product_public")

_SHA256_RE = re.compile(r"^[0-9a-f]{64}$")
_DRIVE_ABS_RE = re.compile(r"^[A-Za-z]:[\\/]")
_STACK_RE = re.compile(r"^settings\.(.+)\.json$")

# Read size for digesting. Large enough to be cheap, small enough that a
# multi-megabyte wiki payload never lands in memory whole.
_CHUNK = 65536


class DeployPlanError(Exception):
    """Raised only when there is no plan to speak of — an unreadable or
    un-parseable manifest. Every other defect is a named blocker on a returned
    plan, so one bad projection cannot hide the rest."""


# --- digests ----------------------------------------------------------------

def sha256_bytes(data):
    """Lowercase hex SHA256 of a bytes object."""
    return hashlib.sha256(data).hexdigest()


def sha256_file(path):
    """Lowercase hex SHA256 of a file, read in chunks.

    Returns None if the path is not an existing readable file. Absence is a
    classification outcome here, not an exception: the planner's job is to
    REPORT a missing source, not to die on the first one it meets.
    """
    p = Path(path)
    try:
        if not p.is_file():
            return None
        digest = hashlib.sha256()
        with p.open("rb") as handle:
            for chunk in iter(lambda: handle.read(_CHUNK), b""):
                digest.update(chunk)
        return digest.hexdigest()
    except OSError:
        return None


# --- manifest ---------------------------------------------------------------

def load_manifest(path):
    """Read one deployment manifest, strictly. Raises DeployPlanError.

    Encoding is strict for the same reason wrksettings' loader is: a manifest
    we cannot decode is a manifest we cannot trust, and `errors='replace'`
    would plan a deployment out of corruption.
    """
    p = Path(path)
    if not p.is_file():
        raise DeployPlanError(f"deployment manifest not found: {path}")
    try:
        text = p.read_text(encoding="utf-8")
    except UnicodeDecodeError as exc:
        raise DeployPlanError(f"{path} is not valid UTF-8: {exc}")
    except OSError as exc:
        raise DeployPlanError(f"cannot read {path}: {exc}")
    try:
        return json.loads(text)
    except json.JSONDecodeError as exc:
        raise DeployPlanError(f"{path} is not valid JSON: {exc}")


def validate_manifest(manifest):
    """Structural checks on the manifest as a whole. Returns errors; [] == ok.

    Per-projection validation is deliberately NOT done here — it belongs to
    planning, where each defect can be attributed to the projection carrying
    it instead of collapsing into one anonymous "manifest is bad".
    """
    errors = []
    if not isinstance(manifest, dict):
        return ["deployment manifest must be a JSON object"]
    for key in ("manifest_version", "target_release", "hash_algorithm"):
        value = manifest.get(key)
        if not isinstance(value, str) or not value.strip():
            errors.append(f"manifest {key!r}: must be a non-empty string")
    projections = manifest.get("projections")
    if not isinstance(projections, list):
        errors.append("manifest 'projections': must be a list")
    elif not projections:
        errors.append("manifest 'projections': must not be empty")
    return errors


# --- explicit root resolution -----------------------------------------------

def _classify_explicit(label, value):
    """Hold one caller-supplied root to wrkroot's F024/F031 rules.

    Stricter than `wrkroot.resolve_workspace_root()` by design: "empty" and
    "placeholder" are refusals here, not licences to consult the environment.
    A deployment target is declared, or it does not exist.
    """
    if value is None:
        raw = ""
    elif isinstance(value, Path):
        raw = str(value)
    elif isinstance(value, str):
        raw = value.strip()
    else:
        return None, ROOT_UNRESOLVED, [
            f"{label} must be a path or string, got {type(value).__name__}"]

    kind, reason = wrkroot.classify_root(raw)
    if kind == "valid":
        return Path(raw), ROOT_EXPLICIT, []
    if kind == "empty":
        return None, ROOT_UNRESOLVED, [
            f"{label} was not supplied. A deployment root is never inferred "
            f"from the current working directory or the environment; it must "
            f"be declared explicitly."]
    return None, ROOT_UNRESOLVED, [
        f"{label}={raw!r} {wrkroot.UNUSABLE_MESSAGES[reason]}. This planner "
        f"fails closed rather than widening to a root the caller never named."]


def resolve_archive_root(value):
    """(Path|None, status, diagnostics) for the explicit archive root."""
    return _classify_explicit("archive root", value)


def resolve_deployment_root(value):
    """(Path|None, status, diagnostics) for the explicit deployment root."""
    return _classify_explicit("deployment root", value)


# --- target laws ------------------------------------------------------------

def normalize_target(target):
    """(deployment-root-relative posix path, error) for a declared target.

    Lexical only — no filesystem is consulted, so the same manifest normalises
    identically on any machine. An absolute target, or one whose `..` segments
    climb past the root, is an escape and is refused.
    """
    if not isinstance(target, str) or not target.strip():
        return None, "target must be a non-empty string"
    raw = target.strip().replace("\\", "/")
    if raw.startswith("/") or _DRIVE_ABS_RE.match(raw):
        return None, (f"target {target!r} is absolute; manifest targets are "
                      f"deployment-root-relative")
    parts = []
    for segment in raw.split("/"):
        if segment in ("", "."):
            continue
        if segment == "..":
            if not parts:
                return None, f"target {target!r} escapes the deployment root"
            parts.pop()
            continue
        parts.append(segment)
    if not parts:
        return None, (f"target {target!r} normalises to the deployment root "
                      f"itself, which is not a projection target")
    return "/".join(parts), None


def join_target(root, normalized):
    """(absolute path, error) for a normalised target under `root`.

    Belt-and-braces containment re-check against the joined path, so a target
    that survived lexical normalisation still cannot land outside the root.
    """
    root_norm = os.path.normpath(str(root))
    joined = os.path.normpath(os.path.join(root_norm, normalized))
    if joined != root_norm and not joined.startswith(root_norm + os.sep):
        return None, (f"target {normalized!r} resolves outside the deployment "
                      f"root")
    return joined, None


# --- preserve surfaces ------------------------------------------------------

def preserve_surfaces(manifest):
    """[(projection id, declared path pattern)] for every `preserve` kind."""
    surfaces = []
    projections = manifest.get("projections") if isinstance(manifest, dict) \
        else None
    if not isinstance(projections, list):
        return surfaces
    for entry in projections:
        if not isinstance(entry, dict) or entry.get("kind") != "preserve":
            continue
        path = entry.get("path")
        if isinstance(path, str) and path.strip():
            surfaces.append((entry.get("id"), path.strip().replace("\\", "/")))
    return surfaces


def matches_preserve(target, pattern):
    """True if a normalised target falls inside a preserve surface.

    A trailing `/**` means STRICT descendants. That distinction is load-bearing
    in this archive: the manifest deliberately declares both a `scaffold` of
    `_wrkops/reports` and a `preserve` of `_wrkops/reports/**`. Creating the
    directory is not overwriting the reports inside it, and a matcher that
    conflated the two would block every clean plan this archive can produce.
    """
    if not isinstance(target, str) or not isinstance(pattern, str):
        return False
    if pattern.endswith("/**"):
        return target.startswith(pattern[:-3] + "/")
    return fnmatch.fnmatchcase(target, pattern)


# --- settings sources -------------------------------------------------------

def stack_name(path):
    """Stack name behind a `settings.<stack>.json` source path, or None."""
    if not isinstance(path, str) or not path.strip():
        return None
    basename = path.strip().replace("\\", "/").rsplit("/", 1)[-1]
    match = _STACK_RE.match(basename)
    return match.group(1) if match else None


def manifest_stacks(manifest):
    """Sorted stack names the manifest's compose projection offers (no base)."""
    names = set()
    projections = manifest.get("projections") if isinstance(manifest, dict) \
        else None
    if not isinstance(projections, list):
        return tuple()
    for entry in projections:
        if not isinstance(entry, dict) or entry.get("kind") != "compose":
            continue
        for source in entry.get("sources") or []:
            if not isinstance(source, dict):
                continue
            name = stack_name(source.get("path"))
            if name and name != BASE_STACK:
                names.add(name)
    return tuple(sorted(names))


# --- structured plan surface ------------------------------------------------

@dataclass(frozen=True)
class SourceCheck:
    """One archive source, as the manifest declares it and as it actually is."""
    path: str
    declared_sha256: str
    exists: bool
    actual_sha256: Optional[str]
    ok: bool

    def to_dict(self):
        return {
            "path": self.path,
            "declared_sha256": self.declared_sha256,
            "exists": self.exists,
            "actual_sha256": self.actual_sha256,
            "ok": self.ok,
        }


@dataclass(frozen=True)
class PlannedProjection:
    """One manifest projection, fully classified against both roots."""
    id: str
    kind: str
    role: str
    privacy_class: str
    mutable: Optional[bool]
    generated: Optional[bool]
    hook_event: Optional[str]
    action: str
    status: str
    sources: Tuple[SourceCheck, ...]
    target: Optional[str]
    target_path: Optional[str]
    target_exists: bool
    preserve_path: Optional[str]
    stack: Optional[str]
    planned_bytes: Optional[bytes]
    planned_sha256: Optional[str]
    planned_size: Optional[int]
    blockers: Tuple[str, ...]
    notes: Tuple[str, ...]

    @property
    def is_blocked(self):
        return self.status == PROJ_BLOCKED

    def to_dict(self):
        """Deterministic, JSON-safe view. Composed bytes appear as their digest
        and length only — a plan is for reading, not for carrying a payload."""
        return {
            "id": self.id,
            "kind": self.kind,
            "role": self.role,
            "privacy_class": self.privacy_class,
            "mutable": self.mutable,
            "generated": self.generated,
            "hook_event": self.hook_event,
            "action": self.action,
            "status": self.status,
            "sources": [s.to_dict() for s in self.sources],
            "target": self.target,
            "target_path": self.target_path,
            "target_exists": self.target_exists,
            "preserve_path": self.preserve_path,
            "stack": self.stack,
            "planned_sha256": self.planned_sha256,
            "planned_size": self.planned_size,
            "blockers": list(self.blockers),
            "notes": list(self.notes),
        }


@dataclass(frozen=True)
class DeploymentPlan:
    """The whole read-only plan.

    `status` is `ready` only when NOTHING is blocked: a plan with one unsafe
    projection is an unsafe plan, and partial application is precisely the
    failure mode B7's transaction layer will exist to avoid.
    """
    status: str
    archive_root: Optional[str]
    archive_root_status: str
    deployment_root: Optional[str]
    deployment_root_status: str
    stack: Optional[str]
    manifest_version: Optional[str]
    target_release: Optional[str]
    hash_algorithm: Optional[str]
    declared_archive_root: Optional[str]
    declared_deployment_root: Optional[str]
    available_stacks: Tuple[str, ...]
    projections: Tuple[PlannedProjection, ...]
    blockers: Tuple[str, ...]
    diagnostics: Tuple[str, ...]

    @property
    def is_ready(self):
        return self.status == PLAN_READY

    def by_id(self, projection_id):
        for projection in self.projections:
            if projection.id == projection_id:
                return projection
        return None

    def by_status(self, status):
        return tuple(p for p in self.projections if p.status == status)

    def by_kind(self, kind):
        return tuple(p for p in self.projections if p.kind == kind)

    def blocked(self):
        return self.by_status(PROJ_BLOCKED)

    def planned_targets(self):
        """{normalised target: projection id} for everything B7 would touch.

        Blocked projections are excluded: a target nobody may write is not a
        planned target.
        """
        return {p.target: p.id for p in self.projections
                if p.status == PROJ_PLANNED and p.target}

    def to_dict(self):
        return {
            "status": self.status,
            "archive_root": self.archive_root,
            "archive_root_status": self.archive_root_status,
            "deployment_root": self.deployment_root,
            "deployment_root_status": self.deployment_root_status,
            "stack": self.stack,
            "manifest_version": self.manifest_version,
            "target_release": self.target_release,
            "hash_algorithm": self.hash_algorithm,
            "declared_archive_root": self.declared_archive_root,
            "declared_deployment_root": self.declared_deployment_root,
            "available_stacks": list(self.available_stacks),
            "projections": [p.to_dict() for p in self.projections],
            "blockers": list(self.blockers),
            "diagnostics": list(self.diagnostics),
        }

    def to_json(self):
        """Deterministic UTF-8 bytes, same rendering contract as B5's output:
        LF, two-space indent, sorted keys, one final LF. Two plans over
        identical inputs render byte-identically."""
        text = json.dumps(self.to_dict(), indent=2, sort_keys=True,
                          ensure_ascii=False, separators=(",", ": "))
        return (text + "\n").encode("utf-8")


# --- projection shape -------------------------------------------------------

def _field_errors(entry, seen_ids):
    """Shape errors common to every projection kind."""
    errors = []
    pid = entry.get("id")
    if not isinstance(pid, str) or not pid.strip():
        errors.append("'id' must be a non-empty string")
    elif pid in seen_ids:
        errors.append(f"duplicate projection id {pid!r}")
    role = entry.get("role")
    if not isinstance(role, str) or not role.strip():
        errors.append("'role' must be a non-empty string")
    privacy = entry.get("privacy_class")
    if privacy not in PRIVACY_CLASSES:
        errors.append(f"'privacy_class' must be one of "
                      f"{list(PRIVACY_CLASSES)}, got {privacy!r}")
    for key in ("mutable", "generated"):
        if not isinstance(entry.get(key), bool):
            errors.append(f"{key!r} must be a boolean")
    return errors


def _kind_shape_errors(entry, kind):
    """Shape errors specific to one kind."""
    errors = []
    target = entry.get("target")
    has_target = bool(isinstance(target, str) and target.strip())

    if kind in _SINGLE_SOURCE_KINDS:
        source = entry.get("source")
        if not isinstance(source, str) or not source.strip():
            errors.append("'source' must be a non-empty string")
        digest = entry.get("source_sha256")
        if not isinstance(digest, str) or not _SHA256_RE.match(digest):
            errors.append("'source_sha256' must be 64 lowercase hex characters")
        if kind == "not_deployed" and has_target:
            errors.append("a 'not_deployed' projection must declare no 'target'")
        if kind != "not_deployed" and not has_target:
            errors.append("'target' must be a non-empty string")

    elif kind == "compose":
        if not has_target:
            errors.append("'target' must be a non-empty string")
        sources = entry.get("sources")
        if not isinstance(sources, list) or not sources:
            errors.append("'sources' must be a non-empty list")
        else:
            for i, source in enumerate(sources):
                if not isinstance(source, dict):
                    errors.append(f"sources[{i}] must be an object")
                    continue
                path = source.get("path")
                if not isinstance(path, str) or not path.strip():
                    errors.append(f"sources[{i}].path must be a non-empty "
                                  f"string")
                digest = source.get("sha256")
                if not isinstance(digest, str) or not _SHA256_RE.match(digest):
                    errors.append(f"sources[{i}].sha256 must be 64 lowercase "
                                  f"hex characters")

    elif kind == "scaffold":
        if not has_target:
            errors.append("'target' must be a non-empty string")
        if entry.get("source") is not None:
            errors.append("a 'scaffold' projection declares no 'source'")

    elif kind == "preserve":
        path = entry.get("path")
        if not isinstance(path, str) or not path.strip():
            errors.append("'path' must be a non-empty string")
        if has_target:
            errors.append("a 'preserve' projection declares 'path', not "
                          "'target'")

    return errors


def _declared_sources(entry, kind):
    """[(archive-relative path, declared sha256)] for one projection."""
    if kind in _SINGLE_SOURCE_KINDS:
        return [(entry.get("source"), entry.get("source_sha256"))]
    if kind == "compose":
        return [(s.get("path"), s.get("sha256"))
                for s in (entry.get("sources") or []) if isinstance(s, dict)]
    return []


def _check_sources(archive_root, declared):
    """(tuple of SourceCheck, blocker codes) for one projection's sources."""
    checks = []
    blockers = []
    for path, declared_sha in declared:
        if not isinstance(path, str) or not path.strip():
            continue
        rel = path.strip().replace("\\", "/")
        actual = sha256_file(Path(archive_root) / rel)
        exists = actual is not None
        ok = bool(exists and actual == declared_sha)
        if not exists:
            if BLOCK_SOURCE_MISSING not in blockers:
                blockers.append(BLOCK_SOURCE_MISSING)
        elif not ok:
            if BLOCK_SOURCE_SHA256_MISMATCH not in blockers:
                blockers.append(BLOCK_SOURCE_SHA256_MISMATCH)
        checks.append(SourceCheck(
            path=rel,
            declared_sha256=declared_sha if isinstance(declared_sha, str) else "",
            exists=exists, actual_sha256=actual, ok=ok))
    return tuple(checks), blockers


def _compose_settings(archive_root, manifest, checks, stack, deployment_root,
                      python_path):
    """Plan the `.claude/settings.json` bytes through the B5 composer.

    Returns (bytes|None, stack_used|None, blockers, notes). This is the closest
    B6 comes to deploying: bytes in memory, attached to the plan, never
    written. The composer itself is unchanged — B6 selects and verifies its
    inputs, it does not reimplement composition.
    """
    blockers = []
    notes = []

    by_stack = {}
    for check in checks:
        name = stack_name(check.path)
        if name:
            by_stack[name] = check

    base_check = by_stack.get(BASE_STACK)
    if base_check is None:
        blockers.append(BLOCK_SETTINGS_COMPOSE_FAILED)
        notes.append(f"compose sources declare no {SETTINGS_BASE_FILENAME}")
        return None, None, blockers, notes

    if not isinstance(stack, str) or not stack.strip():
        blockers.append(BLOCK_SETTINGS_STACK_UNKNOWN)
        notes.append("no stack was selected; composition requires exactly one "
                     "stack variant")
        return None, None, blockers, notes

    stack = stack.strip()
    variant_check = by_stack.get(stack)
    if stack == BASE_STACK or variant_check is None:
        offered = sorted(n for n in by_stack if n != BASE_STACK)
        blockers.append(BLOCK_SETTINGS_STACK_UNKNOWN)
        notes.append(f"stack {stack!r} is not declared by the compose "
                     f"projection; manifest offers {offered}")
        return None, stack, blockers, notes

    # A source that failed verification must never reach the composer: bytes
    # composed from unverified inputs are exactly what the hashes exist to
    # prevent. The missing/mismatch blocker is already recorded by the source
    # pass, so this path adds a note, not a second accusation.
    unverified = [c.path for c in (base_check, variant_check) if not c.ok]
    if unverified:
        notes.append(f"composition skipped; unverified source(s): {unverified}")
        return None, stack, blockers, notes

    try:
        base = wrksettings.load_json(Path(archive_root) / base_check.path)
        variant = wrksettings.load_json(Path(archive_root) / variant_check.path)
        schema = wrksettings.load_json(Path(archive_root) /
                                       SETTINGS_SCHEMA_SOURCE)
        blob = wrksettings.compose_bytes(base, variant, str(deployment_root),
                                         python_path, manifest=manifest,
                                         schema=schema)
    except wrksettings.SettingsError as exc:
        blockers.append(BLOCK_SETTINGS_COMPOSE_FAILED)
        notes.append(str(exc))
        return None, stack, blockers, notes
    except (OSError, ValueError) as exc:
        blockers.append(BLOCK_SETTINGS_COMPOSE_FAILED)
        notes.append(f"{type(exc).__name__}: {exc}")
        return None, stack, blockers, notes

    notes.append(f"composed from {base_check.path} + {variant_check.path}")
    return blob, stack, blockers, notes


# --- the planner ------------------------------------------------------------

def _blocked_plan(archive_root, archive_status, deployment_root,
                  deployment_status, stack, manifest, blockers, diagnostics):
    """A plan that could not get as far as classifying projections."""
    manifest = manifest if isinstance(manifest, dict) else {}
    return DeploymentPlan(
        status=PLAN_BLOCKED,
        archive_root=str(archive_root) if archive_root else None,
        archive_root_status=archive_status,
        deployment_root=str(deployment_root) if deployment_root else None,
        deployment_root_status=deployment_status,
        stack=stack if isinstance(stack, str) else None,
        manifest_version=manifest.get("manifest_version"),
        target_release=manifest.get("target_release"),
        hash_algorithm=manifest.get("hash_algorithm"),
        declared_archive_root=manifest.get("archive_root"),
        declared_deployment_root=manifest.get("deployment_root"),
        available_stacks=manifest_stacks(manifest),
        projections=tuple(),
        blockers=tuple(sorted(set(blockers))),
        diagnostics=tuple(diagnostics),
    )


def plan_deployment(archive_root, deployment_root, stack, python_path,
                    manifest=None, manifest_path=None):
    """Build the deterministic read-only deployment plan.

    archive_root     explicit path to the unpacked WRKOPS archive.
    deployment_root  explicit path to the target workspace. Never inferred
                     from cwd or the environment (see the module docstring).
    stack            which `settings.<stack>.json` variant to compose.
    python_path      the caller's RESOLVED absolute interpreter path, handed
                     straight to the B5 composer, which owns its validation.
    manifest         an already-loaded manifest dict; loaded from
                     `manifest_path` (default
                     `<archive_root>/DEPLOYMENT_MANIFEST.json`) when omitted.

    Never raises for an input fault — every defect comes back as a named
    blocker on the returned plan, so one bad projection cannot hide the other
    ninety. Writes nothing, creates nothing, and never walks the archive.
    """
    diagnostics = []

    resolved_archive, archive_status, archive_diag = \
        resolve_archive_root(archive_root)
    diagnostics += archive_diag
    if resolved_archive is None:
        return _blocked_plan(None, archive_status, None, ROOT_UNRESOLVED,
                             stack, manifest, [BLOCK_ARCHIVE_ROOT_UNRESOLVED],
                             diagnostics)

    if manifest is None:
        path = manifest_path or (resolved_archive / MANIFEST_FILENAME)
        try:
            manifest = load_manifest(path)
        except DeployPlanError as exc:
            diagnostics.append(str(exc))
            return _blocked_plan(resolved_archive, archive_status, None,
                                 ROOT_UNRESOLVED, stack, None,
                                 [BLOCK_MANIFEST_MALFORMED], diagnostics)

    manifest_errors = validate_manifest(manifest)
    if manifest_errors:
        diagnostics += manifest_errors
        return _blocked_plan(resolved_archive, archive_status, None,
                             ROOT_UNRESOLVED, stack, manifest,
                             [BLOCK_MANIFEST_MALFORMED], diagnostics)

    plan_blockers = []
    declared_algorithm = manifest.get("hash_algorithm")
    if declared_algorithm != HASH_ALGORITHM:
        plan_blockers.append(BLOCK_UNSUPPORTED_HASH_ALGORITHM)
        diagnostics.append(
            f"manifest declares hash_algorithm {declared_algorithm!r}; this "
            f"planner can only verify {HASH_ALGORITHM!r}, and an unverifiable "
            f"source is not a safe source")

    resolved_deployment, deployment_status, deployment_diag = \
        resolve_deployment_root(deployment_root)
    diagnostics += deployment_diag
    if resolved_deployment is None:
        plan_blockers.append(BLOCK_DEPLOYMENT_ROOT_UNRESOLVED)
        return _blocked_plan(resolved_archive, archive_status, None,
                             deployment_status, stack, manifest,
                             plan_blockers, diagnostics)

    surfaces = preserve_surfaces(manifest)
    seen_ids = set()
    planned = [_plan_one(entry, index, seen_ids, surfaces, resolved_archive,
                         resolved_deployment, manifest, stack, python_path)
               for index, entry in enumerate(manifest["projections"])]

    planned = _apply_duplicate_target_law(planned)

    for projection in planned:
        for code in projection.blockers:
            if code not in plan_blockers:
                plan_blockers.append(code)

    return DeploymentPlan(
        status=PLAN_BLOCKED if plan_blockers else PLAN_READY,
        archive_root=str(resolved_archive),
        archive_root_status=archive_status,
        deployment_root=str(resolved_deployment),
        deployment_root_status=deployment_status,
        stack=stack if isinstance(stack, str) else None,
        manifest_version=manifest.get("manifest_version"),
        target_release=manifest.get("target_release"),
        hash_algorithm=manifest.get("hash_algorithm"),
        declared_archive_root=manifest.get("archive_root"),
        declared_deployment_root=manifest.get("deployment_root"),
        available_stacks=manifest_stacks(manifest),
        projections=tuple(planned),
        blockers=tuple(sorted(set(plan_blockers))),
        diagnostics=tuple(diagnostics),
    )


def _plan_one(entry, index, seen_ids, surfaces, archive_root, deployment_root,
              manifest, stack, python_path):
    """Classify exactly one projection. Always returns a PlannedProjection."""
    if not isinstance(entry, dict):
        return PlannedProjection(
            id=f"<projections[{index}]>", kind="", role="", privacy_class="",
            mutable=None, generated=None, hook_event=None,
            action=ACTION_NONE, status=PROJ_BLOCKED, sources=tuple(),
            target=None, target_path=None, target_exists=False,
            preserve_path=None, stack=None, planned_bytes=None,
            planned_sha256=None, planned_size=None,
            blockers=(BLOCK_MALFORMED_PROJECTION,),
            notes=("projection must be a JSON object",))

    raw_id = entry.get("id")
    pid = raw_id if isinstance(raw_id, str) and raw_id.strip() \
        else f"<projections[{index}]>"
    kind = entry.get("kind") if isinstance(entry.get("kind"), str) else ""
    role = entry.get("role") if isinstance(entry.get("role"), str) else ""
    privacy = entry.get("privacy_class") \
        if isinstance(entry.get("privacy_class"), str) else ""

    blockers = []
    notes = []

    shape_errors = _field_errors(entry, seen_ids)
    if isinstance(raw_id, str) and raw_id.strip():
        seen_ids.add(raw_id)

    # An unknown kind is refused before anything else is attempted: there is
    # no honest way to classify a projection whose operation nobody defines.
    if kind not in KIND_ACTIONS:
        notes += shape_errors
        notes.append(f"unsupported projection kind {entry.get('kind')!r}; "
                     f"supported kinds are {list(SUPPORTED_KINDS)}")
        return PlannedProjection(
            id=pid, kind=kind, role=role, privacy_class=privacy,
            mutable=entry.get("mutable"), generated=entry.get("generated"),
            hook_event=entry.get("hook_event"),
            action=ACTION_NONE, status=PROJ_BLOCKED, sources=tuple(),
            target=None, target_path=None, target_exists=False,
            preserve_path=None, stack=None, planned_bytes=None,
            planned_sha256=None, planned_size=None,
            blockers=(BLOCK_UNSUPPORTED_KIND,), notes=tuple(notes))

    shape_errors += _kind_shape_errors(entry, kind)
    if shape_errors:
        blockers.append(BLOCK_MALFORMED_PROJECTION)
        notes += shape_errors

    action = KIND_ACTIONS[kind]

    # Archive side: every declared source is verified, deployed or not. A
    # manifest that misdescribes its own archive is not a safe basis for a
    # deployment, even where the misdescribed file is archive-only.
    checks, source_blockers = _check_sources(archive_root,
                                             _declared_sources(entry, kind))
    blockers += [c for c in source_blockers if c not in blockers]

    reason = entry.get("reason")
    if isinstance(reason, str) and reason.strip():
        notes.append(reason.strip())

    # Preserve surfaces declare a no-touch path, never a target of their own.
    if kind == "preserve":
        path = entry.get("path")
        return PlannedProjection(
            id=pid, kind=kind, role=role, privacy_class=privacy,
            mutable=entry.get("mutable"), generated=entry.get("generated"),
            hook_event=entry.get("hook_event"),
            action=action,
            status=PROJ_BLOCKED if blockers else PROJ_PRESERVED,
            sources=checks, target=None, target_path=None, target_exists=False,
            preserve_path=path if isinstance(path, str) else None,
            stack=None, planned_bytes=None, planned_sha256=None,
            planned_size=None, blockers=tuple(blockers), notes=tuple(notes))

    # Archive-only projections never touch the deployment root.
    if kind == "not_deployed":
        return PlannedProjection(
            id=pid, kind=kind, role=role, privacy_class=privacy,
            mutable=entry.get("mutable"), generated=entry.get("generated"),
            hook_event=entry.get("hook_event"),
            action=action,
            status=PROJ_BLOCKED if blockers else PROJ_ARCHIVE_ONLY,
            sources=checks, target=None, target_path=None, target_exists=False,
            preserve_path=None, stack=None, planned_bytes=None,
            planned_sha256=None, planned_size=None,
            blockers=tuple(blockers), notes=tuple(notes))

    # Deploying kinds: resolve the target against the EXPLICIT deployment root.
    normalized, target_error = normalize_target(entry.get("target"))
    absolute = None
    target_exists = False
    if target_error:
        if BLOCK_TARGET_ESCAPES_ROOT not in blockers:
            blockers.append(BLOCK_TARGET_ESCAPES_ROOT)
        notes.append(target_error)
    else:
        absolute, join_error = join_target(deployment_root, normalized)
        if join_error:
            if BLOCK_TARGET_ESCAPES_ROOT not in blockers:
                blockers.append(BLOCK_TARGET_ESCAPES_ROOT)
            notes.append(join_error)
        else:
            try:
                target_exists = os.path.exists(absolute)
            except OSError:
                target_exists = False
            for surface_id, pattern in surfaces:
                if matches_preserve(normalized, pattern):
                    if BLOCK_PRESERVE_OVERWRITE not in blockers:
                        blockers.append(BLOCK_PRESERVE_OVERWRITE)
                    notes.append(
                        f"target {normalized!r} falls inside preserve surface "
                        f"{pattern!r} declared by {surface_id!r}; a deployment "
                        f"must never overwrite it")

    note = entry.get("note")
    if isinstance(note, str) and note.strip():
        notes.append(note.strip())

    planned_bytes = None
    planned_sha = None
    planned_size = None
    used_stack = None

    if kind == "compose" and BLOCK_MALFORMED_PROJECTION not in blockers:
        planned_bytes, used_stack, compose_blockers, compose_notes = \
            _compose_settings(archive_root, manifest, checks, stack,
                              deployment_root, python_path)
        blockers += [c for c in compose_blockers if c not in blockers]
        notes += compose_notes
        if planned_bytes is not None:
            planned_sha = sha256_bytes(planned_bytes)
            planned_size = len(planned_bytes)

    return PlannedProjection(
        id=pid, kind=kind, role=role, privacy_class=privacy,
        mutable=entry.get("mutable"), generated=entry.get("generated"),
        hook_event=entry.get("hook_event"),
        action=action,
        status=PROJ_BLOCKED if blockers else PROJ_PLANNED,
        sources=checks, target=normalized, target_path=absolute,
        target_exists=target_exists, preserve_path=None, stack=used_stack,
        planned_bytes=planned_bytes, planned_sha256=planned_sha,
        planned_size=planned_size, blockers=tuple(blockers),
        notes=tuple(notes))


def _apply_duplicate_target_law(planned):
    """Block every projection sharing a normalised target with another.

    Both sides are blocked, never just the second one: which of two colliding
    projections is "the wrong one" is not something a planner can know, and
    picking one silently is how the other quietly stops being deployed.
    """
    counts = {}
    for projection in planned:
        if projection.kind in DEPLOYING_KINDS and projection.target:
            counts[projection.target] = counts.get(projection.target, 0) + 1

    collisions = {target for target, n in counts.items() if n > 1}
    if not collisions:
        return planned

    result = []
    for projection in planned:
        if projection.target in collisions \
                and BLOCK_DUPLICATE_TARGET not in projection.blockers:
            others = sorted(p.id for p in planned
                            if p.target == projection.target
                            and p.id != projection.id)
            result.append(replace(
                projection,
                status=PROJ_BLOCKED,
                blockers=projection.blockers + (BLOCK_DUPLICATE_TARGET,),
                notes=projection.notes + (
                    f"target {projection.target!r} is also claimed by "
                    f"{others}",)))
        else:
            result.append(projection)
    return result
