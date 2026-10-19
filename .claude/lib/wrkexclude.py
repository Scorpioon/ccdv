#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
CCOS WRKOPS 1.8.2 — wrkexclude (local privacy exclusion plan/apply, B3C)
==========================================================================
B3R-B2 gave WRKOPS a read-only structured privacy observation seam
(`wrkprivacy.py`): given a product root and a path, it explains that path's
*current* privacy state and never mutates anything. B3C is the first
deliberately mutating batch built on top of it. It stays a narrow mutation
membrane on purpose (frozen B3C contract, scope decision):

  structured observation (wrkprivacy)
          v
  deterministic exclusion plan  (plan_local_exclusion)
          v
  staleness re-check
          v
  local exclude mutation only   (apply_local_exclusion)
          v
  structured post-verification / rollback

This module NEVER adds plan/apply/write behavior to `wrkprivacy.py` — that
would erase the read-only/mutation split the B3R-B2 closure established.
`wrkprivacy` remains the sole privacy-classification algorithm; this module
only maps its structured states onto a narrower exclusion-plan vocabulary and
performs the one mutation the contract authorizes: writing an owned, marker-
delimited block inside the repository's *local* Git exclude file
(`git rev-parse --git-path info/exclude`, resolved through `wrkgit`, never a
manually-joined path). It never writes a product `.gitignore`, never issues a
Git command of its own (no `subprocess` import here at all — every Git fact
comes from `wrkgit`/`wrkprivacy`), and never touches the index, refs,
config, history, or working tree outside that one file.

State-to-verdict law (contract section 7.1)
------------------------------------------------
For each caller-declared `ExclusionTarget`, `wrkprivacy.observe_private_path()`
is consulted and its `state` is mapped, never inferred from
`diagnostic_lines`:

  PRIVACY_VIOLATION, LEGACY_TRACKED_PRIVATE_STATE   -> LEAK   (refuse, no write)
  OBSERVATION_ERROR                                  -> BLOCKED
  TOPOLOGICALLY_PRIVATE                              -> BLOCKED (not a valid
                                                         state for a declared
                                                         in-product target)
  UNPROTECTED, PUBLIC_POLICY_IGNORED,
  USER_GLOBAL_IGNORED                                -> a local rule is needed
  LOCALLY_PROTECTED                                  -> needs no new rule,
                                                         but ONLY when the
                                                         deciding source is
                                                         structurally proven to
                                                         be this plan's own
                                                         resolved local exclude
                                                         path; otherwise BLOCKED
  NO_GIT (every target agrees)                        -> whole plan is NOOP;
                                                         no `.git` state is
                                                         ever synthesized
  anything else / inconsistent NO_GIT across targets  -> BLOCKED

Whole-plan status is LEAK if any target leaks, else BLOCKED if any target (or
the existing marker block) is unsafe/ambiguous, else NOOP if every target is
already protected (or the root is genuinely no-Git), else READY.

Marker / newline law (contract section 8)
------------------------------------------------
B3C owns exactly one delimited block:

    # >>> WRKOPS LOCAL PRIVACY BEGIN v1
    <deterministically sorted patterns>
    # <<< WRKOPS LOCAL PRIVACY END v1

Zero blocks -> append one. Exactly one well-formed block -> replace only that
block. Duplicate/nested/reversed/unterminated markers -> BLOCKED, zero write.
Every byte outside the owned block is preserved byte-for-byte. The block's
internal newline convention follows the first newline already observed in
the file (CRLF or LF; LF if the file has none), and a non-empty preimage
that does not already end in a newline gets exactly one separator newline
appended before the owned block — its own bytes are never altered.

Stale-plan / rollback law (contract sections 10-12)
------------------------------------------------------------
`apply_local_exclusion()` only ever writes when `plan.status == READY`, and
only after re-observing product-root identity, the resolved local-exclude
path, the current preimage, and every target's structured privacy evidence.
Any drift from what the frozen plan recorded is `STALE_PLAN` — zero write,
never a silent re-plan. The write itself is a narrow same-filesystem atomic
replace (temp file + fsync + `os.replace`), never a general transaction
engine. After writing, every target is re-observed and must come back
structurally `LOCALLY_PROTECTED` (state, `excluded is True`, `tracked is
False`, deciding source resolving to the local exclude path actually
written); if any target fails that, the exact prior bytes (or absence) are
restored and reverified against the frozen preimage hash. A restoration that
cannot itself be proven is a distinct `ROLLBACK_ERROR` — this module never
reports success when the observable end state was not confirmed.

