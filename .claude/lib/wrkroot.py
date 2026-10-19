#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
CCOS WRKOPS 1.8.2 — wrkroot (single workspace-root resolution authority)
==========================================================================
B1 (A01): before this module existed, guard_paths.py and session_genesis.py
each carried their OWN copy of the F024/F031 workspace-root classification
and resolution logic, kept in sync by hand (a comment in each said so).
taskctl.py and check_pairing.py had no F024/F031 awareness at all — taskctl
did `Path(root or CCOS_WORKSPACE_ROOT or ".").resolve()` with no validation,
and check_pairing did `Path(sys.argv[1] or ".")` with none either. Five
consumers, at best two real implementations and at worst zero — this is
exactly the divergence A01 named. This module is now the ONE implementation;
every root-sensitive consumer imports it instead of defining its own.

This is a refactor of AUTHORITY LOCATION, not a reinterpretation of F024/F031
decision semantics. classify_root() and resolve_workspace_root() below are
moved here verbatim from the pre-B1 guard_paths.py (the two pre-B1 copies
were textually identical except for incidental line-wrapping) — the exact
classification rules, the exact fail-closed/fallback decisions, and the exact
diagnostic wording are preserved so a boundary this module blocks or allows
is blocked or allowed for the identical reason it always was.

Governing invariant (unchanged):
  Discovery may identify. Only declared/authorized project identity may
  authorize. Contradictory explicit boundary intent fails closed and must
  never silently widen. `cwd` is discovery input only — it is never mutation
  authority merely because a session or process started there.

