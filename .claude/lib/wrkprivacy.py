#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
CCOS WRKOPS 1.8.2 — wrkprivacy (read-only privacy observation seam, B3R-B2)
============================================================================
B3A hardened `wrkgit` so a later privacy consumer could safely observe Git
state (`GIT_ERROR` vs. `NOT_A_REPO` vs. `REPO`; `local_exclude_path()`). B3B
was that consumer: given an explicitly supplied product root and a single
path, it explained that path's *current* privacy state without ever mutating
anything. B3R-B2 keeps every accepted B3B state law and closes the five
pre-B3C observation defects the confirmatory ITV recorded against it:

  ITV-B3B-01  a lexically-inside path whose target resolves outside the
              product root was published as `TOPOLOGICALLY_PRIVATE` — the
              one fail-OPEN direction found. Now a cross-boundary topology
              relation is `OBSERVATION_ERROR` (see "Topology law").
  ITV-B3B-02  the seam could raise on malformed path input instead of
              returning `OBSERVATION_ERROR`. The public seams are now total
              over hostile caller/state input (see "Totality law").
  ITV-B3B-03  the ancestor marker probe used an existence helper that
              swallows `OSError` internally, so the documented fail-closed
              branch was unreachable and a stat failure was misreported as a
              bare-repository signature. Probing is now an explicit
              PRESENT / ABSENT / ERROR observation (see "Corroboration law").
  ITV-B3B-04  authoritative evidence was recoverable only by parsing prose.
              `observe_private_path()` now returns a structured
              `PrivacyObservation`; diagnostics are presentation only (see
              "Structured-authority law").
  ITV-B3B-06  malformed explicit `legacy_tracked` entries were silently
              dropped. Unreadable explicit authority is now an
              `OBSERVATION_ERROR` (see "Explicit legacy authority law").

This module issues no Git command of its own. It imports no `subprocess` and
constructs no argv; every Git fact it needs comes from `wrkgit`, the single
read-only observation seam (see `wrkgit.py`'s G1 invariant). If `wrkgit`
cannot answer a question with confidence, this module fails closed to
`OBSERVATION_ERROR` rather than guessing.

Authority note (session honesty, not contract text)
---------------------------------------------------------
B3B was implemented from a prompt restatement because its three declared
governance documents were absent from the executor workspace, and the
confirmatory ITV found that the two contract clauses the restatement dropped
were exactly the two the implementation did not satisfy. For B3R-B2 the
declared authority WAS materialized and read: the frozen B3R-B2 contract, the
B3R-B2 finding disposition, the frozen B3B contract, the B3B confirmatory ITV
verdict, the B3R-B1 closure decision, and the standing-oracle floor-advance
run. This module implements the frozen B3R-B2 contract directly.

Structured-authority law (contract section 3)
---------------------------------------------------
`observe_private_path()` is authoritative. It returns a frozen
`PrivacyObservation` whose fields carry every fact needed to explain the
verdict: the lexical and resolved paths, the topology relation, the
repo-relative path, the `wrkgit` repository status, tracked state, effective
exclusion, the deciding ignore source / pattern / line, the effective local
exclude path, the no-Git corroboration record, the declared legacy authority,
and — when the observation failed — which evidence class failed and why.
`diagnostic_lines` is human presentation. No consumer (B3C included) should
ever regex, substring-match, or otherwise parse diagnostics to recover state,
tracked state, ignore provenance, or corroboration outcome.

`classify_private_path()` is preserved unchanged as the compatibility seam
for existing callers and returns the accepted legacy shape `(state,
list[str])`. It DELEGATES to `observe_private_path()`; it does not run a
second, independent classification algorithm.

Topology law (contract section 4, ITV-B3B-01)
---------------------------------------------------
Two different questions are kept apart and answered separately:

  lexical location   where the path entry is NAMED relative to the product
                     root, after purely textual normalization that follows
                     no link;
  resolved location  where filesystem resolution actually leads.

    lexical | resolved | result
    --------+----------+-------------------------------------------------
    inside  | inside   | continue normal Git/privacy classification
    outside | outside  | TOPOLOGICALLY_PRIVATE
    inside  | outside  | OBSERVATION_ERROR (escapes the root)
    outside | inside   | OBSERVATION_ERROR (enters the root)
    error   | any      | OBSERVATION_ERROR
    any     | error    | OBSERVATION_ERROR

A path lexically tracked inside product Git can therefore never become
`TOPOLOGICALLY_PRIVATE` merely because its target resolves outside the root,
and a cross-boundary relation is never followed by a guessed tracked/ignore
verdict — the observation stops at the topology error.

Totality law (contract section 5, ITV-B3B-02)
---------------------------------------------------
Both public seams are total over hostile or malformed caller/state input.
A non-path object, an embedded NUL, a malformed product root, a malformed
query, a failing legacy-entry normalization, a failing ignore-source or
local-exclude normalization, and an inaccessible path component all become a
structured `OBSERVATION_ERROR` naming the failing evidence class in
`error_class` — never a leaked `ValueError`, `TypeError`, or `OSError`. A
final defensive guard converts any unforeseen `Exception` into
`OBSERVATION_ERROR` with `error_class == ERROR_INTERNAL`. Process-control
exceptions (`KeyboardInterrupt`, `SystemExit`) are deliberately NOT swallowed.

Corroboration law (contract section 6, ITV-B3B-03, B3A residual ITV-B3A-01)
--------------------------------------------------------------------------
`wrkgit.is_repo()` reports `NOT_A_REPO` for two different real situations it
cannot tell apart from inside its own read-only contract: an ordinary
non-repository directory, AND a confirmed *bare* repository (rev-parse
--is-inside-work-tree prints false / exit 0 for a bare repo, which has full
Git administrative state and merely no work tree). `NOT_A_REPO` alone MUST
NOT become an affirmative `NO_GIT`. Before this module returns `NO_GIT` it
independently corroborates absence, and every probe it makes is an explicit
three-valued observation — PRESENT, ABSENT, or ERROR:

  - absence means a probe POSITIVELY established absence (`FileNotFoundError`
    only); an `OSError` / access / stat failure is `PROBE_ERROR`, never
    absence;
  - a `.git` marker of any kind at the product root or any ancestor
    withholds affirmative `NO_GIT`;
  - a dangling indirection marker remains `OBSERVATION_ERROR`, and is
    distinguished from an indirection whose target exists and from a probe
    that failed;
  - a plausible bare-repository administrative signature (`HEAD` file plus
    `objects/` and `refs/` directories) at the product root remains
    not-`NO_GIT`;
  - a stray or broken ancestor `.git` continues to withhold affirmative
    `NO_GIT` (contract-mandated conservatism, ITV-B3B-05).

The reason is preserved structurally in `PrivacyObservation.corroboration`,
so a stat failure is reported as a probe error and never misattributed to a
bare-repository signature. See `_corroborate_no_git()`.

Tracked law — legacy must be explicit (contract section 7)
----------------------------------------------------------------
A tracked path is `LEGACY_TRACKED_PRIVATE_STATE` only when its resolved path
is present in the caller-supplied `legacy_tracked` authority; otherwise it is
`PRIVACY_VIOLATION`. Membership is exact resolved-path identity: no prefix
inheritance, no parent-directory inheritance, no history/age inference, and
no semantic inference from naming. Legacy status is never inferred.

Explicit legacy authority law (contract section 7, ITV-B3B-06)
--------------------------------------------------------------------
`legacy_tracked` is authority supplied by the caller, so every supplied entry
must either normalize safely and participate in the identity comparison, or
make the whole observation `OBSERVATION_ERROR`. Entries are normalized BEFORE
any topology or Git observation, so unreadable explicit authority can never
ride along silently inside some other verdict. A bare `str`/`bytes` passed
as `legacy_tracked` is rejected as malformed authority rather than silently
iterated character by character.

Ignore provenance law (contract section 8)
------------------------------------------------
For an untracked path inside a confirmed repository the deciding rule's
source (`wrkgit.ignored_by()`) is classified by comparing it against
`wrkgit.local_exclude_path()` (-> `LOCALLY_PROTECTED`), against the
in-repository `.gitignore` case (-> `PUBLIC_POLICY_IGNORED`), or, for every
other deciding source, -> `USER_GLOBAL_IGNORED`. A path with no effective
exclusion is `UNPROTECTED` in exactly two shapes — no deciding rule at all,
or a deciding rule that is an effective NEGATION — and B3R-B2 retains the
negation's deciding provenance structurally (`ignore_source` /
`ignore_pattern` / `ignore_line` / `is_negation`) instead of discarding it.
If the deciding source cannot be resolved reliably the result is
`OBSERVATION_ERROR`, never a guess. Per the B3R-B2 disposition of
ITV-B3B-07(a), no provenance source type that `wrkgit` cannot prove is
invented here: a user/global excludes file deliberately placed inside the
product root and named `.gitignore` is still labelled repository policy, and
that ambiguity is carried forward rather than guessed away.

