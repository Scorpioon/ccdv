#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
CCOS WRKOPS 1.8 — guard_handoff (PreToolUse: Write/Edit)
========================================================
Enforces that a code-changing write is justified by a scoped task (#11/#18).
Before the first Write/Edit, the active-task record must resolve to a handoff
that exists and carries the required identity fields.

  contracts.md §10 — active_task.json is the single source hooks read
  #18 split       — SessionStart SHOWS the active task; this hook ENFORCES it

Guarantee:
  - active_task.json present + valid JSON + required keys
  - the handoff it names exists on disk
  - handoff has task_id + slug matching the active record
Missing/invalid -> exit 2 (fail closed). This is the write-justification gate.

Exempt (never gated by this hook):
  - non-write tools
  - writes INTO the ops folder itself (_wrkops/...) — creating handoffs/reports/
    metadata must not require a pre-existing handoff (chicken/egg)

Env:
  CCOS_OPS_ROOT     ops folder (default _wrkops)
  CCOS_ACTIVE_TASK  active-task pointer (default _wrkops/metadata/active_task.json)
"""
import sys, os, json, re
from pathlib import Path, PurePath

EXIT_ALLOW, EXIT_BLOCK = 0, 2
WRITE_TOOLS = {"Write", "Edit", "MultiEdit", "NotebookEdit"}
REQUIRED_ACTIVE = ("task_id", "slug", "handoff")
TASKID_RE = re.compile(r"^t_[0-9]{8}_[a-z0-9]{4,}$")


def die(reason):
    sys.stderr.write("[guard-handoff BLOCK] " + reason + "\n")
    print(json.dumps({"hookSpecificOutput": {
        "hookEventName": "PreToolUse",
        "permissionDecision": "deny",
        "permissionDecisionReason": reason}}))
    sys.exit(EXIT_BLOCK)


def norm(p):
    return str(PurePath(p)).replace("\\", "/").lower()


def main():
    try:
        data = json.load(sys.stdin)
    except Exception:
        die("could not parse PreToolUse input JSON")
    if not isinstance(data, dict):
        die("PreToolUse input is not a JSON object")

    if data.get("tool_name") not in WRITE_TOOLS:
        sys.exit(EXIT_ALLOW)

    ti = data.get("tool_input", {}) or {}
    target = ti.get("file_path") or ti.get("path") or ti.get("notebook_path") or ""
    cwd = data.get("cwd", ".")

    ops_root = os.environ.get("CCOS_OPS_ROOT", "_wrkops").strip().replace("\\", "/").lower()
    active_rel = os.environ.get("CCOS_ACTIVE_TASK", "_wrkops/metadata/active_task.json")

    # writes into the ops folder itself are exempt (creating the records)
    if target and ("/" + ops_root + "/") in ("/" + norm(target)):
        sys.exit(EXIT_ALLOW)
    if target and norm(target).startswith(ops_root + "/"):
        sys.exit(EXIT_ALLOW)

    # resolve active-task pointer
    ap = Path(active_rel)
    if not ap.is_absolute():
        ap = Path(cwd) / ap
    if not ap.exists():
        die(f"no active task: {active_rel} not found. A write must be justified "
            f"by a scoped task (contracts §10). Declare the active task first.")

    try:
        active = json.loads(ap.read_text(encoding="utf-8"))
    except Exception:
        die(f"active_task.json is not valid JSON: {ap}")

    missing = [k for k in REQUIRED_ACTIVE if not active.get(k)]
    if missing:
        die(f"active_task.json missing required keys: {', '.join(missing)}")

    if not TASKID_RE.match(str(active.get("task_id", ""))):
        die(f"active task_id malformed: {active.get('task_id')!r} "
            f"(want t_YYYYMMDD_xxxx)")

    # the named handoff must exist
    hp = Path(active["handoff"])
    if not hp.is_absolute():
        hp = Path(cwd) / active["handoff"]
    if not hp.exists():
        die(f"active handoff missing on disk: {active['handoff']}")

    # handoff must carry matching task_id + slug (front-matter substring check —
    # deterministic identity match, not a full parse)
    htext = hp.read_text(encoding="utf-8", errors="replace")
    for key in ("task_id", "slug"):
        val = str(active[key]) if key in active else ""
        if val and val not in htext:
            die(f"handoff does not match active {key} '{val}' — identity mismatch "
                f"between active_task.json and {active['handoff']}")

    sys.exit(EXIT_ALLOW)


if __name__ == "__main__":
    main()
