---
name: wrkops-start
description: >-
  Activate a WRKOPS task from a task pack or handoff — validate it, normalize
  it into _wrkops/, write the active-task pointer, update the ledger, and
  project it into CLAUDE.md. Use when the operator wants to begin a scoped task,
  says "start this pack", "activate the handoff", or drops a .wrkpack.zip in the
  inbox. This skill PREPARES and EXPLAINS the command; the OPERATOR runs it,
  because starting a task is a state change and only taskctl.py may write state.
---

# /wrkops-start

Begin a scoped task. Claude does NOT execute the start — it assembles the exact
command and hands it to the operator.

## Why the operator runs it, not Claude

`start` writes `active_task.json`, the ledger, and the `CLAUDE.md` block. Those
are state records, closed to Claude by NO_STATE_WRITE (F22). taskctl.py is the
only writer, and the operator invokes it. This keeps the authority for what task
is active out of the hands of the session doing the work — which is the whole
point of a sole authority.

## What to do

1. Find the source. Ask the operator which pack or handoff, or look in the inbox:
   ```
   $CCOS_PYTHON .claude/lib/taskctl.py status
   ```
   and list `_wrkops/handoffs/_inbox/*.wrkpack.zip` (read-only `ls`/`find` are
   allowed). If more than one pack is present, do NOT pick — `latest` is
   ambiguous and taskctl will refuse it. Name the pack.

2. Assemble the command and give it to the operator to run:
   ```
   $CCOS_PYTHON .claude/lib/taskctl.py start <slug>.wrkpack.zip
   ```
   or for a bare handoff:
   ```
   $CCOS_PYTHON .claude/lib/taskctl.py start path/to/handoff.md
   ```

3. Tell the operator what it will do, in plain terms: validate the pack (archive
   safety, schema, identity), normalize the handoff into `_wrkops/handoffs/`,
   write the pointer, update the ledger, archive the pack, and project the task
   into `CLAUDE.md`. All atomically — it either fully starts or changes nothing.

4. After the operator runs it, confirm with `/wrkops-status`.

## What NOT to do

- Do not run `start` yourself, even if asked — explain that state changes go
  through the operator, and provide the command.
- Do not hand-write `active_task.json` or a `CLAUDE.md` task block as a
  shortcut. That is exactly what F22 forbids.
- Do not resolve an ambiguous `latest`. Name the pack.
- Do not start a task while one is already active. taskctl refuses it; so should
  you.