Contradictory-provenance law (contract section 8, B3R-B2 corrective)
--------------------------------------------------------------------
Contract section 8 makes contradictory provenance an `OBSERVATION_ERROR`, and
two shapes are contradictory rather than merely unusual:

  excluded=True  + no deciding rule   the path is effectively excluded but
                                      nothing decided it;
  excluded=False + POSITIVE rule      nothing excludes the path, yet the
                                      deciding rule is not a negation.

Both are self-contradictory: the two halves of one observation disagree.
Ordinary `check-ignore` semantics do not produce the second pair, but
dependency inconsistency, observation drift / TOCTOU, a seam, or a future
dependency change can — and this module exists to give a future mutating
consumer a fail-closed structured boundary, so it must not publish an
internally self-contradictory result as a usable privacy verdict. The
contradiction is reported with the stable machine-readable
`error_class == ERROR_PROVENANCE_CONTRADICTION`, and every piece of the
contradictory evidence is preserved structurally — `excluded=False`, the
deciding `ignore_source` / `ignore_pattern` / `ignore_line`, and
`is_negation=False` — so a consumer can see exactly what disagreed without
reading a single diagnostic line. An effective NEGATION is not a
contradiction: it is the ordinary, contract-mandated `UNPROTECTED` shape and
keeps its provenance.

Required states
--------------------
  TOPOLOGICALLY_PRIVATE          named AND resolving outside product_root
  NO_GIT                         corroborated absence of Git admin state
  OBSERVATION_ERROR              fail-closed: could not classify reliably
  LEGACY_TRACKED_PRIVATE_STATE   tracked, explicitly declared legacy
  PRIVACY_VIOLATION              tracked, not declared legacy
  LOCALLY_PROTECTED              untracked, excluded via local info/exclude
  USER_GLOBAL_IGNORED            untracked, excluded via another source
  PUBLIC_POLICY_IGNORED          untracked, excluded via repo .gitignore
  UNPROTECTED                    untracked, not effectively excluded

Public seams
---------------
`observe_private_path(product_root, path, *, legacy_tracked=None, env=None)`
    -> PrivacyObservation   (authoritative, structured)
`classify_private_path(product_root, path, *, legacy_tracked=None, env=None)`
    -> (state, list[str])   (compatibility, delegates to the above)

`state` is always one of the nine literal strings above; `diagnostic_lines`
is a deterministic evidence trail (never a set, never a timestamp, never
anything whose ordering or content could vary run-to-run against unchanged
inputs).

