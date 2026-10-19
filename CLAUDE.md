# CLAUDE.md — CCOS Activation Contract (WRKOPS 1.8.2)
# Template v1.8.2 · governed by CLAUDECLI v1.8.1
#
# OPERATOR: fill every [BRACKET] before first session; update ACTIVE TASK SCOPE
# each session. This file is intentionally short. In 1.8.2 the hard guarantees
# are enforced by .claude/hooks + .claude/settings.json, so this file carries
# only (a) the boundary-law fallback, (b) the judgment rules a hook cannot
# check, and (c) the generated active-task block below.
# Keep it under ~200 lines: only what loads every session earns a line here.

---

## BOUNDARY LAWS  (fallback — hooks enforce these deterministically)

If the hook layer is active these are already enforced. They are restated so
they bind even if .claude/ is absent. Do not rely on memory over the hook, or
on the hook over these words — both must agree.

1. PATH_SOVEREIGNTY — no write/move/delete outside WORKSPACE ROOT. Outside
   path needed → stop, report.                    [hook: guard_paths.py]
2. NO_INSTALL — no package installs, fetches, downloads.   [settings deny]
3. NO_RUNTIME — no builds/servers/scripts. Read-only cmds ok. [settings deny]
4. NO_GIT_MUTATE — operator owns all git mutation.  [settings + block_git.py]
5. NO_SELF_MODIFY — no edits to this file or `_wrkops/docs/` without an
   operator instruction naming the file and the change. [hook: guard_paths.py]

---

## ALWAYS-ON JUDGMENT  (no hook can check these — they bind you directly)

- NO_SCOPE_EXPANSION — do only what the scope statement declares. (CLAUDECLI.3.01)
- AMBIGUITY_STOPS — never resolve ambiguity by assumption; stop, report, wait. (3.03)
- OPERATOR_IS_VALIDATOR — you never validate your own work; a build passing is
  not an APPLY verdict. (PATCH.1.03 / 7.02)
- IMPLEMENTED ≠ COMMITTED — the operator commits, never you. (WRKOPS.10.02)
- READ_BEFORE_ASSUME — read the protocol file; don't recall it from memory. (3.05)
- REPORT_IS_HONEST — the execution report omits no finding. (PATCH_TRACE.2.02)

Everything else — the full judgment protocols, audit/recovery procedure, naming
and version canon — is NOT restated here. Read it on demand from `_wrkops/docs/`.

---

## PROJECT IDENTITY

Project:         CCDV
Module:          CCDV Website (greenfield)
Current version: v0.0.0
Workspace root:  C:\Users\TONX\DEVKIT\projects\ccdv\ccdv   ← also set CCOS_WORKSPACE_ROOT in settings
Repo root:       C:\Users\TONX\DEVKIT\projects\ccdv\ccdv

---

## PROTOCOL REFERENCE

Read on demand; do not assume from memory. The authoritative protocol
discovery surface is the PROTOCOL INDEX that the SessionStart hook
(session_genesis.py) injects at the top of every session, alongside
repository state and the version line. That injected index lists the
protocol documents actually deployed for this release — trust it as the
anchor, then read the specific file it names.

The protocol documents themselves are mirrored under `_wrkops/docs/` at
deployment time. Do not hard-code or guess a protocol filename here:
resolve it from the injected PROTOCOL INDEX. If that index is absent or
empty, stop and ask the operator — do not resolve by assumption.

`_wrkops/docs/` is local-only (gitignored) — never staged or committed.

---

## ACTIVE TASK SCOPE   (operator updates every session)

Target version:  v0.0.1
Patch label:     NONE
Scope statement: NO ACTIVE TASK — no implementation authorized until a governed handoff

---

## STOP CONDITIONS

Stop and report immediately if: a required file is missing/mislocated · the
scope is ambiguous about what to touch · an op would reach outside the
workspace root · a file looks like it holds secrets · the task needs an install
or build · a `_wrkops/docs/` file contradicts a boundary law · the repo is not
in the expected state (e.g. mid-merge / dirty). Do not resolve by assumption.

---

## ACTIVE TASK

<!-- WRKOPS:ACTIVE_TASK:BEGIN -->
NO ACTIVE TASK
<!-- WRKOPS:ACTIVE_TASK:END -->

---

## EXECUTION REPORT   (the Stop hook will not let the session end without this)

Write to the `expected_report` path recorded in the ACTIVE TASK block above
(sourced from `_wrkops/metadata/active_task.json`), with:
- Files written or modified (with version stamp applied)
- Files read but not modified
- Findings outside declared scope (or "none")
- Boundary-law checks triggered during the session (or "none")
- Smoke checklist closing the report

The companion LLM expands this for audit — it does not summarize or omit.
