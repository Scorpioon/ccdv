#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
CCOS WRKOPS 1.8.1 — report-writer (Stop)
=========================================
Forces the execution report to exist, prove its identity, and be complete
before the session can end. The executable core of the traceability protocol:

  CLAUDECLI.3.02       execution report is mandatory
  PATCH_TRACE.2.01     execution report produced after every session
  PATCH_TRACE.2.02     report omits no finding (canonical sections)
  PATCH_TRACE.3.01     smoke checklist closes every report
  CONTRACTS.2.01       report exists and pairs with its handoff

Mechanism (Stop hook):
  exit 2 on Stop FORCES Claude to keep working; exit 0 allows the stop. So a
  missing or invalid report exits 2 with a message naming exactly what to fix.

  This does NOT write the report for Claude — that would defeat the point of
  the report being Claude's own account. It validates that Claude wrote one.

What changed in 1.8.1 and why
-----------------------------
F17/F20/F21 (ONE bug, not three). 1.8.0 line 81:
    f"{report_dir}/EXECUTION_REPORT.md" if slug else ...
  With no active task, slug is None, so the generic fallback path was demanded.
  That path does not exist, so execution reached force() -> exit 2: the hook
  ordered Claude to produce a report for a task that does not exist. F21 (the
  "identity leak", where the model invented a task_id) was never a separate
  defect — it is the only possible response to being ordered to prove an
  identity with no identity source. Remove the fallback and check existence
  first, and all three close together.

F05. 1.8.0 lowercased the whole file and regex-grepped five patterns. It never
  opened report.schema.json. A report with perfect headings and a WRONG task_id
  passed — verified against the live 1.8.0 hook, exit 0. Shape is not truth.

F06. 1.8.0 line 43 regex `boundary\\s+law` matched "Boundary law" and rejected
  "Boundary-law", while the hook's OWN error text at line 126 instructed Claude
  to write "Boundary-law". The hook built the trap and walked Claude into it, on
  loop. Now: exact canonical headings from wrkparse, and the error text quotes
  them character-for-character. There is one string, and both the check and the
  message read from it — a divergence is no longer expressible.

F23 (operator-confirmed CRITICAL). The loop-guard escape must not be silent.
  The escape is CORRECT: without it a report that cannot be written traps the
  session forever. But stderr is not evidence — it scrolls away, and section
  17's "no unresolved CRITICAL finding" gate could be satisfied by a session
  that produced nothing. Keep the escape; make it leave a durable trace in the
  ledger. Never trap forever, never vanish quietly.

Decision A (operator). active_task.json is the sole authority for LOCATION;
  the report proves IDENTITY. This hook cross-references the two. expected_report
  is read from the pointer, never recomputed here.

  exit 0 : allow stop     exit 2 : force continue

Env:
  CCOS_ACTIVE_TASK   active-task pointer (default _wrkops/metadata/active_task.json)
  CCOS_METADATA_DIR  metadata dir (default _wrkops/metadata)
  CCOS_SCHEMAS_DIR   schema dir (default <lib>/../schemas)
  CCOS_REPORT_STRICT "1" (default) requires all sections; "0" warns only
  CCOS_WORKSPACE_ROOT / CLAUDE_PROJECT_DIR  resolved via
                     wrkroot.resolve_workspace_root() (F024/F031) — see
                     wrkroot.py for the full rule.

1.8.2 — B1 (A01)
-----------------
This hook used to treat the Stop event's `data["cwd"]` as if it were the
workspace root: `meta_dir`/`rp` were both derived from it directly, with no
resolution or validation at all. That is exactly the divergence A01 named —
`cwd` is discovery input, never authority, and a report-writer that trusts it
could be pointed at state under a DIFFERENT root than guard_paths.py/
session_genesis.py are enforcing against. Both are now derived from
wrkroot.resolve_workspace_root() instead. When no trustworthy root can be
established, this hook ESCAPES (exit 0 — Stop hooks must never trap the
session) rather than validating a report against an unresolved boundary.

