#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
CCOS WRKOPS 1.8.1 — session-genesis (SessionStart)
===================================================
The "GenesisHook". On SessionStart, stdout is injected into the model's
context (SessionStart is one of the few events whose stdout Claude sees).
We use that to ANCHOR the session deterministically instead of hoping the
model loads the right files:

  STARTUP_PACK.2.01   minimum load is WRKOPS + REGISTRY
  STARTUP_PACK.3.01   CC reads CLAUDE.md before any other action
  WRKOPS.1.03         every session reads WRKOPS + REGISTRY
  WRKOPS.7.01 / 16.01 mode + HIGH-context flag declared at start
  VERSION_TRACE.3.01  state current + target version when active
  WRKOPS.10.01 (1.8.1) SessionStart projects the active task from
                       active_task.json — the sole authority (9.1)

Why this file changed (delta F16/F08):
  1.8.0's session_genesis.py NEVER OPENED active_task.json. The string
  "active_task" appeared nowhere in the file; CCOS_ACTIVE_TASK was configured
  in settings.base.json and consumed only by guard_handoff.py and
  report_writer.py. The hook whose entire job is anchoring the session was
  blind to the one record that defines it. That is not a weak projection — it
  is the total absence of one. After /clear the model had nothing to re-enter
  from, which is exactly what 10.3 exists to prevent.

  Also fixed: the hook defaulted CCOS_WRKOPS_DIR to "docs/wrkops" while
  settings.base.json sets "_wrkops/docs". Settings wins, so this was harmless
  in practice — but a default that contradicts shipped config is a lie sitting
  in the file, and the next reader has no way to know which one is real.

Prohibited behavior (delta 10.2) — enforced by CONSTRUCTION, not by care:
  This hook reads active_task.json and nothing else task-related. It does not
  read CLAUDE.md, does not glob handoffs, does not consult git history, does
  not dump the handoff body. There is no code path that could infer a task,
  because there is no code that looks anywhere else. That is the only way a
  "must not infer" rule can actually hold in a program.

This hook READS and SURFACES; it never writes. It prints a compact anchor:
the active-task projection, the workspace-root resolution (F026), the
boundary laws (one line each), the protocol index, current git branch +
dirty state (read-only), and the version line if a VERSION file is present.

  exit 0 always (SessionStart cannot block; stdout becomes context)

Env:
  CCOS_WRKOPS_DIR    dir holding protocol docs (default: _wrkops/docs)
  CCOS_METADATA_DIR  dir holding project.json / active_task.json
  CCOS_ACTIVE_TASK   active-task pointer (default: _wrkops/metadata/active_task.json)
  CCOS_SCHEMAS_DIR   schema dir (default: <lib>/../schemas)
  CCOS_VERSION_FILE  optional file whose first line is the version state
  CCOS_LIB_DIR       override for the shared library location
  CCOS_WORKSPACE_ROOT  workspace root (F024/F026, corrected by F031).
                     Resolved via wrkroot.resolve_workspace_root() — see
                     wrkroot.py for the full rule.
  CLAUDE_PROJECT_DIR hook runtime's real project dir (F024/F026/F031
                     fallback, used only when CCOS_WORKSPACE_ROOT carries no
                     operator boundary intent at all)

1.8.2 — B1 (A01)
-----------------
The F024/F031 classification/resolution this file used to carry as a
private, hand-duplicated copy (kept "in sync" with guard_paths.py's copy by
comment, not by construction) now lives once in wrkroot.py; this file
consumes it instead of defining it.

B1 also closes the actual root-divergence bug A01 named: this file used to
resolve+surface CCOS_WORKSPACE_ROOT for the "WORKSPACE ROOT:" line while
project_active_task() separately read active_task.json from
`Path(data["cwd"]) / CCOS_METADATA_DIR` — an UNRELATED value with no
guarantee of agreeing with the resolved root. The root reported to the
operator is now the SAME value used to read state: resolved once in main(),
passed to both projections. When that resolution fails, active-task state is
reported UNKNOWN rather than silently read from an unvalidated cwd.

