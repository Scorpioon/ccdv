---
name: wrkops-status
description: Report the current WRKOPS active task — identity, report pairing, ledger state, and whether the task is closeable. Use when the operator asks what task is active, where things stand, whether the report is paired, or why close is refusing. Also use at the start of a session when the active task is unclear.
---

# /wrkops-status

Read-only. Reports the state of the active task from `active_task.json`, the
sole authority (delta 9.1).

## What you may do

Read these files and report what they say:

- `_wrkops/metadata/active_task.json` — the active-task pointer
- `_wrkops/metadata/project.json` — the ledger and any boundary findings
- the report named by `expected_report`, if it exists

You may **read** the metadata dir. You may not **write** it — `guard_paths.py`
blocks that (WRKOPS.9.04 / F22), and it will block you regardless of intent.

## What to report

1. **Identity** — `task_id`, `slug`, `state`, `handoff`, `expected_report`,
   read verbatim from the pointer. Do not paraphrase an identity.
2. **Report existence** — does the file at `expected_report` exist?
3. **Pairing** — if it exists, do its `task_id` and `slug` equal the pointer's?
4. **Sections** — which canonical sections are missing, if any.
5. **Operator validation** — is `operator_validation.validated` true?
6. **Ledger** — what state does the ledger hold for this `task_id`?
7. **Boundary findings** — report every entry in `boundary_findings`. These
   block promotion (section 17) and must never be summarised away.

If `active_task.json` does not exist: **NO ACTIVE TASK**. That is the answer.

If `active_task.json` exists but is malformed: say so plainly. That is **not**
"no active task" — it means the authority is unreadable and the true state is
unknown. Do not guess. Do not read CLAUDE.md or old handoffs to fill the gap;
a stale projection is not evidence.

## Running the tool (safe under NO_STATE_WRITE)

`status` only READS, so unlike start/close/abort this is the one lifecycle
command Claude may run itself — nothing it does changes state. Your file-reading
above is a convenience; the machine-checked answer comes from:

```
$CCOS_PYTHON .claude/lib/taskctl.py status
```

That command validates every record against its schema; you are eyeballing
JSON. If your reading and that output disagree, **the command is right**. Say so
rather than defending your version.

## Boundaries

- Never write `active_task.json`, `project.json`, or the `CLAUDE.md` block.
- Never infer the active task from CLAUDE.md, old handoffs, or git history
  (delta 10.2). The pointer or nothing.
- Never claim operator validation. Only `taskctl.py validate`, run by the
  operator, records that (Decision 5).
