---
name: wrkops-close
description: >-
  Close the active WRKOPS task — verify its report exists, matches identity, is
  complete, and has operator validation, then record the terminal state and
  clear the active pointer. Use when the operator says the task is done,
  "close this out", or "wrap up the task". This skill CHECKS readiness and
  assembles the command; the OPERATOR runs it, because closing is a state change.
---

# /wrkops-close

Close a finished task. Claude checks readiness and assembles the command; the
operator runs it.

## Preconditions (all enforced by taskctl — you just surface them)

A task cannot close until its report exists, parses, validates against
`report.schema.json`, matches the active task's ID and slug, carries every
required section, AND the operator has validated it. Close will refuse
otherwise, naming the specific gap.

## What to do

1. Check readiness first, read-only:
   ```
   $CCOS_PYTHON .claude/lib/taskctl.py status
   ```
   Look at `pairing` and `operator_validation`. If `closeable` is not `true`,
   name what is missing:
   - report absent → the work is not reported; it is not closeable (or the
     operator may `/wrkops-abort` with a reason).
   - `PAIRED_INCOMPLETE` → the report is missing sections (Claude can write
     those; the report is Claude's file).
   - `IDENTITY_MISMATCH` → the report proves a different task; fix the report's
     front matter to match the pointer. Do NOT touch the pointer.
   - `operator_validation: NOT_RECORDED` → the operator must validate first:
     ```
     $CCOS_PYTHON .claude/lib/taskctl.py validate
     ```
     The operator validates; Claude never validates its own work (11.3).

2. When `closeable: true`, give the operator the command:
   ```
   $CCOS_PYTHON .claude/lib/taskctl.py close
   ```

3. Explain what it does: records the report's terminal state in the ledger,
   archives the pointer to `_wrkops/metadata/closed/` (evidence is preserved,
   never deleted), and resets the `CLAUDE.md` block to `NO ACTIVE TASK`. Git is
   left untouched — the operator commits.

## What NOT to do

- Do not run `close`, `validate`, or any state change yourself.
- Do not claim the task is validated. Only the operator's `validate` run counts.
- Do not delete the handoff or report. They are the evidence trail.