1.8.2 — B1 corrective (B1_CONSUMER_DISCOVERY_INTEGRATION_OMISSION)
--------------------------------------------------------------------
The first B1 pass resolved the root from CCOS_WORKSPACE_ROOT/
CLAUDE_PROJECT_DIR only, so a hermetic run with neither configured resolved
to nothing even though the SessionStart event's own cwd correctly identified
the workspace. `cwd` is now passed to wrkroot.resolve_workspace_root() as a
discovery SEED — it can help the resolver IDENTIFY the workspace when no
operator declaration exists at all, but it still never overrides or widens
an explicit CCOS_WORKSPACE_ROOT declaration, valid or broken (see
wrkroot.py for the exact rule).

1.8.2 — B1 ITV corrective (ITV-B1-03: SessionStart split-root projection)
---------------------------------------------------------------------------
The prior B1 pass fixed active-task state to read from the resolved root, but
left the PROTOCOL INDEX and VERSION STATE lines reading from the raw event
`cwd` — so a divergent declared-root/event-cwd session could declare one root
in the "WORKSPACE ROOT:" line while handing the model a protocol index and
version string read from a completely different tree. Both now read from the
same resolved `root` used for active-task state and displayed as
"WORKSPACE ROOT:". When `root` is None (unresolved), the protocol index and
version state are reported as unavailable/UNKNOWN rather than silently
falling back to reading from `cwd`.