1.8.2 — B1 corrective (B1_CONSUMER_DISCOVERY_INTEGRATION_OMISSION)
--------------------------------------------------------------------
The first B1 pass stopped reading `data["cwd"]` entirely rather than merely
stopping it from being AUTHORITY, so a hermetic run with no
CCOS_WORKSPACE_ROOT/CLAUDE_PROJECT_DIR configured resolved to nothing even
though the Stop event's own cwd correctly identified the workspace. `cwd` is
now passed to wrkroot.resolve_workspace_root() as a discovery SEED — it can
help the resolver IDENTIFY the workspace when no operator declaration exists
at all, but it still never overrides or widens an explicit CCOS_WORKSPACE_ROOT
declaration, valid or broken (see wrkroot.py for the exact rule).
"""
import sys, os, json
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

EXIT_ALLOW, EXIT_FORCE = 0, 2


def force(msg):
    sys.stderr.write("[report-writer] " + msg + "\n")
    sys.exit(EXIT_FORCE)


def escape(reason, metadata_dir=None, schemas_dir=None, finding=None,
           task_id=None, slug=None):
    """Allow the stop, but leave durable evidence first (F23).

    An escape without a trace is how a session ends with nothing and the gate
    still reads clean. If the trace itself cannot be written, say so out loud
    and escape anyway — trapping the session because we could not file the
    paperwork would be a worse failure than the one we are escaping.
    """
    recorded = False
    if finding and _LIB is not None and metadata_dir and schemas_dir:
        try:
            recorded = wrkstate.record_boundary_finding(
                metadata_dir, schemas_dir, finding, task_id, reason, slug)
        except Exception:
            recorded = False

    sys.stderr.write(f"[report-writer] ESCAPE: {reason}\n")
    if finding:
        if recorded:
            sys.stderr.write(
                f"[report-writer] BOUNDARY FINDING {finding} recorded in the "
                f"project ledger. The session is allowed to end, but this is "
                f"unresolved and blocks promotion until the operator closes "
                f"it.\n")
        else:
            sys.stderr.write(
                f"[report-writer] BOUNDARY FINDING {finding} could NOT be "
                f"written to the ledger. Allowing the stop anyway — a session "
                f"must never be trapped because evidence could not be filed. "
                f"THIS FINDING EXISTS AND IS NOW UNRECORDED: the operator must "
                f"note it by hand.\n")
    sys.exit(EXIT_ALLOW)


def _canonical_list():
    """The canonical required sections, quoted exactly (F06).

    The check and the instruction read from the SAME list. That is the whole
    fix: 1.8.0 had a regex and a message that drifted apart, and Claude was
    caught in the gap.
    """
    return "\n".join(f"  {s}" for s in wrkparse.REQUIRED_SECTIONS)


def main():
    try:
        data = json.load(sys.stdin)
    except Exception:
        # Cannot parse Stop input: do not trap the session over our own input
        # handling. Allow, but say so.
        sys.stderr.write(
            "[report-writer] could not parse Stop input; allowing stop\n")
        sys.exit(EXIT_ALLOW)

    stop_active = bool(data.get("stop_hook_active", False))
    strict = os.environ.get("CCOS_REPORT_STRICT", "1") == "1"

    if _LIB is None:
        # No shared parser: we cannot validate. Do not pretend we did, and do
        # not trap. This is the one case where silence would be a lie.
        sys.stderr.write(
            "[report-writer] ESCAPE: shared library not found; cannot validate "
            "the report.\n  " + hookpath.missing_message().replace("\n", "\n  ")
            + "\n  Allowing stop. NO REPORT VALIDATION HAPPENED THIS SESSION.\n")
        sys.exit(EXIT_ALLOW)

    # B1/A01, corrected (B1_CONSUMER_DISCOVERY_INTEGRATION_OMISSION): the
    # workspace root is resolved once, the SAME way every other consumer
    # resolves it. The Stop event's cwd is passed only as a DISCOVERY SEED —
    # wrkroot uses it to help IDENTIFY the workspace when no operator
    # declaration exists at all; it is never treated as authority in its own
    # right, and any explicit CCOS_WORKSPACE_ROOT (valid or declared-broken)
    # still wins or fails closed exactly as before, without ever consulting
    # this seed.
    cwd = data.get("cwd", ".")
    root, root_status, root_diag = wrkroot.resolve_workspace_root(discovered=cwd)
    if root is None:
        sys.stderr.write(
            "[report-writer] ESCAPE: workspace root could not be resolved; "
            "cannot validate the report against an unknown boundary.\n  "
            + "\n  ".join(root_diag)
            + "\n  Allowing stop. NO REPORT VALIDATION HAPPENED THIS SESSION.\n")
        sys.exit(EXIT_ALLOW)

    meta_dir = Path(root) / os.environ.get("CCOS_METADATA_DIR",
                                           wrkpaths.METADATA_DIR)
    schemas_dir = os.environ.get("CCOS_SCHEMAS_DIR", "").strip()
    if not schemas_dir:
        schemas_dir = str(Path(_LIB).parent / "schemas")

    # --- F20/F17: existence of an ACTIVE TASK is the first question ---------
    # No active task means no report is owed. 1.8.0 asked this question last,
    # after it had already derived a path, and demanded a report from a session
    # that had no task to report on.
    try:
        active = wrkstate.load_active(meta_dir, schemas_dir)
    except wrkstate.StateError as e:
        # The pointer is present but corrupt. We cannot know what report is
        # owed, so we cannot demand one — but this is not "no task", and it must
        # not pass silently.
        escape(f"active_task.json is present but unusable: {e}",
               meta_dir, schemas_dir, "REPORT_UNPARSEABLE", None, None)
    except wrkparse.ParseError as e:
        escape(f"cannot load schemas to validate the pointer: {e}",
               meta_dir, schemas_dir, "REPORT_UNPARSEABLE", None, None)

    if active is None:
        # F20: no active task -> no report demanded. Silent, ordinary, correct.
        sys.exit(EXIT_ALLOW)

    task_id = active["task_id"]
    slug = active["slug"]

    # --- Decision A: LOCATION comes from the pointer, never recomputed ------
    # F17: there is no generic fallback. If the pointer does not name a report,
    # the pointer is invalid — and active_task.schema.json already requires
    # expected_report, so this cannot be reached with a schema-valid pointer.
    rp = Path(root) / active["expected_report"]

    # --- loop-guard: never force a report that cannot be written -----------
    rdir = rp.parent
    # is_dir(), not exists(): if the "directory" is actually a FILE, exists() is
    # True and os.access(W_OK) is True — it happily reports on the file — and we
    # would sail past this guard into an infinite force-loop, demanding a report
    # at a path that can never be created. This is exactly the trap F23 exists
    # to prevent, so the guard must ask the question it means to ask.
    dir_ok = rdir.is_dir() and os.access(str(rdir), os.W_OK)
    if not dir_ok and not rdir.exists():
        try:
            rdir.mkdir(parents=True, exist_ok=True)
            dir_ok = rdir.is_dir() and os.access(str(rdir), os.W_OK)
        except Exception:
            dir_ok = False
    if not dir_ok:
        escape(
            f"report directory is unresolvable or unwritable ({rdir}). Cannot "
            f"force a report that cannot be written.",
            meta_dir, schemas_dir, "REPORT_DIR_UNWRITABLE", task_id, slug)

    # --- F23: the escape leaves a trace ------------------------------------
    if stop_active and not rp.exists():
        escape(
            f"report still absent after a forced continuation: "
            f"{active['expected_report']}. Session ended with no execution "
            f"report for task {task_id} ({slug}).",
            meta_dir, schemas_dir, "NO_REPORT_ON_STOP", task_id, slug)

    # 1) Report must exist (CLAUDECLI.3.02 / PATCH_TRACE.2.01)
    if not rp.exists():
        force(
            f"No execution report found for the ACTIVE task.\n"
            f"  task_id: {task_id}\n"
            f"  slug:    {slug}\n"
            f"Write it to EXACTLY this path (from active_task.json):\n"
            f"  {active['expected_report']}\n"
            f"Front matter must carry, at minimum:\n"
            f"  task_id: {task_id}\n"
            f"  slug: {slug}\n"
            f"  state: <IMPLEMENTED|VALIDATED|BLOCKED|FAILED|...>\n"
            f"  version_stamp: <e.g. v1.8.1>\n"
            f"  model: <model name>\n"
            f"  date: <YYYY-MM-DD>\n"
            f"It must contain these sections, copied EXACTLY:\n"
            f"{_canonical_list()}")

    # 2) Report must be readable (11.2 — strict UTF-8, no silent replacement)
    try:
        fields, body = wrkparse.read_document(rp)
    except wrkparse.ParseError as e:
        if stop_active:
            escape(
                f"report exists but cannot be parsed after a forced "
                f"continuation: {e}",
                meta_dir, schemas_dir, "REPORT_UNPARSEABLE", task_id, slug)
        force(
            f"Execution report cannot be parsed:\n  {e}\n"
            f"Report: {active['expected_report']}\n"
            f"The report needs YAML front matter delimited by '---' lines, with "
            f"flat 'key: value' pairs. Fix it and stop again.")

    # 3) F05: identity, not shape. Validate against the schema.
    try:
        schema = wrkparse.load_schema(schemas_dir, "report")
    except wrkparse.ParseError as e:
        escape(f"cannot load report.schema.json: {e}",
               meta_dir, schemas_dir, "REPORT_UNPARSEABLE", task_id, slug)

    errs = wrkparse.validate_against_schema(fields, schema)
    if errs:
        force(
            f"Execution report fails report.schema.json (F05: correct headings "
            f"are not proof of a correct report):\n  - " + "\n  - ".join(errs) +
            f"\nReport: {active['expected_report']}\nFix the front matter and "
            f"stop again.")

    # 4) F21 / Decision A: the report must prove the ACTIVE identity.
    rid = wrkparse.identity_of(fields)
    if rid != (task_id, slug):
        msg = (f"Execution report identity does not match the active task.\n"
               f"  active_task.json: task_id={task_id!r} slug={slug!r}\n"
               f"  report says:      task_id={rid[0]!r} slug={rid[1]!r}\n"
               f"active_task.json is the sole authority (9.1). Correct the "
               f"report's front matter to match it — do NOT invent an identity, "
               f"and do NOT edit active_task.json (only taskctl.py may write "
               f"it).")
        if stop_active:
            escape("report identity does not match the active task after a "
                   f"forced continuation: report={rid}, active=({task_id!r}, "
                   f"{slug!r})",
                   meta_dir, schemas_dir, "IDENTITY_MISMATCH", task_id, slug)
        force(msg)

    # 5) F06: exact canonical sections. One list; check and message share it.
    missing = wrkparse.missing_sections(body)
    if missing and strict:
        force(
            f"Execution report is incomplete. PATCH_TRACE.2.02 requires it to "
            f"omit no finding; 3.01 requires a closing smoke checklist.\n"
            f"Report: {active['expected_report']}\n"
            f"Missing these headings — copy them EXACTLY, character for "
            f"character:\n"
            + "\n".join(f"  {s}" for s in missing) +
            f"\nHeadings are matched exactly, not fuzzily: 'Boundary-law' is "
            f"not 'Boundary law'. Write 'none' under any section with nothing "
            f"to report. Add them and stop again.")
    elif missing:
        sys.stderr.write(
            "[report-writer] WARN incomplete report, sections missing: "
            + ", ".join(missing) + "\n")

    sys.exit(EXIT_ALLOW)


if __name__ == "__main__":
    main()