No mutation (contract section 9)
--------------------------------------
This module reads Git state only through `wrkgit`'s existing eight read-only
invocations; it adds none of its own and no new invocation shape. It never
writes `.gitignore`, never writes `info/exclude`, never touches the index,
refs, config, history or the working tree, and creates, deletes or renames no
file. Its complete import set is `os`, `stat`, `sys`, `dataclasses` and
`pathlib.Path`, plus `wrkgit`.
"""
import os
import stat
import sys
from dataclasses import dataclass
from pathlib import Path

_HERE = Path(__file__).resolve().parent
if str(_HERE) not in sys.path:
    sys.path.insert(0, str(_HERE))

import wrkgit

__version__ = "1.1.0"

# --- privacy states (accepted B3B set, unchanged) ---------------------------

TOPOLOGICALLY_PRIVATE = "topologically_private"
NO_GIT = "no_git"
OBSERVATION_ERROR = "observation_error"
LEGACY_TRACKED_PRIVATE_STATE = "legacy_tracked_private_state"
PRIVACY_VIOLATION = "privacy_violation"
LOCALLY_PROTECTED = "locally_protected"
USER_GLOBAL_IGNORED = "user_global_ignored"
PUBLIC_POLICY_IGNORED = "public_policy_ignored"
UNPROTECTED = "unprotected"

# --- topology relations (contract section 4) --------------------------------

TOPOLOGY_INSIDE = "inside"
TOPOLOGY_OUTSIDE = "outside"
TOPOLOGY_ESCAPES_ROOT = "lexical_inside_resolved_outside"
TOPOLOGY_ENTERS_ROOT = "lexical_outside_resolved_inside"
TOPOLOGY_UNKNOWN = "unknown"

# --- three-valued filesystem probe (contract section 6) ---------------------

PROBE_PRESENT = "present"
PROBE_ABSENT = "absent"
PROBE_ERROR = "error"

ENTRY_DIRECTORY = "directory"
ENTRY_FILE = "file"
ENTRY_SYMLINK_TO_DIRECTORY = "symlink_to_directory"
ENTRY_SYMLINK_TO_FILE = "symlink_to_file"
ENTRY_BROKEN_SYMLINK = "broken_symlink"
ENTRY_OTHER = "other"

# --- no-Git corroboration outcomes (contract section 6) ---------------------

CORROBORATION_NOT_ATTEMPTED = "not_attempted"
CORROBORATION_ABSENCE_CONFIRMED = "absence_confirmed"
CORROBORATION_MARKER_DIRECTORY = "marker_directory"
CORROBORATION_MARKER_FILE = "marker_file"
CORROBORATION_MARKER_INDIRECTION = "marker_indirection"
CORROBORATION_DANGLING_INDIRECTION = "dangling_indirection"
CORROBORATION_MARKER_UNKNOWN_TYPE = "marker_unknown_type"
CORROBORATION_BARE_SIGNATURE = "bare_repository_signature"
CORROBORATION_PROBE_ERROR = "probe_error"

# --- evidence classes for a failed observation (contract section 5) ---------

ERROR_PRODUCT_ROOT = "product_root"
ERROR_QUERY_PATH = "query_path"
ERROR_LEGACY_AUTHORITY = "legacy_authority"
ERROR_TOPOLOGY = "topology"
ERROR_WRKGIT_IS_REPO = "wrkgit_is_repo"
ERROR_WRKGIT_TRACKED = "wrkgit_tracked"
ERROR_WRKGIT_EXCLUDED = "wrkgit_excluded"
ERROR_WRKGIT_IGNORED_BY = "wrkgit_ignored_by"
ERROR_WRKGIT_LOCAL_EXCLUDE = "wrkgit_local_exclude_path"
ERROR_NO_GIT_CORROBORATION = "no_git_corroboration"
ERROR_IGNORE_PROVENANCE = "ignore_provenance"
ERROR_PROVENANCE_CONTRADICTION = "provenance_contradiction"
ERROR_INTERNAL = "internal"

_MARKER_NAME = ".git"
_INDIRECTION_PREFIX = "gitdir:"
_BARE_SIGNATURE_FILE = "HEAD"
_BARE_SIGNATURE_DIRS = ("objects", "refs")

# Exception classes that mean "this path authority could not be normalized".
# Deliberately excludes KeyboardInterrupt/SystemExit, which are BaseException
# and must never be swallowed by an observation seam.
_NORMALIZE_ERRORS = (OSError, ValueError, TypeError, AttributeError)


@dataclass(frozen=True)
class NoGitCorroboration:
    """Structured record of the independent absence-of-Git probe (contract
    section 6). `result` is one of the `CORROBORATION_*` constants and is
    the authoritative reason; `probe` records the deciding three-valued
    probe outcome; `marker_path` / `entry_kind` / `indirection_target` are
    the observed evidence when applicable; `detail` is human text. A stat or
    access failure is always `CORROBORATION_PROBE_ERROR` — never reported as
    a bare-repository signature and never as absence."""
    result: str
    probe: str = None
    marker_path: str = None
    entry_kind: str = None
    indirection_target: str = None
    detail: str = None


@dataclass(frozen=True)
class PrivacyObservation:
    """The authoritative, machine-readable privacy observation (contract
    sections 2.1 and 3). Frozen: an observation is evidence, not a mutable
    accumulator. `diagnostic_lines` is a tuple for the same reason — the
    compatibility seam converts it to the accepted `list[str]` shape at the
    boundary.

    Any field may be None when that evidence was not reached: the field set
    is deliberately flat and total, so a consumer reads `state` plus the
    fields it needs and never parses `diagnostic_lines`.

    state                   one of the nine privacy state constants
    lexical_path            the query, normalized textually, following no link
    resolved_path           the query after filesystem resolution
    topology_relation       one of the TOPOLOGY_* constants
    repo_relative_path      posix path of the query inside the product root
    wrkgit_status           wrkgit.is_repo()'s status for the product root
    tracked                 True/False once wrkgit.tracked() answered
    excluded                True/False once wrkgit.excluded() answered
    ignore_source           deciding rule's source file, as wrkgit reported it
    ignore_source_resolved  that source after normalization (used for the
                            provenance comparison)
    ignore_pattern          deciding rule's raw pattern text
    ignore_line             deciding rule's 1-based line, where available
    is_negation             True when the deciding rule is a negation
    local_exclude_path      effective local exclude file, when consulted
    corroboration           NoGitCorroboration, when the no-Git probe ran
    product_root_lexical    the product root, normalized textually
    product_root_resolved   the product root after filesystem resolution
    legacy_tracked_declared sorted tuple of normalized legacy authority
    legacy_match            True/False once legacy identity was compared
    dependency_status       the failing wrkgit status, when one failed
    error_class             which evidence class failed (ERROR_* constant)
    error_detail            human text for that failure
    diagnostic_lines        deterministic presentation trail (tuple[str])
    """
    state: str
    lexical_path: str = None
    resolved_path: str = None
    topology_relation: str = TOPOLOGY_UNKNOWN
    repo_relative_path: str = None
    wrkgit_status: str = None
    tracked: bool = None
    excluded: bool = None
    ignore_source: str = None
    ignore_source_resolved: str = None
    ignore_pattern: str = None
    ignore_line: int = None
    is_negation: bool = None
    local_exclude_path: str = None
    corroboration: NoGitCorroboration = None
    product_root_lexical: str = None
    product_root_resolved: str = None
    legacy_tracked_declared: tuple = ()
    legacy_match: bool = None
    dependency_status: str = None
    error_class: str = None
    error_detail: str = None
    diagnostic_lines: tuple = ()


def _describe(exc):
    """Deterministic one-line description of a caught exception — the same
    text for the same input, with no timestamp or address in it."""
    return f"{type(exc).__name__}: {exc}"


def _normalize_path_pair(base_lexical, value):
    """Normalize one supplied path authority into (lexical, resolved).

    `lexical` is purely textual (`os.path.normpath`) and follows no link:
    it answers "where is this entry NAMED?". `resolved` follows the
    filesystem: it answers "where does this entry LEAD?". Keeping both is
    what makes the contract section 4 topology law expressible at all.

    Relative values are joined to `base_lexical` when one is supplied.
    Raises one of `_NORMALIZE_ERRORS` for malformed input — a non-path
    object (`TypeError` from `os.fspath`), an embedded NUL (rejected here
    explicitly rather than relying on platform-specific resolution
    behavior), or a resolution failure. Every caller converts that into a
    structured `OBSERVATION_ERROR`; this function never returns a partial
    or guessed result.
    """
    raw = os.fspath(value)
    if isinstance(raw, bytes):
        raw = os.fsdecode(raw)
    if "\x00" in raw:
        raise ValueError("embedded NUL in supplied path authority")
    q = Path(raw)
    if not q.is_absolute() and base_lexical is not None:
        q = base_lexical / q
    lexical = Path(os.path.normpath(str(q)))
    return lexical, q.resolve(strict=False)


def _is_inside(child, root):
    """Is `child` at or under `root`? Purely relational — the caller
    supplies either the lexical or the resolved pair, never a mixture."""
    try:
        child.relative_to(root)
        return True
    except ValueError:
        return False


def _topology_relation(lexical_inside, resolved_inside):
    """The contract section 4 relation for a (lexical, resolved) pair."""
    if lexical_inside and resolved_inside:
        return TOPOLOGY_INSIDE
    if not lexical_inside and not resolved_inside:
        return TOPOLOGY_OUTSIDE
    if lexical_inside:
        return TOPOLOGY_ESCAPES_ROOT
    return TOPOLOGY_ENTERS_ROOT


def _probe_lstat(target):
    """Three-valued existence probe that does NOT follow a final link.

    Returns (probe, stat_result_or_None, detail_or_None) where `probe` is
    `PROBE_PRESENT`, `PROBE_ABSENT`, or `PROBE_ERROR`. Only a positive
    `FileNotFoundError` counts as absence (contract section 6); every other
    `OSError` — permission denial, an I/O failure, a name the platform
    rejects — is an ERROR the caller must fail closed on. This replaces the
    B3B existence helper whose contract collapsed access errors into
    ordinary absence and made the documented fail-closed branch unreachable
    (ITV-B3B-03)."""
    try:
        return PROBE_PRESENT, os.lstat(target), None
    except FileNotFoundError:
        return PROBE_ABSENT, None, None
    except _NORMALIZE_ERRORS as exc:
        return PROBE_ERROR, None, _describe(exc)


def _probe_stat(target):
    """Three-valued existence probe that DOES follow links, with the same
    PRESENT / ABSENT / ERROR contract as `_probe_lstat()`."""
    try:
        return PROBE_PRESENT, os.stat(target), None
    except FileNotFoundError:
        return PROBE_ABSENT, None, None
    except _NORMALIZE_ERRORS as exc:
        return PROBE_ERROR, None, _describe(exc)


def _entry_kind(target, lstat_result):
    """Classify an entry a probe already found PRESENT.

    Returns (entry_kind_or_None, detail). `None` means the classification
    itself failed and the caller must fail closed. A link is followed one
    step only to say what it points at; a broken link is reported as such
    and is never treated as absence."""
    mode = lstat_result.st_mode
    if stat.S_ISDIR(mode):
        return ENTRY_DIRECTORY, None
    if stat.S_ISREG(mode):
        return ENTRY_FILE, None
    if stat.S_ISLNK(mode):
        probe, target_stat, detail = _probe_stat(target)
        if probe == PROBE_ERROR:
            return None, detail
        if probe == PROBE_ABSENT:
            return ENTRY_BROKEN_SYMLINK, None
        if stat.S_ISDIR(target_stat.st_mode):
            return ENTRY_SYMLINK_TO_DIRECTORY, None
        if stat.S_ISREG(target_stat.st_mode):
            return ENTRY_SYMLINK_TO_FILE, None
        return ENTRY_OTHER, None
    return ENTRY_OTHER, None


def _probe_bare_signature(root_resolved):
    """Is there a plausible bare-repository administrative signature — a
    `HEAD` file plus `objects/` and `refs/` directories — sitting directly
    at `root_resolved`? That is exactly the layout Git recognizes as a
    repository with no `.git` subdirectory at all, and exactly why
    `wrkgit.is_repo()` reports a bare repository as `NOT_A_REPO`.

    Returns (probe, detail). `PROBE_ERROR` when ANY of the three probes
    failed — unlike the B3B helper, a stat failure is never reported as a
    signature (ITV-B3B-03); the caller keeps the two reasons apart."""
    probe, head_stat, detail = _probe_stat(root_resolved / _BARE_SIGNATURE_FILE)
    if probe == PROBE_ERROR:
        return PROBE_ERROR, detail
    signature = probe == PROBE_PRESENT and stat.S_ISREG(head_stat.st_mode)
    for name in _BARE_SIGNATURE_DIRS:
        probe, dir_stat, detail = _probe_stat(root_resolved / name)
        if probe == PROBE_ERROR:
            return PROBE_ERROR, detail
        signature = (signature and probe == PROBE_PRESENT
                     and stat.S_ISDIR(dir_stat.st_mode))
    return (PROBE_PRESENT if signature else PROBE_ABSENT), None


def _read_marker_text(marker_path):
    """Read a `.git` marker file's text. Returns (text_or_None, detail);
    `None` means the read failed and the caller must fail closed."""
    try:
        text = marker_path.read_text(encoding="utf-8", errors="replace")
    except _NORMALIZE_ERRORS as exc:
        return None, _describe(exc)
    return text.strip(), None


def _corroborate_indirection(marker_path, text):
    """Classify a `.git` indirection marker whose text names a target.
    Returns (NoGitCorroboration, diagnostic_lines). Never affirmative: an
    indirection marker is administrative state, so `NO_GIT` is withheld
    whether the target exists, is missing, or could not be probed."""
    target_raw = text.split(":", 1)[1].strip()
    try:
        _, target_resolved = _normalize_path_pair(marker_path.parent, target_raw)
    except _NORMALIZE_ERRORS as exc:
        return (NoGitCorroboration(
            result=CORROBORATION_PROBE_ERROR, probe=PROBE_ERROR,
            marker_path=str(marker_path), entry_kind=ENTRY_FILE,
            indirection_target=target_raw, detail=_describe(exc)),
            [f"indirection target {target_raw!r} named by {marker_path} could "
             "not be normalized"])
    probe, _, detail = _probe_lstat(target_resolved)
    if probe == PROBE_ERROR:
        return (NoGitCorroboration(
            result=CORROBORATION_PROBE_ERROR, probe=PROBE_ERROR,
            marker_path=str(marker_path), entry_kind=ENTRY_FILE,
            indirection_target=str(target_resolved), detail=detail),
            [f"stat/access error probing indirection target {target_resolved} "
             f"named by {marker_path}"])
    if probe == PROBE_ABSENT:
        return (NoGitCorroboration(
            result=CORROBORATION_DANGLING_INDIRECTION, probe=PROBE_ABSENT,
            marker_path=str(marker_path), entry_kind=ENTRY_FILE,
            indirection_target=str(target_resolved)),
            [f"dangling indirection at {marker_path} -> {target_raw!r} "
             "(target does not exist)"])
    return (NoGitCorroboration(
        result=CORROBORATION_MARKER_INDIRECTION, probe=PROBE_PRESENT,
        marker_path=str(marker_path), entry_kind=ENTRY_FILE,
        indirection_target=str(target_resolved)),
        [f"{_MARKER_NAME} indirection file present at {marker_path} despite a "
         "NOT_A_REPO observation"])


def _corroborate_no_git(root_resolved):
    """Independent filesystem corroboration required before a `wrkgit`
    `NOT_A_REPO` answer may become this module's affirmative `NO_GIT` (see
    module docstring, "Corroboration law"). Walks `root_resolved` and every
    ancestor looking for a `.git` entry without following it, then probes
    for a plausible bare-repository signature at `root_resolved` itself.

    Returns (NoGitCorroboration, diagnostic_lines). Only
    `CORROBORATION_ABSENCE_CONFIRMED` permits `NO_GIT`; every other result
    — a marker of any kind, a dangling indirection, a bare signature, or a
    probe error — maps to `OBSERVATION_ERROR`, with the true reason
    preserved structurally rather than misattributed."""
    current = root_resolved
    while True:
        marker = current / _MARKER_NAME
        probe, lstat_result, detail = _probe_lstat(marker)
        if probe == PROBE_ERROR:
            return (NoGitCorroboration(
                result=CORROBORATION_PROBE_ERROR, probe=PROBE_ERROR,
                marker_path=str(marker), detail=detail),
                [f"stat/access error probing {marker}; absence of Git "
                 "administrative state could not be established"])
        if probe == PROBE_PRESENT:
            kind, kind_detail = _entry_kind(marker, lstat_result)
            if kind is None:
                return (NoGitCorroboration(
                    result=CORROBORATION_PROBE_ERROR, probe=PROBE_ERROR,
                    marker_path=str(marker), detail=kind_detail),
                    [f"stat/access error classifying {marker}"])
            if kind in (ENTRY_DIRECTORY, ENTRY_SYMLINK_TO_DIRECTORY):
                return (NoGitCorroboration(
                    result=CORROBORATION_MARKER_DIRECTORY, probe=PROBE_PRESENT,
                    marker_path=str(marker), entry_kind=kind),
                    [f"{_MARKER_NAME} directory present at {marker} despite a "
                     "NOT_A_REPO observation"])
            if kind in (ENTRY_FILE, ENTRY_SYMLINK_TO_FILE):
                text, read_detail = _read_marker_text(marker)
                if text is None:
                    return (NoGitCorroboration(
                        result=CORROBORATION_PROBE_ERROR, probe=PROBE_ERROR,
                        marker_path=str(marker), entry_kind=kind,
                        detail=read_detail),
                        [f"stat/access error reading {marker}"])
                if text.lower().startswith(_INDIRECTION_PREFIX):
                    return _corroborate_indirection(marker, text)
                return (NoGitCorroboration(
                    result=CORROBORATION_MARKER_FILE, probe=PROBE_PRESENT,
                    marker_path=str(marker), entry_kind=kind),
                    [f"{_MARKER_NAME} marker file present at {marker} despite "
                     "a NOT_A_REPO observation"])
            return (NoGitCorroboration(
                result=CORROBORATION_MARKER_UNKNOWN_TYPE, probe=PROBE_PRESENT,
                marker_path=str(marker), entry_kind=kind),
                [f"uncertain {_MARKER_NAME} entry type ({kind}) at {marker}"])
        parent = current.parent
        if parent == current:
            break
        current = parent

    probe, detail = _probe_bare_signature(root_resolved)
    if probe == PROBE_ERROR:
        return (NoGitCorroboration(
            result=CORROBORATION_PROBE_ERROR, probe=PROBE_ERROR,
            marker_path=str(root_resolved), detail=detail),
            ["stat/access error probing for a bare-repository signature at "
             f"{root_resolved}; absence could not be established"])
    if probe == PROBE_PRESENT:
        return (NoGitCorroboration(
            result=CORROBORATION_BARE_SIGNATURE, probe=PROBE_PRESENT,
            marker_path=str(root_resolved)),
            ["plausible bare-repository signature (HEAD+objects+refs) at "
             f"{root_resolved} despite a NOT_A_REPO observation"])
    return (NoGitCorroboration(
        result=CORROBORATION_ABSENCE_CONFIRMED, probe=PROBE_ABSENT,
        marker_path=str(root_resolved)),
        [f"no {_MARKER_NAME} entry found at {root_resolved} or any ancestor; "
         f"no bare-repository signature at {root_resolved}"])


def _classify_ignore_source(root_resolved, match, local_exclude_resolved):
    """Classify the deciding `wrkgit.IgnoreMatch`'s provenance (see module
    docstring, "Ignore provenance law").

    Returns (state_or_None, reason, source_resolved_or_None, detail_or_None).
    A `None` state means provenance could not be resolved reliably and the
    caller maps it to `OBSERVATION_ERROR`."""
    try:
        _, src_resolved = _normalize_path_pair(root_resolved, match.source_file)
    except _NORMALIZE_ERRORS as exc:
        return (None,
                f"deciding ignore source {match.source_file!r} could not be "
                "normalized; provenance cannot be classified reliably",
                None, _describe(exc))
    if local_exclude_resolved is not None and src_resolved == local_exclude_resolved:
        return (LOCALLY_PROTECTED,
                f"deciding ignore source {src_resolved} is the effective local "
                "exclude file (wrkgit.local_exclude_path)",
                src_resolved, None)
    if _is_inside(src_resolved, root_resolved) and src_resolved.name == ".gitignore":
        return (PUBLIC_POLICY_IGNORED,
                f"deciding ignore source {src_resolved} is an in-repository "
                ".gitignore",
                src_resolved, None)
    return (USER_GLOBAL_IGNORED,
            f"deciding ignore source {src_resolved} is neither the effective "
            "local exclude file nor an in-repository .gitignore",
            src_resolved, None)


def _normalize_legacy_authority(root_lexical, legacy_tracked):
    """Normalize the caller's explicit `legacy_tracked` authority.

    Returns (resolved_set, declared_tuple, failure_or_None). `failure` is
    (diagnostic_line, detail) when an entry could not be normalized — the
    caller then fails the whole observation closed rather than silently
    dropping the entry (ITV-B3B-06). A bare `str`/`bytes` is rejected: it
    would otherwise be iterated character by character, silently misreading
    explicit authority as a set of one-character paths."""
    if legacy_tracked is None:
        return set(), (), None
    if isinstance(legacy_tracked, (str, bytes)):
        return set(), (), (
            "explicit legacy_tracked authority is a bare string; an iterable "
            "of path entries is required and no entry is silently inferred",
            f"TypeError: {type(legacy_tracked).__name__} is not an iterable "
            "of path entries")
    try:
        entries = list(legacy_tracked)
    except _NORMALIZE_ERRORS as exc:
        return set(), (), (
            "explicit legacy_tracked authority is not iterable",
            _describe(exc))
    resolved = set()
    declared = []
    for entry in entries:
        try:
            _, entry_resolved = _normalize_path_pair(root_lexical, entry)
        except _NORMALIZE_ERRORS as exc:
            return set(), (), (
                f"explicit legacy_tracked entry {entry!r} could not be "
                "normalized and is NOT silently dropped",
                _describe(exc))
        resolved.add(entry_resolved)
        declared.append(str(entry_resolved))
    return resolved, tuple(sorted(declared)), None


def _observe(product_root, path, legacy_tracked, env):
    """The single classification algorithm behind both public seams.

    Ordering is deliberate: product-root authority, then query authority,
    then explicit legacy authority, then topology, then Git observation — so
    malformed authority of any class is refused before any verdict is
    formed, and a cross-boundary topology relation is never followed by a
    guessed tracked/ignore verdict."""
    evidence = {}

    def finish(state, lines, **updates):
        evidence.update(updates)
        return PrivacyObservation(state=state, diagnostic_lines=tuple(lines),
                                  **evidence)

    # --- 1. product root authority -----------------------------------------
    try:
        root_lexical, root_resolved = _normalize_path_pair(None, product_root)
    except _NORMALIZE_ERRORS as exc:
        return finish(OBSERVATION_ERROR, [
            f"product_root {product_root!r} could not be normalized; no "
            "privacy verdict is formed"],
            error_class=ERROR_PRODUCT_ROOT, error_detail=_describe(exc))
    evidence["product_root_lexical"] = str(root_lexical)
    evidence["product_root_resolved"] = str(root_resolved)

    # --- 2. query authority -------------------------------------------------
    try:
        q_lexical, q_resolved = _normalize_path_pair(root_lexical, path)
    except _NORMALIZE_ERRORS as exc:
        return finish(OBSERVATION_ERROR, [
            f"query path {path!r} could not be normalized; no privacy verdict "
            "is formed"],
            error_class=ERROR_QUERY_PATH, error_detail=_describe(exc))
    evidence["lexical_path"] = str(q_lexical)
    evidence["resolved_path"] = str(q_resolved)

    # --- 3. explicit legacy authority --------------------------------------
    legacy_resolved, declared, legacy_failure = _normalize_legacy_authority(
        root_lexical, legacy_tracked)
    evidence["legacy_tracked_declared"] = declared
    if legacy_failure is not None:
        return finish(OBSERVATION_ERROR, [legacy_failure[0]],
                      error_class=ERROR_LEGACY_AUTHORITY,
                      error_detail=legacy_failure[1])

    # --- 4. topology: lexical vs resolved (contract section 4) -------------
    relation = _topology_relation(_is_inside(q_lexical, root_lexical),
                                  _is_inside(q_resolved, root_resolved))
    evidence["topology_relation"] = relation
    if relation == TOPOLOGY_OUTSIDE:
        return finish(TOPOLOGICALLY_PRIVATE, [
            f"{q_lexical} is named outside product_root {root_lexical} and "
            f"{q_resolved} resolves outside {root_resolved}"])
    if relation == TOPOLOGY_ESCAPES_ROOT:
        return finish(OBSERVATION_ERROR, [
            f"{q_lexical} is named inside product_root {root_lexical} but "
            f"resolves to {q_resolved}, outside {root_resolved}",
            "a cross-boundary topology relation is never published as a "
            "protective state and is never followed by a guessed "
            "tracked/ignore verdict"],
            error_class=ERROR_TOPOLOGY)
    if relation != TOPOLOGY_INSIDE:
        return finish(OBSERVATION_ERROR, [
            f"{q_lexical} is named outside product_root {root_lexical} but "
            f"resolves to {q_resolved}, inside {root_resolved}",
            "a cross-boundary topology relation is never published as a "
            "protective state and is never followed by a guessed "
            "tracked/ignore verdict"],
            error_class=ERROR_TOPOLOGY)
    evidence["repo_relative_path"] = q_resolved.relative_to(
        root_resolved).as_posix()

    # --- 5. repository status ----------------------------------------------
    _, git_status, git_diag = wrkgit.is_repo(root_resolved, env)
    evidence["wrkgit_status"] = git_status

    if git_status == wrkgit.NOT_A_REPO:
        corroboration, corroboration_lines = _corroborate_no_git(root_resolved)
        evidence["corroboration"] = corroboration
        if corroboration.result != CORROBORATION_ABSENCE_CONFIRMED:
            return finish(OBSERVATION_ERROR, [
                "wrkgit reported NOT_A_REPO; independent corroboration did "
                "not confirm absence of Git administrative state"]
                + corroboration_lines,
                error_class=ERROR_NO_GIT_CORROBORATION)
        return finish(NO_GIT, [
            "wrkgit reported NOT_A_REPO",
            "independent filesystem corroboration confirmed no Git "
            "administrative state at product_root or any ancestor"]
            + corroboration_lines)

    if git_status != wrkgit.REPO:
        return finish(OBSERVATION_ERROR, [
            f"wrkgit.is_repo returned inconclusive status {git_status!r}, "
            "never treated as NO_GIT"] + list(git_diag),
            error_class=ERROR_WRKGIT_IS_REPO, dependency_status=git_status)

    # --- confirmed REPO from here on ---------------------------------------

    tracked_val, tracked_status, tracked_diag = wrkgit.tracked(
        root_resolved, q_resolved, env)
    if tracked_status != wrkgit.OK:
        return finish(OBSERVATION_ERROR, [
            f"wrkgit.tracked returned inconclusive status {tracked_status!r}"]
            + list(tracked_diag),
            error_class=ERROR_WRKGIT_TRACKED, dependency_status=tracked_status)
    evidence["tracked"] = bool(tracked_val)

    if tracked_val:
        legacy_match = q_resolved in legacy_resolved
        evidence["legacy_match"] = legacy_match
        if legacy_match:
            return finish(LEGACY_TRACKED_PRIVATE_STATE, [
                f"{q_resolved} is tracked and present in the caller-supplied "
                "explicit legacy_tracked set"])
        return finish(PRIVACY_VIOLATION, [
            f"{q_resolved} is tracked and not present in the caller-supplied "
            "legacy_tracked set"])

    # --- untracked: effective exclusion, then ignore provenance ------------

    excl_val, excl_status, excl_diag = wrkgit.excluded(
        root_resolved, q_resolved, env)
    if excl_status != wrkgit.OK:
        return finish(OBSERVATION_ERROR, [
            f"wrkgit.excluded returned inconclusive status {excl_status!r}"]
            + list(excl_diag),
            error_class=ERROR_WRKGIT_EXCLUDED, dependency_status=excl_status)
    evidence["excluded"] = bool(excl_val)

    # The deciding rule is read even when the path is NOT effectively
    # excluded, so an effective negation keeps its provenance structurally
    # instead of being published as a bare UNPROTECTED (contract section 8).
    match, ignored_status, ignored_diag = wrkgit.ignored_by(
        root_resolved, q_resolved, env)
    if ignored_status != wrkgit.OK:
        return finish(OBSERVATION_ERROR, [
            f"wrkgit.ignored_by returned inconclusive status "
            f"{ignored_status!r}"] + list(ignored_diag),
            error_class=ERROR_WRKGIT_IGNORED_BY,
            dependency_status=ignored_status)
    if match is not None:
        evidence["ignore_source"] = match.source_file
        evidence["ignore_pattern"] = match.pattern
        evidence["ignore_line"] = match.source_line
        evidence["is_negation"] = bool(match.is_negation)

    if not excl_val:
        if match is None:
            return finish(UNPROTECTED, [
                f"{q_resolved} is untracked and not effectively excluded",
                "no ignore rule decides this path"])
        if not match.is_negation:
            # Contradictory provenance (contract section 8). The two halves of
            # this observation disagree: effective exclusion is False, yet the
            # deciding rule is POSITIVE. Ordinary check-ignore semantics do not
            # produce that pair, but dependency inconsistency, observation
            # drift/TOCTOU, a seam, or a future dependency change can -- and a
            # fail-closed observation boundary must never publish an
            # internally self-contradictory result as a usable privacy
            # verdict. The contradictory evidence is preserved in full
            # (excluded=False, deciding source/pattern/line, is_negation=False)
            # so a consumer can see exactly what disagreed.
            return finish(OBSERVATION_ERROR, [
                f"{q_resolved} is untracked and reported NOT effectively "
                "excluded, yet the deciding rule is positive (not a negation)",
                f"deciding rule: pattern={match.pattern!r} "
                f"source={match.source_file!r} line={match.source_line!r} "
                f"negation={match.is_negation}",
                "contradictory provenance is never published as a privacy "
                "verdict; the contradictory evidence is preserved structurally "
                "and no mutation is performed"],
                error_class=ERROR_PROVENANCE_CONTRADICTION)
        return finish(UNPROTECTED, [
            f"{q_resolved} is untracked and not effectively excluded",
            f"deciding rule: pattern={match.pattern!r} "
            f"source={match.source_file!r} negation={match.is_negation}"])

    if match is None:
        return finish(OBSERVATION_ERROR, [
            f"{q_resolved} is effectively excluded but wrkgit.ignored_by "
            "found no deciding rule -- provenance cannot be classified "
            "reliably"],
            error_class=ERROR_IGNORE_PROVENANCE)

    lep_val, lep_status, lep_diag = wrkgit.local_exclude_path(root_resolved, env)
    if lep_status != wrkgit.OK:
        return finish(OBSERVATION_ERROR, [
            f"wrkgit.local_exclude_path returned inconclusive status "
            f"{lep_status!r}"] + list(lep_diag),
            error_class=ERROR_WRKGIT_LOCAL_EXCLUDE,
            dependency_status=lep_status)
    local_exclude_resolved = None
    if lep_val:
        try:
            _, local_exclude_resolved = _normalize_path_pair(root_lexical,
                                                            lep_val)
        except _NORMALIZE_ERRORS as exc:
            return finish(OBSERVATION_ERROR, [
                f"effective local exclude path {lep_val!r} could not be "
                "normalized; ignore provenance cannot be classified reliably"],
                error_class=ERROR_IGNORE_PROVENANCE,
                error_detail=_describe(exc))
        evidence["local_exclude_path"] = str(local_exclude_resolved)

    category, reason, src_resolved, src_detail = _classify_ignore_source(
        root_resolved, match, local_exclude_resolved)
    if src_resolved is not None:
        evidence["ignore_source_resolved"] = str(src_resolved)
    if category is None:
        return finish(OBSERVATION_ERROR, [reason],
                      error_class=ERROR_IGNORE_PROVENANCE,
                      error_detail=src_detail)
    return finish(category, [
        reason,
        f"deciding rule: pattern={match.pattern!r} "
        f"source={match.source_file!r} negation={match.is_negation}"])


def observe_private_path(product_root, path, *, legacy_tracked=None, env=None):
    """Observe the current privacy state of `path` relative to
    `product_root` and return the authoritative structured
    `PrivacyObservation` (contract section 2.1). Read-only: issues no Git
    command of its own, only `wrkgit`'s existing read-only invocations.

    `legacy_tracked`, if given, is an iterable of paths the caller has
    already and explicitly declared legacy-tracked-private (contract
    section 7 — legacy is never inferred from history, age, path prefix, or
    naming). Each entry is normalized the same way `path` is before an
    exact-identity comparison; an entry that cannot be normalized fails the
    whole observation closed rather than being silently dropped.

    Never raises for caller/state input: every malformed-input and
    dependency-failure shape is returned as `OBSERVATION_ERROR` with
    `error_class` naming the evidence class that failed. Process-control
    exceptions (`KeyboardInterrupt`, `SystemExit`) deliberately propagate.
    """
    try:
        return _observe(product_root, path, legacy_tracked, env)
    except Exception as exc:
        # Totality guard (contract section 5). The enumerated failure shapes
        # above are all handled structurally; this converts anything
        # unforeseen into the same fail-closed observation rather than
        # letting an enforcement-path consumer take an uncontrolled stop.
        return PrivacyObservation(
            state=OBSERVATION_ERROR,
            topology_relation=TOPOLOGY_UNKNOWN,
            error_class=ERROR_INTERNAL,
            error_detail=_describe(exc),
            diagnostic_lines=(
                "observation failed with an unexpected internal error and is "
                "reported fail-closed; no privacy verdict is formed",))


def classify_private_path(product_root, path, *, legacy_tracked=None, env=None):
    """Compatibility seam (contract section 2.2). Preserved for existing
    callers with the accepted legacy return shape `(state, list[str])`.

    This DELEGATES to `observe_private_path()` and performs no independent
    classification of its own: the state and the diagnostics both come from
    the one structured observation, so the two seams can never disagree.
    New consumers should call `observe_private_path()` and read fields —
    `diagnostic_lines` is presentation, not authority (contract section 3).
    """
    observation = observe_private_path(product_root, path,
                                       legacy_tracked=legacy_tracked, env=env)
    return observation.state, list(observation.diagnostic_lines)