Two resolution entry points, because B1's five consumers split into two
shapes:
  resolve_workspace_root()   — hooks (guard_paths, session_genesis,
                                report_writer): read CCOS_WORKSPACE_ROOT /
                                CLAUDE_PROJECT_DIR from the environment only.
                                No CLI argument exists in a hook's contract.
  resolve_declared_root()    — operator CLI tools (taskctl --root,
                                check_pairing's positional root argument):
                                an explicit CLI-declared candidate is checked
                                FIRST, with the identical classify/fail-closed
                                rule CCOS_WORKSPACE_ROOT itself is held to,
                                then falls through to resolve_workspace_root()
                                only when the CLI candidate carried no operator
                                intent at all (absent, empty, or an unresolved
                                $CLAUDE_PROJECT_DIR-style placeholder).
Both return the same (root_or_None, status, diagnostic_lines) result shape,
so a caller never has to know which entry point produced it.

project_id (B1 minimum, additive):
  check_project_binding() is the smallest possible cross-project durable-
  state guard: given two opaque project_id values, it fails closed ONLY on
  an actual disagreement between two PRESENT values. Absence on either side
  is not a mismatch — it is the expected shape of every pre-B1 fixture, which
  carries no project_id at all, and that absence must be handled deliberately
  rather than misread as a fault. No registry, no migration, no generalized
  identity subsystem: this is a pure comparison function, wired into no
  lifecycle command by B1 (see the B1 execution report's "findings outside
  scope" for why broader propagation is deferred).
"""
import os
import re

__version__ = "1.0.0"

# --- F024/F031 classification (moved verbatim; see module docstring) -------
# Claude Code's settings.json 'env' block does NOT shell-expand $VAR forms —
# only the hook 'command' strings do. A shipped
#   CCOS_WORKSPACE_ROOT=$CLAUDE_PROJECT_DIR
# therefore reaches a hook as that literal, un-interpolated text, not the real
# project directory. Treating it as an operative boundary is worse than having
# no root at all: the literal resolves (relative to cwd) to a bogus subdir
# nothing lives under, so CLAUDECLI.2.01 then misfires on every legitimate
# in-workspace write while reporting a target as "outside" a root that was
# never real. The operative root must be resolved before it is trusted.
#
# F031 correction (post-ITV): the original fallback widened to
# CLAUDE_PROJECT_DIR for EVERY unusable CCOS_WORKSPACE_ROOT, including a
# concrete operator-declared value (an absolute path that just doesn't exist,
# or a relative path) — silently widening authority from the boundary the
# operator actually typed to the broader hook-runtime project dir. The
# governing distinction is INTENT:
#   no operator boundary intent   (empty, or an unresolved $CLAUDE_PROJECT_DIR
#                                  / ${CLAUDE_PROJECT_DIR} placeholder token,
#                                  in any decorated/embedded form)
#     -> falling back to CLAUDE_PROJECT_DIR is safe: no boundary was ever
#        declared, so there is nothing to widen away from.
#   explicit operator boundary intent that cannot be honored
#     -> FAIL CLOSED. Never silently widen to CLAUDE_PROJECT_DIR, even when
#        CLAUDE_PROJECT_DIR is itself perfectly valid — the operator declared
#        a specific boundary and it must be honored or refused, not swapped
#        out for a different one it never named.
#
# Placeholder-token detection is a substring search, not exact equality, so a
# quoted/decorated form ('"$CLAUDE_PROJECT_DIR"') or a token embedded in a
# larger value ("$CLAUDE_PROJECT_DIR/sub") is still recognized as "no intent"
# rather than misclassified as a concrete declared path.
PLACEHOLDER_TOKEN_RE = re.compile(r"\$\{?CLAUDE_PROJECT_DIR\}?")

# The unusable shapes named distinctly so a block/unresolved diagnostic says
# WHICH one fired instead of a single catch-all "not usable".
UNUSABLE_MESSAGES = {
    "empty": "is empty",
    "placeholder": "is an unresolved placeholder literal — Claude Code's "
                   "settings 'env' block does not shell-expand this",
    "not-absolute": "is not an absolute path",
    "not-existing": "does not exist as a directory",
}


def classify_root(value: str):
    """Classify a workspace-root candidate value (F031).

    Returns (kind, reason_key):
      ("valid", "")          absolute, existing directory — safe to use as-is.
      ("empty", "empty")     no value at all — no operator boundary intent.
      ("placeholder", "placeholder")
                              contains an unresolved $CLAUDE_PROJECT_DIR /
                              ${CLAUDE_PROJECT_DIR} token (exact, quoted/
                              decorated, or embedded) — no operator boundary
                              intent that can be honored as a literal path.
      ("declared", "not-absolute"|"not-existing")
                              a concrete, non-placeholder value the operator
                              declared, that is not usable as a filesystem
                              boundary. This IS operator intent — it must
                              FAIL CLOSED, never fall back (F031).

    "empty" and "placeholder" are the only kinds where a CLAUDE_PROJECT_DIR
    fallback is permitted; "declared" must never fall back.
    """
    if not value:
        return "empty", "empty"
    if PLACEHOLDER_TOKEN_RE.search(value):
        return "placeholder", "placeholder"
    try:
        from pathlib import Path
        p = Path(value)
    except (OSError, ValueError):
        return "declared", "not-absolute"
    if not p.is_absolute():
        return "declared", "not-absolute"
    if not p.is_dir():
        return "declared", "not-existing"
    return "valid", ""


def resolve_workspace_root(env=None, discovered=None):
    """Resolve the operative CCOS_WORKSPACE_ROOT (F024, corrected by F031).

    env: an environ-like mapping (default os.environ). Every hook consumer
    reads the SAME two variables the same way — this is the single
    implementation A01 requires.

    discovered: an optional session/event-supplied candidate path (e.g. a
    Stop/SessionStart hook's own `data["cwd"]`). B1 corrective
    (B1_CONSUMER_DISCOVERY_INTEGRATION_OMISSION): this is DISCOVERY INPUT
    ONLY — it can help IDENTIFY the workspace, it never AUTHORIZES one. It is
    consulted only as the very last resort, and only when CCOS_WORKSPACE_ROOT
    carries NO signal at all — the key itself is absent from `env`. An
    operator who explicitly declared even an empty CCOS_WORKSPACE_ROOT has
    communicated some intent context, so a present-but-empty value is
    deliberately NOT treated the same as total silence (that PRESENT-EMPTY
    distinction is a separate, later-batch settings/path-hardening concern —
    it is not being solved here, only avoided as a place this discovery step
    could accidentally widen it). A concrete-but-broken CCOS_WORKSPACE_ROOT
    ("declared" kind) returns before this is ever reached, so a contradictory
    explicit declaration is never silently widened by a discovery seed — the
    B1 safety law.

    Order:
      1. explicit CCOS_WORKSPACE_ROOT, if it classifies "valid" (absolute,
         existing, not an unresolved placeholder) — stays authoritative.
      2. if CCOS_WORKSPACE_ROOT classifies "empty" or "placeholder" (NO
         operator boundary intent was resolved), fall back to the hook
         runtime's own CLAUDE_PROJECT_DIR, if that is itself "valid".
      3. if CCOS_WORKSPACE_ROOT classifies "declared" (a concrete boundary
         the operator typed, that cannot be honored) — FAIL CLOSED. Do not
         consult CLAUDE_PROJECT_DIR or `discovered` at all; falling back here
         would silently widen a declared-but-broken boundary into a
         different one.
      4. if neither 1 nor 2 produced a root AND the CCOS_WORKSPACE_ROOT key
         itself was never even present in `env` (no operator context at all
         — not even an explicit empty override) and `discovered` classifies
         "valid", identify the workspace from it. This is DISCOVERY, not a
         widened declaration: it only ever fires where there was nothing to
         widen.
      5. None in every other unresolvable case — caller fails CLOSED.

    Returns (root_or_None, status, diagnostic_lines). status is one of:
      "explicit"            configured value used as-is.
      "fallback"            no operator intent; CLAUDE_PROJECT_DIR used.
      "discovered"          no CCOS_WORKSPACE_ROOT signal anywhere in `env`;
                             the session/event-supplied `discovered` seed
                             identified a usable candidate.
      "declared_unresolved" operator intent declared but unusable; fails
                             closed, CLAUDE_PROJECT_DIR/discovered were never
                             consulted.
      "unresolved"          no operator intent, and no usable
                             CLAUDE_PROJECT_DIR/discovered fallback either.
    """
    e = os.environ if env is None else env
    diag = []
    configured = (e.get("CCOS_WORKSPACE_ROOT", "") or "").strip()
    kind, reason = classify_root(configured)

    if kind == "valid":
        return configured, "explicit", diag

    if kind == "declared":
        diag.append(
            f"CCOS_WORKSPACE_ROOT={configured!r} {UNUSABLE_MESSAGES[reason]}. "
            f"This is an explicit operator-declared boundary that cannot be "
            f"honored, so it FAILS CLOSED rather than silently widening to "
            f"CLAUDE_PROJECT_DIR (F031).")
        diag.append("No trustworthy workspace root could be established.")
        return None, "declared_unresolved", diag

    # kind is "empty" or "placeholder": no operator boundary intent was ever
    # resolved, so a CLAUDE_PROJECT_DIR fallback is permitted.
    if kind == "empty":
        diag.append("CCOS_WORKSPACE_ROOT is empty.")
    else:
        diag.append(
            f"CCOS_WORKSPACE_ROOT={configured!r} {UNUSABLE_MESSAGES[reason]}; "
            f"no operator boundary intent was declared, so falling back to "
            f"the hook runtime's CLAUDE_PROJECT_DIR is permitted.")

    runtime = (e.get("CLAUDE_PROJECT_DIR", "") or "").strip()
    runtime_kind, runtime_reason = classify_root(runtime)
    if runtime_kind == "valid":
        diag.append(f"using hook runtime CLAUDE_PROJECT_DIR as workspace "
                    f"root: {runtime}")
        return runtime, "fallback", diag

    if runtime_kind == "empty":
        diag.append("CLAUDE_PROJECT_DIR is not set in the hook environment "
                    "either — no fallback available.")
    else:
        diag.append(
            f"CLAUDE_PROJECT_DIR={runtime!r} {UNUSABLE_MESSAGES[runtime_reason]} "
            f"— no fallback available.")

    # B1 corrective (B1_CONSUMER_DISCOVERY_INTEGRATION_OMISSION): a
    # session/event discovery seed (e.g. Stop/SessionStart's data["cwd"]) MAY
    # identify the workspace — but only where CCOS_WORKSPACE_ROOT carried no
    # signal whatsoever (the key itself absent from `env`). Discovery never
    # runs when an explicit declaration (valid or broken) already answered
    # the question above; that fail-closed path returns long before here.
    if discovered and "CCOS_WORKSPACE_ROOT" not in e:
        disc = discovered.strip() if isinstance(discovered, str) else discovered
        disc_kind, disc_reason = classify_root(disc)
        if disc_kind == "valid":
            # ITV-B1-04: this message must not claim there was no
            # CLAUDE_PROJECT_DIR signal at all when one was in fact present
            # but unusable (e.g. a broken/non-existent path) — that is a
            # different, and false, diagnostic claim. Distinguish the two:
            # runtime_kind == "empty" means CLAUDE_PROJECT_DIR genuinely
            # carried no value either; anything else means it was present
            # but could not be used.
            if runtime_kind == "empty":
                diag.append(
                    f"no CCOS_WORKSPACE_ROOT/CLAUDE_PROJECT_DIR signal present at "
                    f"all; identifying the workspace from the session/event "
                    f"discovery seed: {disc}")
            else:
                diag.append(
                    f"CCOS_WORKSPACE_ROOT signal absent; CLAUDE_PROJECT_DIR="
                    f"{runtime!r} {UNUSABLE_MESSAGES[runtime_reason]} and could "
                    f"not be used as a fallback; identifying the workspace from "
                    f"the session/event discovery seed instead: {disc}")
            return disc, "discovered", diag
        diag.append(
            f"session/event discovery seed {disc!r} "
            f"{UNUSABLE_MESSAGES.get(disc_reason, 'is not usable')} — not used.")

    diag.append("No trustworthy workspace root could be established.")
    return None, "unresolved", diag


def resolve_declared_root(declared, env=None):
    """Resolve a workspace root for an operator CLI tool (taskctl --root,
    check_pairing's positional root argument).

    `declared` is the explicit candidate the operator typed on the command
    line, or None/"" if they gave none. It is held to the SAME classify/
    fail-closed rule as CCOS_WORKSPACE_ROOT (F031): a concrete value that
    cannot be honored fails closed and is never silently swapped for a
    different root the operator never named. A `declared` value that itself
    carries no operator intent (absent, empty, or an unresolved
    $CLAUDE_PROJECT_DIR-style placeholder) falls through to
    resolve_workspace_root(), so a bare `taskctl.py status` with no --root
    behaves exactly as it always has: governed by CCOS_WORKSPACE_ROOT /
    CLAUDE_PROJECT_DIR, if either is set.

    Returns (root_or_None, status, diagnostic_lines) — same shape as
    resolve_workspace_root(), plus "explicit" is returned for a directly
    usable `declared` value (mirrors "explicit" status for
    CCOS_WORKSPACE_ROOT: an operator-declared value that was honored as-is).
    """
    declared = (declared or "").strip() if isinstance(declared, str) else declared
    if not declared:
        return resolve_workspace_root(env)

    kind, reason = classify_root(declared)
    if kind == "valid":
        return declared, "explicit", []
    if kind == "declared":
        diag = [
            f"declared root {declared!r} {UNUSABLE_MESSAGES[reason]}. This "
            f"is an explicit operator-declared boundary that cannot be "
            f"honored, so it FAILS CLOSED rather than silently widening to "
            f"a different root it never named (F031)."]
        return None, "declared_unresolved", diag

    # "placeholder": a $CLAUDE_PROJECT_DIR-style token typed as the CLI root
    # carries no operator intent either — fall through to the env resolver,
    # exactly like an empty/placeholder CCOS_WORKSPACE_ROOT does.
    return resolve_workspace_root(env)


# --- project_id (B1 minimum additive binding) -------------------------------
# Opaque by construction: no path, project name, date, user, or machine
# meaning is encoded. p_ + 16 lowercase hex chars, matching the pattern
# project.schema.json's optional `project_id` property enforces.
PROJECT_ID_PATTERN = re.compile(r"^p_[0-9a-f]{16}$")


def valid_project_id(value):
    """True if `value` is a well-formed opaque project_id. Absence (None/"")
    is NOT validated here — callers decide what absence means for them."""
    return bool(value) and bool(PROJECT_ID_PATTERN.match(value))


def check_project_binding(declared_project_id, candidate_project_id):
    """B1 minimum project/root binding check (cross-project durable-state
    mismatch guard).

    Absence on EITHER side means no binding was ever declared for this
    workspace/state pair — every pre-B1 fixture carries no project_id at
    all, and that absence must be handled deliberately, not misread as a
    mismatch (constraint: "absence in pre-B1 project fixtures must be
    handled deliberately and tested"). Only a concrete DISAGREEMENT between
    two PRESENT, differing project_ids fails closed.

    Returns (ok, reason): ok is False only on an actual mismatch.
    """
    if not declared_project_id or not candidate_project_id:
        return True, ("no project_id declared on one or both sides; "
                      "binding not enforced")
    if declared_project_id != candidate_project_id:
        return False, (
            f"project_id mismatch: workspace declares "
            f"{declared_project_id!r}, durable state carries "
            f"{candidate_project_id!r} — refusing to bind mismatched "
            f"project identity across roots")
    return True, "project_id matches"
