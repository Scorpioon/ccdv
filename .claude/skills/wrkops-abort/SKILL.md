---
name: wrkops-abort
description: >-
  Abort the active WRKOPS task — mark it ABORTED with an explicit reason,
  preserve the handoff and any partial report as evidence, and clear the active
  pointer. Use when a task is blocked, abandoned, or wrong-headed and the
  operator wants out: "abort this", "kill the task", "we're blocked on X". This
  skill assembles the command; the OPERATOR runs it, because it is a state change.
---

# /wrkops-abort

Abandon a task without pretending it finished. Claude assembles the command; the
operator runs it.

## When to reach for this instead of close

`close` is for a task that produced a validated report. `abort` is for a task
that did NOT — blocked on external data, superseded, or simply the wrong
approach. Abort never demands a complete report: a partial report is evidence of
where the work stopped, and requiring a finished one would trap the operator in
the failure they are leaving.

## What to do

1. Get the reason. Abort REQUIRES an explicit reason (7.6) — a task abandoned
   with no recorded why is a gap in the history. If the operator has not given
   one, ask for it in one line.

2. Assemble the command for the operator:
   ```
   $CCOS_PYTHON .claude/lib/taskctl.py abort --reason "blocked on ADG Excel data"
   ```

3. Explain what it does: marks the task `ABORTED` in the ledger, archives the
   pointer (with the reason) to `_wrkops/metadata/closed/`, preserves the
   handoff and any partial report, and resets the `CLAUDE.md` block to
   `NO ACTIVE TASK`. No evidence is deleted; git is untouched.

## What NOT to do

- Do not run `abort` yourself.
- Do not invent a reason to satisfy the requirement — the reason is the
  operator's, and a fabricated one corrupts the history it exists to protect.
- Do not delete the handoff or partial report on the way out. Abort preserves
  them deliberately.
- Do not hand-write `active_task.json`, the ledger, or the `CLAUDE.md` block as
  a shortcut. Those are state records, closed to Claude by NO_STATE_WRITE (F22);
  only taskctl.py writes them.
