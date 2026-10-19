#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
CCOS WRKOPS 1.8.2 — guard-paths (PreToolUse)
===========================================
Deterministic write-guard. Blocks a tool call (exit 2) when it would touch a
path that a WRKOPS guarantee rule forbids. This is the executable half of the
guarantee protocols; the .md files keep the explanation + fallback.

Rules enforced (see protocols/ for the judgment/fallback text):
  CLAUDECLI.2.01  no write outside workspace root
  CLAUDECLI.2.05  no self-modify of CLAUDE.md / the protocol docs dir
  WRKOPS.9.04 / F22  NO_STATE_WRITE — only taskctl.py writes the state records
                  in CCOS_METADATA_DIR (active_task.json, project.json)
  CLAUDECLI.3.04  credential / secret files off-limits
  SOT             frozen / _old / _frozen sources are read-only
  INTEL_GENESIS.7.01  intel docs never written into a tracked/public path
  WRKOPS.19.01/.02    (advisory) local abs paths + secrets inside artifacts

Contract:
  stdin  : Claude Code PreToolUse JSON envelope
  stdout : nothing on allow; JSON deny object is optional (exit 2 is the gate)
  stderr : human-readable reason, fed back to the model, on block
  exit 0 : allow     exit 2 : BLOCK     (never exit 1 — non-blocking footgun)

Config knobs come from environment, injected per-project by settings.json so
this file stays generic (library-before-project):
  CCOS_WORKSPACE_ROOT   absolute workspace root (required for 2.01). Resolved
                        via wrkroot.resolve_workspace_root() (F024, corrected
                        by F031) — see wrkroot.py for the full rule.
  CLAUDE_PROJECT_DIR    hook runtime's real project dir (F024/F031 fallback,
                        used only when CCOS_WORKSPACE_ROOT carries no
                        operator boundary intent at all)
  CCOS_PROTECTED_GLOBS  extra ':'-separated globs to treat as self-modify
  CCOS_INTEL_DIR        rel/abs path of the intel dir (default: intel/)
  CCOS_FROZEN_MARKERS   ':'-sep path fragments meaning frozen (default below)
  CCOS_METADATA_DIR     state-record dir Claude may not write (default
                        _wrkops/metadata)

1.8.1 — NO_STATE_WRITE (F22, operator-confirmed 2026-07-18)
-----------------------------------------------------------
The audit found that F22's NO_SELF_MODIFY half already held (CLAUDE.md is
blocked) but its authorised-writer half did not exist: Claude could write
_wrkops/metadata/active_task.json directly. Verified against the 1.8.0 hook —
exit 0, allowed.

That mattered more than it looked. active_task.json is the SOLE AUTHORITY for
task identity and location (delta 9.1). A model that can edit the authority can
make any report "match" simply by rewriting what it is supposed to match, and
every downstream identity check becomes theatre. The 1.8.1 SessionStart anchor
also states NO_STATE_WRITE as law — a law nothing enforced, which is worse than
no law at all, because it reads as enforced.

Claude still writes handoffs and reports: those are its own account of the work
and must stay in its hands. Only the STATE RECORDS are closed, and only
taskctl.py — invoked by the operator, out of band — may write them.

1.8.2 — B1 (A01/A04/A05)
-------------------------
The F024/F031 workspace-root classification/resolution this file used to
carry as a private, hand-duplicated copy now lives once in wrkroot.py
(imported below); this file consumes it instead of defining it. The
self-modify glob for the protocol docs dir now derives from wrkpaths.py's
DOCS_DIR ("_wrkops/docs") instead of the stale "docs/wrkops/*" shape that
predated settings.base.json's actual "_wrkops/docs" default (A04's
path-constant finding).