Public seams (contract section 3)
-------------------------------------
`plan_local_exclusion(product_root, targets) -> ExclusionPlan`
    Read-only. Zero filesystem mutation. `targets` is explicit caller
    authority — no `.claude`, `_wrkops`, `CLAUDE.md`, or other operational
    surface is ever hard-coded here, and no target is inferred from
    filesystem discovery.
`apply_local_exclusion(plan) -> ExclusionApplyResult`
    Writes only when `plan.status == READY`, and only to
    `plan.local_exclude_path`.

No CLI, no second independent privacy classifier, no generic transaction
subsystem, no `DEPLOYMENT_MANIFEST.json` authority. B3D remains out of scope.
"""
import hashlib
import json
import os
import re
import sys
import tempfile
from dataclasses import dataclass
from pathlib import Path

_HERE = Path(__file__).resolve().parent
if str(_HERE) not in sys.path:
    sys.path.insert(0, str(_HERE))

import wrkgit
import wrkprivacy

__version__ = "0.1.0"

# --- plan status vocabulary (contract section 5) -----------------------------

STATUS_READY = "READY"
STATUS_NOOP = "NOOP"
STATUS_BLOCKED = "BLOCKED"
STATUS_LEAK = "LEAK"

# --- apply status vocabulary --------------------------------------------------

APPLY_APPLIED = "APPLIED"
APPLY_NOT_READY = "NOT_READY"
APPLY_STALE_PLAN = "STALE_PLAN"
APPLY_ROLLED_BACK = "ROLLED_BACK"
APPLY_ROLLBACK_ERROR = "ROLLBACK_ERROR"
APPLY_INTERNAL_ERROR = "INTERNAL_ERROR"

# --- reason / error classification (machine-readable, never prose-derived) --

REASON_TARGET_AUTHORITY = "target_authority"
REASON_TARGET_COLLISION = "target_collision"
REASON_EMPTY_TARGETS = "empty_targets"
REASON_PRODUCT_ROOT = "product_root"
REASON_LOCAL_EXCLUDE_PATH = "local_exclude_path"
REASON_OBSERVATION = "observation"
REASON_MARKER_STATE = "marker_state"
REASON_LEAK = "leak"
REASON_NOT_READY = "not_ready"
REASON_STALE_PLAN = "stale_plan"
REASON_POST_VERIFICATION = "post_verification"
REASON_ROLLBACK = "rollback"
REASON_INTERNAL = "internal"

_MARK_BEGIN = b"# >>> WRKOPS LOCAL PRIVACY BEGIN v1"
_MARK_END = b"# <<< WRKOPS LOCAL PRIVACY END v1"

_INVALID_SEGMENTS = {"", ".", ".."}
_DRIVE_LETTER_RE = re.compile(r"^[A-Za-z]:")

_NORMALIZE_ERRORS = (OSError, ValueError, TypeError, AttributeError, RuntimeError)


@dataclass(frozen=True)
class ExclusionTarget:
    """One caller-declared exclusion target (contract section 3/4.1).

    `path` is product-root-relative, POSIX-separated, and carries no
    absolute/drive/UNC/NUL/empty/'.'/'..' segment once normalized.
    `recursive` selects the pattern shape: an exact path (False) or a whole
    subtree (True) — see `_pattern_for()`.
    """
    path: str
    recursive: bool


@dataclass(frozen=True)
class ExclusionPlan:
    """Immutable, deterministic exclusion plan (contract section 6).

    `preimage_bytes` is not part of the contract's minimum field list but is
    retained anyway: `apply_local_exclusion()` needs the exact prior bytes,
    not just their hash, to restore them byte-for-byte on a failed
    post-verification (contract section 12) without re-reading a file that
    may have changed again by the time rollback runs.
    """
    status: str
    product_root_lexical: str = None
    product_root_resolved: str = None
    local_exclude_path: str = None
    targets: tuple = ()
    observations: tuple = ()
    preimage_exists: bool = None
    preimage_sha256: str = None
    preimage_bytes: bytes = None
    planned_bytes: bytes = None
    planned_sha256: str = None
    fingerprint: str = None
    reason_code: str = None
    error_detail: str = None
    diagnostic_lines: tuple = ()


@dataclass(frozen=True)
class ExclusionApplyResult:
    """Immutable, structured result of `apply_local_exclusion()`."""
    status: str
    plan_fingerprint: str = None
    local_exclude_path: str = None
    write_performed: bool = False
    preimage_sha256_before: str = None
    postimage_sha256: str = None
    restored: bool = None
    restored_sha256: str = None
    verification: tuple = ()
    reason_code: str = None
    error_detail: str = None
    diagnostic_lines: tuple = ()


class _TargetError(ValueError):
    """Raised for any malformed/colliding target authority (contract 4.1).
    Carries the machine-readable reason_code the plan builder needs — never
    just a message a caller would have to parse."""
    def __init__(self, message, reason_code):
        super().__init__(message)
        self.reason_code = reason_code


def _describe(exc):
    return f"{type(exc).__name__}: {exc}"


def _sha256(data):
    return hashlib.sha256(data).hexdigest()


def _normalize_root(product_root):
    """Resolve `product_root` to (lexical, resolved) Paths. Raises one of
    `_NORMALIZE_ERRORS` for malformed input — the caller converts that into a
    structured BLOCKED plan; this function never guesses."""
    raw = os.fspath(product_root)
    if isinstance(raw, bytes):
        raw = os.fsdecode(raw)
    if "\x00" in raw:
        raise ValueError("embedded NUL in product_root")
    p = Path(raw)
    lexical = Path(os.path.normpath(str(p)))
    resolved = p.resolve(strict=False)
    return lexical, resolved


def _normalize_target_path(raw_path):
    """Validate and canonicalize one target's declared path (contract 4.1).
    Raises `_TargetError` for anything unsafe; never silently repairs it."""
    if not isinstance(raw_path, str):
        raise _TargetError(
            f"target path must be str, got {type(raw_path).__name__}",
            REASON_TARGET_AUTHORITY)
    if "\x00" in raw_path:
        raise _TargetError(f"target path {raw_path!r} contains an embedded NUL",
                            REASON_TARGET_AUTHORITY)
    if raw_path == "":
        raise _TargetError("target path must not be empty", REASON_TARGET_AUTHORITY)
    posix = raw_path.replace("\\", "/")
    if posix.startswith("/"):
        raise _TargetError(
            f"target path {raw_path!r} must not be absolute (leading slash)",
            REASON_TARGET_AUTHORITY)
    if _DRIVE_LETTER_RE.match(posix):
        raise _TargetError(
            f"target path {raw_path!r} must not carry a drive letter",
            REASON_TARGET_AUTHORITY)
    if posix.startswith("//"):
        raise _TargetError(
            f"target path {raw_path!r} must not be a UNC path",
            REASON_TARGET_AUTHORITY)
    segments = posix.split("/")
    for seg in segments:
        if seg in _INVALID_SEGMENTS:
            raise _TargetError(
                f"target path {raw_path!r} contains an invalid segment "
                f"{seg!r} (empty, '.', or '..' segments are not permitted)",
                REASON_TARGET_AUTHORITY)
    return "/".join(segments)


def _normalize_targets(targets):
    """Validate the full declared target set (contract 4.1): every entry
    normalizes safely, and no two entries share a canonical identity, even
    case-insensitively. Returns a tuple of `ExclusionTarget`, sorted by
    canonical path for deterministic plan ordering."""
    try:
        items = list(targets)
    except TypeError as exc:
        raise _TargetError(f"targets is not iterable: {exc}",
                            REASON_TARGET_AUTHORITY) from exc
    if not items:
        raise _TargetError(
            "targets is empty; at least one explicit ExclusionTarget is "
            "required", REASON_EMPTY_TARGETS)
    normalized = []
    seen = {}
    for item in items:
        if not isinstance(item, ExclusionTarget):
            raise _TargetError(
                f"target authority entry is not an ExclusionTarget: {item!r}",
                REASON_TARGET_AUTHORITY)
        if not isinstance(item.recursive, bool):
            raise _TargetError(
                f"target {item.path!r} recursive flag must be bool, got "
                f"{type(item.recursive).__name__}", REASON_TARGET_AUTHORITY)
        canonical = _normalize_target_path(item.path)
        key = canonical.lower()
        if key in seen:
            raise _TargetError(
                f"target {canonical!r} collides with {seen[key]!r} after "
                "case-insensitive canonical normalization",
                REASON_TARGET_COLLISION)
        seen[key] = canonical
        normalized.append(ExclusionTarget(path=canonical, recursive=item.recursive))
    normalized.sort(key=lambda t: t.path)
    return tuple(normalized)


def _pattern_for(target):
    """Deterministic owned pattern for one target (contract 4.2). Never
    inferred from filesystem discovery — purely a function of the declared
    target."""
    return f"/{target.path}/" if target.recursive else f"/{target.path}"


def _target_verdict(observation, local_exclude_path):
    """Map one target's structured `PrivacyObservation` onto the exclusion
    verdict vocabulary (contract 7.1). Returns (verdict, detail_or_None)
    where verdict is one of LEAK / BLOCKED / NOOP / READY / NO_GIT. Reads
    only structured fields — `diagnostic_lines` is never consulted."""
    st = observation.state
    if st == wrkprivacy.NO_GIT:
        return "NO_GIT", None
    if st in (wrkprivacy.PRIVACY_VIOLATION, wrkprivacy.LEGACY_TRACKED_PRIVATE_STATE):
        return "LEAK", (f"{observation.resolved_path} is tracked ({st}); B3C "
                         "refuses remediation")
    if st == wrkprivacy.TOPOLOGICALLY_PRIVATE:
        return "BLOCKED", (f"{observation.resolved_path} observed as "
                            "TOPOLOGICALLY_PRIVATE, which is not a valid state "
                            "for a declared in-product operational target")
    if st == wrkprivacy.OBSERVATION_ERROR:
        return "BLOCKED", (f"{observation.lexical_path} observation error "
                            f"({observation.error_class})")
    if st == wrkprivacy.LOCALLY_PROTECTED:
        src = observation.ignore_source_resolved
        if (observation.excluded is True and observation.tracked is False
                and src is not None and local_exclude_path is not None
                and src == local_exclude_path):
            return "NOOP", None
        return "BLOCKED", (f"{observation.resolved_path} reported "
                            "LOCALLY_PROTECTED without structurally proven "
                            "local-exclude provenance")
    if st in (wrkprivacy.UNPROTECTED, wrkprivacy.PUBLIC_POLICY_IGNORED,
              wrkprivacy.USER_GLOBAL_IGNORED):
        return "READY", None
    return "BLOCKED", f"unrecognized privacy state {st!r} for {observation.resolved_path}"


def _detect_newline(content):
    """First newline convention observed in `content` (contract 8.1): CRLF
    or LF, defaulting to LF when the content has no newline at all."""
    idx = content.find(b"\n")
    if idx == -1:
        return b"\n"
    if idx > 0 and content[idx - 1:idx] == b"\r":
        return b"\r\n"
    return b"\n"


def _parse_markers(content):
    """Locate the owned marker block, if any (contract section 8).

    Returns (kind, lines, begin_index, end_index):
      kind == "none"      no marker line present at all
      kind == "single"    exactly one well-formed begin/end pair
      kind == "malformed" duplicate, nested, reversed, or unterminated

    `lines` is `content.splitlines(keepends=True)` so the caller can
    reconstruct the exact outside-block bytes without re-parsing.
    """
    lines = content.splitlines(keepends=True)
    begin_idx = [i for i, ln in enumerate(lines) if ln.rstrip(b"\r\n") == _MARK_BEGIN]
    end_idx = [i for i, ln in enumerate(lines) if ln.rstrip(b"\r\n") == _MARK_END]
    if not begin_idx and not end_idx:
        return "none", lines, None, None
    if len(begin_idx) == 1 and len(end_idx) == 1 and begin_idx[0] < end_idx[0]:
        return "single", lines, begin_idx[0], end_idx[0]
    return "malformed", lines, None, None


def _build_planned_bytes(content, kind, lines, begin_idx, end_idx, patterns):
    """Deterministic planned bytes for the full declared target set (contract
    8/8.1). Every byte outside the owned block is preserved exactly; only
    called for kind in ("none", "single") — a malformed existing block is
    BLOCKED before this is ever reached."""
    newline = _detect_newline(content)
    sorted_patterns = sorted(set(patterns))
    block_lines = [_MARK_BEGIN] + [p.encode("utf-8") for p in sorted_patterns] + [_MARK_END]
    block = newline.join(block_lines) + newline
    if kind == "none":
        if content:
            prefix = content
            if not (prefix.endswith(b"\n") or prefix.endswith(b"\r")):
                prefix += newline
        else:
            prefix = b""
        return prefix + block
    prefix = b"".join(lines[:begin_idx])
    suffix = b"".join(lines[end_idx + 1:])
    return prefix + block + suffix


def _read_bytes_or_absent(path):
    try:
        return path.read_bytes(), True
    except FileNotFoundError:
        return b"", False


def _fingerprint(status, evidence):
    """Deterministic fingerprint over every mutation-relevant field observed
    so far (contract section 6: identical inputs/state MUST yield an equal
    plan and fingerprint). Raw bytes are represented only by their hashes."""
    observations = evidence.get("observations", ())
    obs_repr = tuple(
        None if o is None else
        (o.state, o.tracked, o.excluded, o.ignore_source_resolved,
         o.legacy_match, o.topology_relation)
        for o in observations)
    targets_repr = tuple((t.path, t.recursive) for t in evidence.get("targets", ()))
    payload = {
        "status": status,
        "product_root_resolved": evidence.get("product_root_resolved"),
        "local_exclude_path": evidence.get("local_exclude_path"),
        "targets": targets_repr,
        "observations": obs_repr,
        "preimage_exists": evidence.get("preimage_exists"),
        "preimage_sha256": evidence.get("preimage_sha256"),
        "planned_sha256": evidence.get("planned_sha256"),
        "reason_code": evidence.get("reason_code"),
    }
    encoded = json.dumps(payload, sort_keys=True, default=str).encode("utf-8")
    return _sha256(encoded)


def _plan(product_root, targets):
    evidence = {}

    def finish(status, lines, **updates):
        evidence.update(updates)
        fp = _fingerprint(status, evidence)
        return ExclusionPlan(status=status, fingerprint=fp,
                              diagnostic_lines=tuple(lines), **evidence)

    # --- 1. target authority (pure string validation, no I/O yet) ----------
    try:
        normalized_targets = _normalize_targets(targets)
    except _TargetError as exc:
        return finish(STATUS_BLOCKED, [str(exc)],
                      reason_code=exc.reason_code, error_detail=str(exc))
    evidence["targets"] = normalized_targets

    # --- 2. product root authority ------------------------------------------
    try:
        root_lexical, root_resolved = _normalize_root(product_root)
    except _NORMALIZE_ERRORS as exc:
        return finish(STATUS_BLOCKED,
                      [f"product_root {product_root!r} could not be normalized"],
                      reason_code=REASON_PRODUCT_ROOT, error_detail=str(exc))
    evidence["product_root_lexical"] = str(root_lexical)
    evidence["product_root_resolved"] = str(root_resolved)

    if not root_resolved.is_dir():
        return finish(STATUS_BLOCKED,
                      [f"product_root {product_root!r} does not exist as a "
                       "directory"], reason_code=REASON_PRODUCT_ROOT)

    # --- 3. resolve the effective local exclude path (tolerant of NOT_A_REPO;
    #        only wrkprivacy's corroborated observation may confirm NO_GIT) --
    lep_val, lep_status, lep_diag = wrkgit.local_exclude_path(root_resolved)
    if lep_status not in (wrkgit.OK, wrkgit.NOT_A_REPO):
        return finish(STATUS_BLOCKED,
                      list(lep_diag) or [f"wrkgit.local_exclude_path returned "
                                          f"{lep_status!r}"],
                      reason_code=REASON_LOCAL_EXCLUDE_PATH)
    local_exclude_path = lep_val if lep_status == wrkgit.OK else None
    if local_exclude_path is not None and Path(local_exclude_path).name == ".gitignore":
        return finish(STATUS_BLOCKED,
                      ["resolved local exclude path is named .gitignore; "
                       "refusing to treat a product-tracked ignore file as "
                       "the local exclusion boundary"],
                      reason_code=REASON_LOCAL_EXCLUDE_PATH,
                      local_exclude_path=local_exclude_path)
    evidence["local_exclude_path"] = local_exclude_path

    # --- 4. observe every declared target through the accepted seam --------
    observations = tuple(wrkprivacy.observe_private_path(root_resolved, t.path)
                          for t in normalized_targets)
    evidence["observations"] = observations

    verdicts = [_target_verdict(o, local_exclude_path) for o in observations]
    verdict_names = {v for v, _ in verdicts}

    if "LEAK" in verdict_names:
        leaked = [t.path for (v, _), t in zip(verdicts, normalized_targets) if v == "LEAK"]
        return finish(STATUS_LEAK,
                      [f"tracked operational target(s) refuse remediation: "
                       f"{leaked}"], reason_code=REASON_LEAK)

    if verdict_names <= {"NO_GIT"}:
        return finish(STATUS_NOOP,
                      ["product_root is genuinely NO_GIT; local exclusion is "
                       "structurally satisfied and no .git state is "
                       "synthesized"], preimage_exists=False)

    if "NO_GIT" in verdict_names:
        return finish(STATUS_BLOCKED,
                      ["inconsistent NO_GIT observation across declared "
                       "targets for one product root"],
                      reason_code=REASON_OBSERVATION)

    if "BLOCKED" in verdict_names:
        reasons = [r for v, r in verdicts if v == "BLOCKED"]
        return finish(STATUS_BLOCKED, reasons, reason_code=REASON_OBSERVATION)

    # --- 5. read current local-exclude bytes / marker state -----------------
    preimage_bytes, preimage_exists = _read_bytes_or_absent(Path(local_exclude_path))
    preimage_sha256 = _sha256(preimage_bytes) if preimage_exists else None
    evidence["preimage_exists"] = preimage_exists
    evidence["preimage_sha256"] = preimage_sha256
    evidence["preimage_bytes"] = preimage_bytes

    kind, lines, begin_idx, end_idx = _parse_markers(preimage_bytes)
    if kind == "malformed":
        return finish(STATUS_BLOCKED,
                      ["existing owned marker block is duplicate, nested, "
                       "reversed, or unterminated; refusing to guess a safe "
                       "rewrite"], reason_code=REASON_MARKER_STATE)

    # --- 6. deterministic planned bytes for the full declared target set ----
    patterns = [_pattern_for(t) for t in normalized_targets]
    planned_bytes = _build_planned_bytes(preimage_bytes, kind, lines, begin_idx,
                                         end_idx, patterns)
    planned_sha256 = _sha256(planned_bytes)
    evidence["planned_bytes"] = planned_bytes
    evidence["planned_sha256"] = planned_sha256

    status = STATUS_NOOP if verdict_names <= {"NOOP"} else STATUS_READY
    return finish(status, [])


def plan_local_exclusion(product_root, targets):
    """Read-only. Produces a deterministic `ExclusionPlan` for the caller-
    declared `targets` (contract section 3/9). Performs zero filesystem
    mutation; the only Git facts used come from `wrkgit`/`wrkprivacy`."""
    try:
        return _plan(product_root, targets)
    except Exception as exc:
        return ExclusionPlan(
            status=STATUS_BLOCKED, reason_code=REASON_INTERNAL,
            error_detail=_describe(exc),
            diagnostic_lines=(
                "plan_local_exclusion failed with an unexpected internal "
                "error and is reported fail-closed; no mutation is "
                "authorized",))


def _atomic_write_bytes(target_path, data):
    """Narrow same-filesystem atomic replace (contract section 11): a temp
    file in the same directory, fsync'd, then `os.replace()`. Not a general
    transaction engine — single file, local to this mutation boundary."""
    target_path = Path(target_path)
    target_path.parent.mkdir(parents=True, exist_ok=True)
    fd, tmp_name = tempfile.mkstemp(prefix=".wrkexclude-",
                                    dir=str(target_path.parent))
    try:
        with os.fdopen(fd, "wb") as fh:
            fh.write(data)
            fh.flush()
            os.fsync(fh.fileno())
        os.replace(tmp_name, str(target_path))
    except BaseException:
        try:
            os.unlink(tmp_name)
        except OSError:
            pass
        raise


def _atomic_delete(target_path):
    try:
        Path(target_path).unlink()
    except FileNotFoundError:
        pass


def _stale(plan, lines):
    return ExclusionApplyResult(
        status=APPLY_STALE_PLAN, plan_fingerprint=plan.fingerprint,
        local_exclude_path=plan.local_exclude_path, write_performed=False,
        reason_code=REASON_STALE_PLAN, diagnostic_lines=tuple(lines))


def _rollback_diagnostic(base_text, post_write_error):
    """Build the diagnostic tuple for one `_rollback()` outcome (F-0028).
    `post_write_error` is not None only when `_rollback()` was entered
    because an unexpected exception interrupted post-write verification
    itself (contract section 3.2), rather than an ordinary structural
    verification failure. In that case an explicit extra line is appended
    stating that the local-exclude write had already completed — the base
    text alone never claims or implies "no write occurred", so it is reused
    unchanged for the ordinary case."""
    if post_write_error is None:
        return (base_text,)
    return (
        base_text,
        f"rollback was entered because post-write verification itself "
        f"raised an unexpected internal error ({_describe(post_write_error)}) "
        f"after the local-exclude write had already completed; "
        f"write_performed remains True regardless of this rollback's "
        f"outcome",
    )


def _public_policy_fallback_verified(plan, target, frozen_obs, v_obs,
                                     current_local_bytes):
    """F-0029 public-policy fallback success (contract section 4.2). Only
    reachable when the target's FROZEN pre-write observation was already
    `PUBLIC_POLICY_IGNORED`: proves WRKOPS' local fallback rule was
    genuinely installed even though Git's higher-priority public policy
    remains the deciding source, WITHOUT claiming the local exclude became
    that deciding source. Any state drift, provenance ambiguity, or byte
    mismatch fails closed (returns False), which routes the caller into the
    same ordinary post-verification-failure rollback as before."""
    if frozen_obs.state != wrkprivacy.PUBLIC_POLICY_IGNORED:
        return False
    if v_obs.state != wrkprivacy.PUBLIC_POLICY_IGNORED:
        return False
    if v_obs.excluded is not True or v_obs.tracked is not False:
        return False
    src = v_obs.ignore_source_resolved
    frozen_src = frozen_obs.ignore_source_resolved
    if src is None or frozen_src is None or src != frozen_src:
        return False
    if current_local_bytes != plan.planned_bytes:
        return False
    kind, lines, begin_idx, end_idx = _parse_markers(current_local_bytes)
    if kind != "single":
        return False
    block_bytes = b"".join(lines[begin_idx:end_idx + 1])
    if _pattern_for(target).encode("utf-8") not in block_bytes:
        return False
    return True


def _rollback(plan, postimage_sha256, verification, post_write_error=None):
    """Restore the exact prior local-exclude bytes/absence and reverify
    against the frozen preimage hash (contract section 12). Never claims
    success: a restoration that cannot be proven is `ROLLBACK_ERROR`. Also
    entered when an unexpected exception interrupts post-write verification
    itself (contract F-0028 3.2) — `post_write_error` carries that exception
    so the diagnostic can say so explicitly; `write_performed=True` is
    preserved on every result returned here regardless."""
    lep_path = Path(plan.local_exclude_path)
    try:
        if plan.preimage_exists:
            _atomic_write_bytes(lep_path, plan.preimage_bytes)
        else:
            _atomic_delete(lep_path)
    except Exception as exc:
        return ExclusionApplyResult(
            status=APPLY_ROLLBACK_ERROR, plan_fingerprint=plan.fingerprint,
            local_exclude_path=plan.local_exclude_path, write_performed=True,
            postimage_sha256=postimage_sha256, restored=False,
            verification=verification, reason_code=REASON_ROLLBACK,
            error_detail=str(exc),
            diagnostic_lines=_rollback_diagnostic(
                f"post-verification failed and rollback itself raised: "
                f"{exc}; never claiming success", post_write_error))

    try:
        if plan.preimage_exists:
            restored_bytes, restored_exists = _read_bytes_or_absent(lep_path)
            restored_sha256 = _sha256(restored_bytes) if restored_exists else None
            restored_ok = restored_exists and restored_sha256 == plan.preimage_sha256
        else:
            restored_ok = not lep_path.exists()
            restored_sha256 = None
    except Exception:
        restored_ok = False
        restored_sha256 = None

    if restored_ok:
        return ExclusionApplyResult(
            status=APPLY_ROLLED_BACK, plan_fingerprint=plan.fingerprint,
            local_exclude_path=plan.local_exclude_path, write_performed=True,
            postimage_sha256=postimage_sha256, restored=True,
            restored_sha256=restored_sha256, verification=verification,
            reason_code=REASON_POST_VERIFICATION,
            diagnostic_lines=_rollback_diagnostic(
                "post-verification failed for at least one declared target; "
                "original local exclude state was restored and verified",
                post_write_error))

    return ExclusionApplyResult(
        status=APPLY_ROLLBACK_ERROR, plan_fingerprint=plan.fingerprint,
        local_exclude_path=plan.local_exclude_path, write_performed=True,
        postimage_sha256=postimage_sha256, restored=False,
        restored_sha256=restored_sha256, verification=verification,
        reason_code=REASON_ROLLBACK,
        diagnostic_lines=_rollback_diagnostic(
            "post-verification failed AND restoration could not be proven "
            "against the frozen preimage; never claiming success",
            post_write_error))


def _apply(plan):
    if plan.status != STATUS_READY:
        return ExclusionApplyResult(
            status=APPLY_NOT_READY, plan_fingerprint=plan.fingerprint,
            local_exclude_path=plan.local_exclude_path,
            reason_code=REASON_NOT_READY,
            diagnostic_lines=(f"apply_local_exclusion refuses to write: "
                              f"plan.status is {plan.status!r}, not READY",))

    # --- re-check product-root identity --------------------------------------
    try:
        _, root_resolved = _normalize_root(plan.product_root_resolved)
    except _NORMALIZE_ERRORS:
        return _stale(plan, ["product_root could not be re-normalized at "
                             "apply time"])
    if str(root_resolved) != plan.product_root_resolved or not root_resolved.is_dir():
        return _stale(plan, ["product_root identity changed since the plan "
                             "was built"])

    # --- re-check resolved local-exclude path identity -----------------------
    lep_val, lep_status, _lep_diag = wrkgit.local_exclude_path(root_resolved)
    if lep_status != wrkgit.OK or lep_val != plan.local_exclude_path:
        return _stale(plan, ["resolved local exclude path changed since the "
                             "plan was built"])

    # --- re-check current preimage -------------------------------------------
    lep_path = Path(plan.local_exclude_path)
    try:
        current_bytes, current_exists = _read_bytes_or_absent(lep_path)
    except OSError:
        return _stale(plan, ["local exclude file could not be re-read at "
                             "apply time"])
    if current_exists != plan.preimage_exists:
        return _stale(plan, ["local exclude file existence changed since the "
                             "plan was built"])
    if current_exists and _sha256(current_bytes) != plan.preimage_sha256:
        return _stale(plan, ["local exclude file content changed since the "
                             "plan was built"])

    # --- re-check every target's current structured authority ---------------
    for t, frozen_obs in zip(plan.targets, plan.observations):
        fresh_obs = wrkprivacy.observe_private_path(root_resolved, t.path)
        if fresh_obs.state != frozen_obs.state:
            return _stale(plan, [f"{t.path}: privacy state changed from "
                                 f"{frozen_obs.state} to {fresh_obs.state}"])
        if (fresh_obs.tracked != frozen_obs.tracked
                or fresh_obs.excluded != frozen_obs.excluded
                or fresh_obs.ignore_source_resolved != frozen_obs.ignore_source_resolved):
            return _stale(plan, [f"{t.path}: mutation-relevant privacy "
                                 "evidence changed since the plan was built"])

    # --- write ----------------------------------------------------------------
    try:
        _atomic_write_bytes(lep_path, plan.planned_bytes)
    except OSError as exc:
        return ExclusionApplyResult(
            status=APPLY_INTERNAL_ERROR, plan_fingerprint=plan.fingerprint,
            local_exclude_path=plan.local_exclude_path, write_performed=False,
            reason_code=REASON_INTERNAL, error_detail=str(exc),
            diagnostic_lines=(f"atomic write failed: {exc}",))

    # From here the atomic write has already completed successfully
    # (contract F-0028 section 3.2): every result returned below MUST
    # preserve write_performed=True, even an unexpected exception raised
    # while working out what to report. Such an exception must not be
    # allowed to reach the generic `apply_local_exclusion()` handler, which
    # would otherwise falsely claim no write occurred; instead it enters the
    # same exact-preimage rollback path as an ordinary verification failure.
    try:
        postimage_sha256 = _sha256(plan.planned_bytes)
        current_local_bytes, _current_local_exists = _read_bytes_or_absent(lep_path)

        # --- post-verification: every target must be structurally proven ----
        verification = []
        fallback_used = []
        all_ok = True
        for t, frozen_obs in zip(plan.targets, plan.observations):
            v_obs = wrkprivacy.observe_private_path(root_resolved, t.path)
            ok = (v_obs.state == wrkprivacy.LOCALLY_PROTECTED
                  and v_obs.excluded is True and v_obs.tracked is False
                  and v_obs.ignore_source_resolved == plan.local_exclude_path)
            if not ok:
                # F-0029: a target whose frozen pre-write state was already
                # PUBLIC_POLICY_IGNORED may still succeed by proving the
                # local fallback rule was genuinely installed, without
                # requiring the local exclude to become Git's deciding
                # source. UNPROTECTED/USER_GLOBAL_IGNORED targets are never
                # eligible — the helper gates on the frozen state itself.
                ok = _public_policy_fallback_verified(
                    plan, t, frozen_obs, v_obs, current_local_bytes)
                if ok:
                    fallback_used.append(t.path)
            verification.append((t.path, ok))
            all_ok = all_ok and ok
        verification = tuple(verification)
    except Exception as exc:
        return _rollback(plan, None, (), post_write_error=exc)

    if all_ok:
        if fallback_used:
            diag = (f"post-verification confirmed every declared target: "
                    f"ordinary LOCALLY_PROTECTED provenance, except "
                    f"{fallback_used} where the proven public-policy "
                    f"fallback rule (contract F-0029) was accepted instead "
                    f"of local-exclude deciding provenance",)
        else:
            diag = ("post-verification confirmed LOCALLY_PROTECTED for "
                    "every declared target",)
        return ExclusionApplyResult(
            status=APPLY_APPLIED, plan_fingerprint=plan.fingerprint,
            local_exclude_path=plan.local_exclude_path, write_performed=True,
            preimage_sha256_before=plan.preimage_sha256,
            postimage_sha256=postimage_sha256, restored=False,
            verification=verification, diagnostic_lines=diag)

    return _rollback(plan, postimage_sha256, verification)


def apply_local_exclusion(plan):
    """Consume an explicit `ExclusionPlan` (contract section 10-12). Writes
    only when `plan.status == READY` and only to `plan.local_exclude_path`.
    Never raises for caller/state input; an unforeseen failure before any
    write is `INTERNAL_ERROR`, never confused with a post-write rollback
    failure."""
    try:
        return _apply(plan)
    except Exception as exc:
        return ExclusionApplyResult(
            status=APPLY_INTERNAL_ERROR,
            plan_fingerprint=getattr(plan, "fingerprint", None),
            local_exclude_path=getattr(plan, "local_exclude_path", None),
            write_performed=False, reason_code=REASON_INTERNAL,
            error_detail=_describe(exc),
            diagnostic_lines=(
                "apply_local_exclusion failed with an unexpected internal "
                "error before any write was attempted; reported fail-closed",))