Git observation is explicitly NOT part of this corrective and remains
unchanged: it still observes the raw event `cwd`, which may legitimately
diverge from the resolved workspace root reported above it. Correct Git
authority requires PRODUCT_ROOT awareness, which is deferred to B2. This file
does not claim Git observation is root-unified.
"""
import sys, os, json, subprocess
from pathlib import Path

# Isolated/embedded Python (e.g. Windows python314._pth) does not auto-add the
# running script's own directory to sys.path, so the sibling import below can
# fail with ModuleNotFoundError. Bootstrap it explicitly first.
_HOOKS_DIR = Path(__file__).resolve().parent
if str(_HOOKS_DIR) not in sys.path:
    sys.path.insert(0, str(_HOOKS_DIR))

import hookpath

_LIB = hookpath.bootstrap()
if _LIB is not None:
    import wrkparse
    import wrkstate
    import wrkroot
    import wrkpaths

__version__ = "1.8.1"

def read_first_line(p: Path) -> str:
    try:
        return p.read_text(encoding="utf-8", errors="replace").splitlines()[0].strip()
    except Exception:
        return ""


def project_workspace_root(lines, root, status, diag):
    """F026: surface workspace-root resolution before governed product work
    begins. An invalid/unresolved root must never render as a quiet-looking
    readiness statement — guard_paths.py (F024) will fail CLOSED for write
    tools in this state, and the model needs to know that BEFORE it tries.

    F031: a declared-but-unusable CCOS_WORKSPACE_ROOT (status
    "declared_unresolved") is operator INTENT that could not be honored, and
    must be reported as UNRESOLVED — never rendered as if it had quietly and
    successfully fallen back to CLAUDE_PROJECT_DIR. The diagnostic text is
    kept distinct from the plain no-intent "unresolved" case so a reader can
    tell "you declared a boundary and it broke" apart from "you declared
    nothing and there was no fallback either".

    B1: (root, status, diag) are resolved ONCE in main() via
    wrkroot.resolve_workspace_root() and passed in here — this function only
    RENDERS the result, it does not resolve it. The same tuple is used by
    project_active_task() for its actual state reads, so the root reported
    here is guaranteed to be the root state was read from (A01)."""
    if status == "explicit":
        lines.append(f"WORKSPACE ROOT: {root}  (CCOS_WORKSPACE_ROOT, explicit)")
    elif status == "fallback":
        lines.append(f"WORKSPACE ROOT: {root}  (CLAUDE_PROJECT_DIR fallback — "
                     f"CCOS_WORKSPACE_ROOT was unusable)")
        for d in diag:
            lines.append(f"  {d}")
    elif status == "discovered":
        # B1 corrective: no CCOS_WORKSPACE_ROOT/CLAUDE_PROJECT_DIR signal was
        # present at all, so the session's own cwd was used as a discovery
        # seed to identify the workspace — this IS a resolved root, and must
        # be surfaced as one (never rendered as UNRESOLVED), since it is the
        # same value active-task state was just read from.
        lines.append(f"WORKSPACE ROOT: {root}  (session/event discovery seed "
                     f"— no CCOS_WORKSPACE_ROOT/CLAUDE_PROJECT_DIR declared)")
        for d in diag:
            lines.append(f"  {d}")
    elif status == "declared_unresolved":
        lines.append("WORKSPACE ROOT: UNRESOLVED (F031) — an explicit "
                     "operator-declared boundary could not be honored, and "
                     "was NOT widened to CLAUDE_PROJECT_DIR.")
        for d in diag:
            lines.append(f"  {d}")
        lines.append("  guard_paths.py will fail CLOSED for all write tools "
                     "until this is fixed (CLAUDECLI.2.01). Report this to "
                     "the operator and stop before any write-tool use.")
    else:
        lines.append("WORKSPACE ROOT: UNRESOLVED (F024/F026) — no "
                     "trustworthy boundary could be established.")
        for d in diag:
            lines.append(f"  {d}")
        lines.append("  guard_paths.py will fail CLOSED for all write tools "
                     "until this is fixed (CLAUDECLI.2.01). Report this to "
                     "the operator and stop before any write-tool use.")


def git(cwd, *args):
    try:
        out = subprocess.run(["git", *args], cwd=cwd, capture_output=True,
                             text=True, timeout=5)
        return out.stdout.strip()
    except Exception:
        return ""

def project_active_task(root, lines):
    """Append the active-task projection (10.1). Reads ONLY active_task.json,
    from the RESOLVED workspace root (B1/A01) — never from an unvalidated
    `data["cwd"]` that could disagree with the root reported above it.

    Four outcomes, and the distinction between them is the whole point:
      ACTIVE             — pointer present and valid: project its concrete fields
      NO ACTIVE TASK     — pointer ABSENT: that absence IS the no-active state
      POINTER UNREADABLE — pointer present but corrupt: NOT the same as absent
      UNKNOWN            — the workspace root itself could not be resolved:
                            state cannot be read from an unknown location,
                            and that is not the same as "no active task" either

    The third and fourth cases are why this is not four lines of json.load. A
    corrupt sole authority (or an unresolved root) rendered as "NO ACTIVE
    TASK" would tell the model it is free to start fresh while a real task
    sits half-open on disk — F18 resurrection wearing a clean shirt. Absence
    is a fact; corruption and an unknown root are unknowns. None of the three
    may ever print the same thing as another.
    """
    if _LIB is None:
        lines.append("ACTIVE TASK: UNKNOWN — shared library not found.")
        lines.append("  " + hookpath.missing_message().replace("\n", "\n  "))
        lines.append("  Do NOT infer the active task from any other source.")
        lines.append("  Report this to the operator and stop.")
        return

    if root is None:
        lines.append("ACTIVE TASK: UNKNOWN — workspace root could not be resolved.")
        lines.append("  Active-task state cannot be read from an unknown root.")
        lines.append("  See WORKSPACE ROOT below for the resolution failure.")
        lines.append("  Do NOT infer the active task from any other source.")
        lines.append("  Report this to the operator and stop.")
        return

    meta_dir = Path(root) / os.environ.get(
        "CCOS_METADATA_DIR", wrkpaths.METADATA_DIR)
    schemas_dir = os.environ.get("CCOS_SCHEMAS_DIR", "").strip()
    if not schemas_dir:
        schemas_dir = str(Path(_LIB).parent / "schemas")

    try:
        active = wrkstate.load_active(meta_dir, schemas_dir)
    except wrkstate.StateError as e:
        lines.append("ACTIVE TASK: POINTER UNREADABLE — this is NOT 'no active task'.")
        for ln in str(e).splitlines():
            lines.append(f"  {ln}")
        lines.append("  active_task.json is the sole authority (9.1). It is present")
        lines.append("  but unusable, so the true state is UNKNOWN.")
        lines.append("  Do NOT start, close, or infer a task. Report and stop.")
        return
    except wrkparse.ParseError as e:
        lines.append("ACTIVE TASK: SCHEMA UNAVAILABLE — state UNKNOWN.")
        lines.append(f"  {e}")
        lines.append("  Do NOT infer the active task. Report and stop.")
        return

    src = os.environ.get(
        "CCOS_ACTIVE_TASK", f"{wrkpaths.METADATA_DIR}/active_task.json")

    if active is None:
        lines.append("NO ACTIVE TASK")
        lines.append(f"  source: {src} (absent)")
        lines.append("  No scoped task is open. Writes outside _wrkops/ are gated")
        lines.append("  (guard_handoff). Ask the operator to start a task.")
        return

    lines.append("ACTIVE TASK")
    lines.append(f"  task_id: {active['task_id']}")
    lines.append(f"  slug:    {active['slug']}")
    lines.append(f"  state:   {active['state']}")
    lines.append(f"  handoff: {active['handoff']}")
    lines.append(f"  report:  {active['expected_report']}")
    lines.append(f"  source:  {src}")

    # Observations, not inferences. If the handoff the pointer names is gone,
    # say so — do not go looking for a replacement.
    hp = Path(root) / active["handoff"]
    if not hp.exists():
        lines.append("  WARNING: the named handoff is MISSING on disk.")
        lines.append("    Do not substitute another handoff. Report and stop.")
    rp = Path(root) / active["expected_report"]
    lines.append(f"  report exists: {'yes' if rp.exists() else 'no (Stop will require it)'}")
    lines.append("  Read the handoff for scope. This projection is identity only.")


def main():
    try:
        data = json.load(sys.stdin)
    except Exception:
        data = {}
    cwd = data.get("cwd", ".")
    source = data.get("source", "startup")  # startup|resume|clear|compact

    # 1.8.1: default aligned with settings.base.json. The old "docs/wrkops"
    # default contradicted shipped config (F16 note).
    wrkops_dir = os.environ.get(
        "CCOS_WRKOPS_DIR", wrkpaths.DOCS_DIR if _LIB is not None else "_wrkops/docs")
    version_file = os.environ.get("CCOS_VERSION_FILE", "").strip()

    lines = []
    lines.append("=== CCOS SESSION ANCHOR (WRKOPS 1.8.1) ===")
    lines.append(f"session source: {source}")

    # B1/A01: resolve the operative root ONCE. This is both what gets
    # SURFACED as "WORKSPACE ROOT" and what active-task state is READ FROM —
    # the two must never diverge (that divergence was A01's actual defect:
    # this hook used to surface CCOS_WORKSPACE_ROOT here while reading state
    # from the unrelated data["cwd"]).
    if _LIB is not None:
        # B1 corrective (B1_CONSUMER_DISCOVERY_INTEGRATION_OMISSION): cwd is
        # passed only as a DISCOVERY SEED — it can help wrkroot IDENTIFY the
        # workspace when no operator declaration exists at all, but it never
        # overrides or widens an explicit CCOS_WORKSPACE_ROOT declaration,
        # valid or broken (see wrkroot.py for the exact rule).
        root, root_status, root_diag = wrkroot.resolve_workspace_root(discovered=cwd)
    else:
        root, root_status, root_diag = None, "unresolved", [
            "shared library not found; cannot resolve the workspace root."]

    # The active task leads. After /clear this is the first thing the model
    # sees, and 10.3 requires exact restoration without file reads.
    project_active_task(root, lines)

    # boundary laws — restated so they are active even if docs/ is unavailable
    lines.append("BOUNDARY LAWS (absolute, deterministic hooks also enforce):")
    lines.append("  1 PATH_SOVEREIGNTY  no write outside workspace root")
    lines.append("  2 NO_INSTALL        no package installs / downloads")
    lines.append("  3 NO_RUNTIME        no builds/servers/scripts (read-only cmds ok)")
    lines.append("  4 NO_GIT_MUTATE     operator owns all git mutations")
    lines.append("  5 NO_SELF_MODIFY    no edits to CLAUDE.md / _wrkops/docs without order")
    lines.append("  6 NO_STATE_WRITE    only taskctl.py writes active_task.json, the")
    lines.append("                      project ledger, and the CLAUDE.md task block")

    # F024/F026: surface workspace-root resolution before governed work
    # begins — the boundary PATH_SOVEREIGNTY (law 1) actually enforces. Same
    # (root, root_status, root_diag) already used above for state reads.
    project_workspace_root(lines, root, root_status, root_diag)

    # protocol index (STARTUP_PACK.2.01 / WRKOPS.1.03)
    # ITV-B1-03: read from the RESOLVED root (same value active-task state
    # was just read from and "WORKSPACE ROOT:" reports), never from the raw
    # event cwd — a divergent cwd must not surface a protocol index from a
    # different tree than the one the banner declares.
    if root is not None:
        wd = Path(root) / wrkops_dir
        if wd.exists():
            protos = sorted(p.name for p in wd.glob("*.md"))
            lines.append(f"PROTOCOL INDEX ({wrkops_dir}) — read before assuming content:")
            for name in protos:
                lines.append(f"  - {name}")
            if not protos:
                lines.append("  (no protocol docs found — source from operator)")
        else:
            lines.append(f"PROTOCOL DIR MISSING: {wrkops_dir} — operate on boundary laws "
                         "above and stop/report if protocol content is needed.")
    else:
        lines.append("PROTOCOL INDEX UNAVAILABLE — workspace root could not be "
                     "resolved; see WORKSPACE ROOT above. Do not read protocol "
                     "content from any other location.")

    # version state (VERSION_TRACE.3.01)
    # ITV-B1-03: same resolved root, same reasoning as the protocol index.
    if version_file:
        if root is not None:
            vline = read_first_line(Path(root) / version_file)
            if vline:
                lines.append(f"VERSION STATE: {vline}")
        else:
            lines.append("VERSION STATE: UNKNOWN — workspace root could not be resolved.")

    # read-only git state (never mutates). Deliberately NOT part of the B1
    # ITV corrective: this still observes the raw event cwd, which may
    # diverge from the resolved workspace root reported above. Correct Git
    # authority requires PRODUCT_ROOT awareness (deferred to B2) — do not
    # read this line as root-unified.
    branch = git(cwd, "rev-parse", "--abbrev-ref", "HEAD")
    if branch:
        dirty = git(cwd, "status", "--porcelain")
        state = "DIRTY" if dirty else "clean"
        lines.append(f"GIT: branch '{branch}' — {state}")
        if dirty:
            lines.append("  repo is DIRTY — do not set up/commit; confirm scope with operator "
                         "(PATCH.8.02 dirty-diff requires explicit approval).")

    lines.append("Declare MODE (AUDIT/PATCH) and TARGET version before writing. "
                 "Ambiguity stops execution (CLAUDECLI.3.03).")
    lines.append("=========================================")

    sys.stdout.write("\n".join(lines) + "\n")
    sys.exit(0)

if __name__ == "__main__":
    main()