Because this hook is the write-boundary gate itself, a missing/broken shared
library must not become a silent "no rule applied": if wrkroot/wrkpaths
cannot be imported, every write is blocked (fail CLOSED), never allowed.
"""
import sys, os, json, fnmatch
from pathlib import PurePath, Path

EXIT_ALLOW, EXIT_BLOCK = 0, 2

# Isolated/embedded Python (e.g. Windows python314._pth) does not auto-add the
# running script's own directory to sys.path, so the sibling import below can
# fail with ModuleNotFoundError. Bootstrap it explicitly first.
_HOOKS_DIR = Path(__file__).resolve().parent
if str(_HOOKS_DIR) not in sys.path:
    sys.path.insert(0, str(_HOOKS_DIR))

import hookpath

_LIB = hookpath.bootstrap()
if _LIB is not None:
    import wrkroot
    import wrkpaths
    _DOCS_DIR = wrkpaths.DOCS_DIR
else:
    # main() fails CLOSED for every write when _LIB is None (see below), so
    # this value is never actually consulted for a real decision — it only
    # keeps the module importable while that failure path is reached.
    _DOCS_DIR = "_wrkops/docs"

# --- tools that actually write to disk (case-sensitive tool names) ----------
WRITE_TOOLS = {"Write", "Edit", "MultiEdit", "NotebookEdit"}

# --- default patterns (overridable via env) ---------------------------------
SECRET_GLOBS = [
    "*.env", ".env", ".env.*", "*.key", "*.pem", "*.pfx", "*.p12",
    "*secrets*", "*/secrets/*", "id_rsa", "id_ed25519", "*.keystore",
    "credentials", "*credentials*", "*.crt.key",
]
# B1/A04: derives from wrkpaths.DOCS_DIR ("_wrkops/docs") — the shape
# settings.base.json actually ships — instead of the stale "docs/wrkops/*".
SELF_MODIFY_GLOBS = [
    "CLAUDE.md", "*/CLAUDE.md",
    f"{_DOCS_DIR}/*", f"*/{_DOCS_DIR}/*",
]
DEFAULT_FROZEN = ["/_frozen/", "/_old/", "/_frozen_", "_ARCHIVED_", "/frozen/"]


def die(reason: str):
    """Block the tool call: reason -> stderr, exit 2."""
    sys.stderr.write("[guard-paths BLOCK] " + reason + "\n")
    # optional structured decision (honored on exit 2 as belt-and-suspenders)
    print(json.dumps({"hookSpecificOutput": {
        "hookEventName": "PreToolUse",
        "permissionDecision": "deny",
        "permissionDecisionReason": reason,
    }}))
    sys.exit(EXIT_BLOCK)


def norm(p: str) -> str:
    """Normalize a path for fragment matching (posix sep, lowercased later)."""
    return str(PurePath(p)).replace("\\", "/")


def matches_any(path: str, globs) -> bool:
    base = os.path.basename(path)
    for g in globs:
        if fnmatch.fnmatch(path, g) or fnmatch.fnmatch(base, g):
            return True
    return False


def target_path(tool_name: str, tool_input: dict) -> str:
    """Extract the file path a write tool is aiming at."""
    for k in ("file_path", "path", "notebook_path"):
        v = tool_input.get(k)
        if v:
            return v
    return ""


def is_outside_root(path: str, root: str) -> bool:
    try:
        rp = Path(path).resolve()
        rr = Path(root).resolve()
        return not (rp == rr or rr in rp.parents)
    except Exception:
        # if we cannot resolve, be conservative and block
        return True


def main():
    try:
        data = json.load(sys.stdin)
    except Exception:
        # malformed envelope: do not silently allow a write
        die("could not parse PreToolUse input JSON")
    if not isinstance(data, dict):
        die("PreToolUse input is not a JSON object")

    tool_name = data.get("tool_name", "")
    tool_input = data.get("tool_input", {}) or {}

    if tool_name not in WRITE_TOOLS:
        sys.exit(EXIT_ALLOW)  # only gate writes

    path = target_path(tool_name, tool_input)
    if not path:
        sys.exit(EXIT_ALLOW)  # nothing to guard

    # B1: the write-boundary gate depends on wrkroot/wrkpaths to compute both
    # the root check and the self-modify glob. A hook that cannot find its
    # own shared library must fail CLOSED, never quietly skip enforcement.
    if _LIB is None:
        die("shared library (wrkroot/wrkpaths) not found; cannot resolve the "
            "workspace-root boundary or protected-path constants. Failing "
            "CLOSED rather than risking a write with an unknown boundary.\n"
            + hookpath.missing_message())

    p = norm(path)
    pl = p.lower()

    # env config
    root, root_status, root_diag = wrkroot.resolve_workspace_root()
    extra_protected = [g for g in os.environ.get("CCOS_PROTECTED_GLOBS", "").split(":") if g]
    intel_dir = os.environ.get("CCOS_INTEL_DIR", "intel/").strip().replace("\\", "/").lower()
    metadata_dir = os.environ.get("CCOS_METADATA_DIR", wrkpaths.METADATA_DIR).strip().replace("\\", "/").lower()
    frozen = [m.lower() for m in
              os.environ.get("CCOS_FROZEN_MARKERS", ":".join(DEFAULT_FROZEN)).split(":") if m]

    # #17 — gitignored operational metadata is exempt from the local-abs-path
    # scan (WRKOPS.19.01). Scoped to CCOS_METADATA_DIR only; secret scan (3.04)
    # and self-modify (2.05) still apply. project.json legitimately holds an
    # absolute workspace_root and must not trip its own guard.
    in_metadata = metadata_dir and metadata_dir in pl

    # --- CLAUDECLI.3.04 : secrets off-limits --------------------------------
    if matches_any(p, SECRET_GLOBS):
        die(f"CLAUDECLI.3.04 — secret/credential file is off-limits: {path}")

    # --- CLAUDECLI.2.05 : no self-modify ------------------------------------
    if matches_any(p, SELF_MODIFY_GLOBS + extra_protected):
        die(f"CLAUDECLI.2.05 — CLAUDE.md / {_DOCS_DIR}/ self-modify requires "
            f"explicit operator instruction naming the file: {path}")

    # --- F22 / NO_STATE_WRITE : state records are taskctl-only --------------
    # Scoped deliberately: the metadata DIR only. Reports and handoffs stay
    # writable — a report Claude cannot write is a report that does not exist.
    if in_metadata:
        die(f"WRKOPS.9.04 / F22 NO_STATE_WRITE — {metadata_dir}/ holds the "
            f"state records (active_task.json, project.json) and only "
            f"taskctl.py may write them: {path}\n"
            f"  active_task.json is the sole authority for task identity "
            f"(9.1). If it could be edited from inside the session, every "
            f"identity check downstream would be checking the session's own "
            f"claim against itself.\n"
            f"  To change task state, ask the operator to run:\n"
            f"    taskctl.py start|validate|close|abort\n"
            f"  If a state record is WRONG, say so in the report under "
            f"'## Findings outside declared scope' — do not correct it "
            f"yourself.")

    # --- SOT : frozen / _old sources are read-only --------------------------
    for m in frozen:
        if m in pl:
            die(f"SOT — frozen/_old source is read-only (marker '{m.strip('/')}'): {path}")

    # --- INTEL_GENESIS.7.01 : intel docs never into a tracked path ----------
    # (project instantiation also adds a gitignore entry per 7.02; this is the
    #  live gate so an intel doc can't be written somewhere it'd be committed)
    if intel_dir and intel_dir not in pl and (
        "/intel/" in pl or pl.endswith("/intel") or "_intel_" in pl or ".intel." in pl
    ):
        die(f"INTEL_GENESIS.7.01 — intel content must live under the declared "
            f"intel dir ('{intel_dir}'), never elsewhere: {path}")

    # --- CLAUDECLI.2.01 : no write outside workspace root -------------------
    # F024/F031: root may be None here (no trustworthy value could be
    # resolved). That is not "no rule configured" — it is "the boundary is
    # unknown", and an unknown boundary must fail CLOSED, never fail open.
    # root_status distinguishes WHY: "declared_unresolved" means the operator
    # named a concrete boundary that could not be honored (F031 — must never
    # be reported or treated as a plain fallback-style unresolved case);
    # "unresolved" means no operator intent existed and no fallback was
    # usable either.
    if not in_metadata:
        if root is None:
            if root_status == "declared_unresolved":
                header = ("CLAUDECLI.2.01 — an explicit operator-declared "
                           "workspace boundary cannot be honored; failing "
                           "CLOSED rather than widening to CLAUDE_PROJECT_DIR "
                           "(F031).\n")
            else:
                header = ("CLAUDECLI.2.01 — no trustworthy workspace root "
                           "could be established; failing CLOSED for write "
                           "tools (F024).\n")
            die(header
                + "\n".join(f"    {d}" for d in root_diag)
                + f"\n    target: {path}\n"
                  f"    stop and report to the operator before acting.")
        if is_outside_root(path, root):
            reason = (f"CLAUDECLI.2.01 — write outside workspace root is "
                       f"forbidden.\n    root:   {root}\n    target: {path}\n")
            if root_diag:
                reason += "\n".join(f"    {d}" for d in root_diag) + "\n"
            reason += "    stop and report to the operator before acting."
            die(reason)

    sys.exit(EXIT_ALLOW)


if __name__ == "__main__":
    main()
