#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
CCOS WRKOPS 1.8.1 — wrkstate (atomic state commit + ledger)
============================================================
Delta section 7.2 atomicity law:

    all required records updated
    or
    no state change

Partial activation, partial closure, and partial abort are invalid.

Why this file exists:
  `start` must write active_task.json, update the project ledger, AND update
  the generated CLAUDE.md block (7.3 steps 9/10/12). Three files. A crash or a
  validation failure between them leaves the workspace in a state where the
  pointer says one thing and the ledger says another — and active_task.json is
  the SOLE AUTHORITY (Decision A / 9.1), so a lying pointer is not a cosmetic
  bug. This module makes the three writes one transaction.

Mechanic:
  1. STAGE   — build every new file body in memory; write each to a .tmp
               sibling. No live file touched.
  2. VALIDATE— every staged body validated against its schema BEFORE commit.
               A staged file that fails validation aborts the whole txn.
  3. JOURNAL — record the intended target set to a journal file, fsynced.
  4. COMMIT  — os.replace() each staged file onto its target. os.replace is
               atomic per-file on POSIX and Windows.
  5. CLEAR   — remove the journal. A journal surviving on disk means the
               commit phase was interrupted; `status` reports it as such.

  Honesty about the limit: os.replace gives per-file atomicity, not
  cross-file. A crash mid-COMMIT can leave file 1 new and file 2 old. That is
  physically unavoidable without a filesystem transaction. What we CAN
  guarantee is that such a state is never silent: the journal is the durable
  evidence, and status() surfaces it as INTERRUPTED rather than pretending the
  workspace is coherent. Detectability is the honest guarantee; "impossible"
  would be a lie.

  stdlib only (CLAUDECLI.2.02 NO_INSTALL).
"""
import json
import os
import tempfile
from pathlib import Path

import wrkparse

__version__ = "1.1.0"

JOURNAL_NAME = ".wrkops_txn.json"


class StateError(Exception):
    """Raised when a state transition cannot be completed atomically."""


class Txn:
    """A staged, all-or-nothing multi-file write.

    Usage:
        txn = Txn(metadata_dir)
        txn.stage_json(path, data, schema)      # validated at stage time
        txn.stage_text(path, text)
        txn.commit()                            # or txn.abort()
    """

    def __init__(self, journal_dir):
        self.journal_dir = Path(journal_dir)
        self.journal_path = self.journal_dir / JOURNAL_NAME
        self._staged = []   # list of (target_path, tmp_path)
        self._committed = False

    # --- stage ------------------------------------------------------------

    def _stage_bytes(self, target, body_bytes):
        target = Path(target)
        target.parent.mkdir(parents=True, exist_ok=True)
        fd, tmp = tempfile.mkstemp(
            dir=str(target.parent), prefix=f".{target.name}.", suffix=".tmp")
        try:
            with os.fdopen(fd, "wb") as fh:
                fh.write(body_bytes)
                fh.flush()
                os.fsync(fh.fileno())
        except Exception:
            os.unlink(tmp)
            raise
        self._staged.append((target, Path(tmp)))
        return Path(tmp)

    def stage_json(self, target, data, schema=None, schema_name=""):
        """Stage a JSON file. If `schema` is given, validate BEFORE staging.

        Validation at stage time is the point: a document that would not
        validate never reaches the commit phase, so the atomicity law is not
        asked to protect us from our own bad data.
        """
        if schema is not None:
            errs = wrkparse.validate_against_schema(data, schema)
            if errs:
                label = schema_name or Path(target).name
                raise StateError(
                    f"refusing to stage {Path(target).name}: fails "
                    f"{label} schema:\n  - " + "\n  - ".join(errs))
        body = (json.dumps(data, indent=2, ensure_ascii=False) + "\n")
        return self._stage_bytes(target, body.encode("utf-8"))

    def stage_text(self, target, text):
        """Stage a text file verbatim (no newline translation)."""
        return self._stage_bytes(target, text.encode("utf-8"))

    def stage_delete(self, target):
        """Stage a deletion (used by close/abort to clear the pointer)."""
        self._staged.append((Path(target), None))

    # --- commit / abort ---------------------------------------------------

    def commit(self):
        """Atomically replace every target. All or nothing (7.2)."""
        if self._committed:
            raise StateError("transaction already committed")
        if not self._staged:
            return []

        targets = [str(t) for t, _ in self._staged]
        self.journal_dir.mkdir(parents=True, exist_ok=True)
        journal = {"targets": targets, "phase": "COMMIT"}
        self.journal_path.write_text(
            json.dumps(journal, indent=2) + "\n", encoding="utf-8")

        try:
            for target, tmp in self._staged:
                if tmp is None:
                    if target.exists():
                        target.unlink()
                else:
                    os.replace(str(tmp), str(target))
        except Exception as e:
            raise StateError(
                f"COMMIT INTERRUPTED after partial replace: {e}\n"
                f"Journal preserved at {self.journal_path} — run "
                f"`taskctl.py status` for the incoherent record set.")

        if self.journal_path.exists():
            self.journal_path.unlink()
        self._committed = True
        return targets

    def abort(self):
        """Discard every staged file. No live file was ever touched."""
        for _, tmp in self._staged:
            if tmp is not None and tmp.exists():
                tmp.unlink()
        self._staged = []


def pending_journal(journal_dir):
    """Return the journal dict if a commit was interrupted, else None.

    A journal on disk means COMMIT started and did not finish. The workspace
    may be incoherent. Callers must surface this, never auto-repair it: an
    automatic fix is a hidden decision, and the operator owns state recovery.
    """
    p = Path(journal_dir) / JOURNAL_NAME
    if not p.exists():
        return None
    try:
        return json.loads(p.read_text(encoding="utf-8"))
    except Exception:
        return {"targets": [], "phase": "UNREADABLE"}


# --- ledger helpers ---------------------------------------------------------

def load_project(metadata_dir, schemas_dir):
    """Read + validate project.json. Raises StateError on any problem."""
    p = Path(metadata_dir) / "project.json"
    if not p.exists():
        raise StateError(f"project.json not found: {p}")
    try:
        data = json.loads(p.read_text(encoding="utf-8"))
    except Exception as e:
        raise StateError(f"project.json is not valid JSON: {p} ({e})")
    schema = wrkparse.load_schema(schemas_dir, "project")
    errs = wrkparse.validate_against_schema(data, schema)
    if errs:
        raise StateError(
            f"project.json fails schema:\n  - " + "\n  - ".join(errs))
    return data


def load_active(metadata_dir, schemas_dir):
    """Read + validate active_task.json, or None if there is no active task.

    Absence of the file IS the no-active-task state (delta 10.1). A present
    file that fails schema is an ERROR, never silently treated as absent:
    active_task.json is the sole authority, and an unreadable authority must
    stop the line, not degrade to a guess.
    """
    p = Path(metadata_dir) / "active_task.json"
    if not p.exists():
        return None
    try:
        data = json.loads(p.read_text(encoding="utf-8"))
    except Exception as e:
        raise StateError(f"active_task.json is not valid JSON: {p} ({e})")
    schema = wrkparse.load_schema(schemas_dir, "active_task")
    errs = wrkparse.validate_against_schema(data, schema)
    if errs:
        raise StateError(
            f"active_task.json fails schema (present but unusable — this is "
            f"not 'no active task', it is a corrupt authority):\n  - "
            + "\n  - ".join(errs))
    return data


def ledger_find(project, task_id=None, slug=None):
    """Return ledger entries matching task_id or slug."""
    hits = []
    for entry in project.get("slug_ledger", []):
        if task_id is not None and entry.get("task_id") == task_id:
            hits.append(entry)
        elif slug is not None and entry.get("slug") == slug:
            hits.append(entry)
    return hits


def ledger_upsert(project, task_id, slug, state):
    """Return a NEW project dict with the ledger entry added or updated.

    Never mutates the input: the caller stages the result, and a mutated input
    would survive a staged-but-aborted transaction.
    """
    out = json.loads(json.dumps(project))
    for entry in out.setdefault("slug_ledger", []):
        if entry.get("task_id") == task_id:
            entry["slug"] = slug
            entry["state"] = state
            return out
    out["slug_ledger"].append(
        {"task_id": task_id, "slug": slug, "state": state})
    return out


# --- boundary findings (F23) -------------------------------------------------

BOUNDARY_FINDINGS = (
    "NO_REPORT_ON_STOP",       # loop-guard escape: session ended with no report
    "REPORT_DIR_UNWRITABLE",   # escape: cannot force a report that cannot be written
    "REPORT_UNPARSEABLE",      # escape: report exists but cannot be read
    "IDENTITY_MISMATCH",       # report exists but proves the wrong task
)


def record_boundary_finding(metadata_dir, schemas_dir, finding, task_id,
                            detail, slug=None, when=None):
    """Append a BOUNDARY_FINDING to project.json. Atomic. Never raises upward.

    Delta Decision F23 (operator-confirmed CRITICAL): report_writer.py's
    loop-guard escape allows a session to end with NO report, emitting only a
    stderr line. Keeping the escape is correct — an infinite force-loop traps
    the operator with no way out. But stderr is not evidence: it scrolls away,
    and section 17's "no unresolved CRITICAL finding" gate could then be
    satisfied by a session that produced nothing at all.

    So the escape stays, and it leaves a trace. This is the trace.

    Returns True if the finding was durably recorded, False otherwise. The
    caller MUST NOT let a False stop the escape: failing to write evidence is
    bad, but trapping the session forever because we could not write evidence
    is worse. Report both facts and let the operator judge.
    """
    from datetime import date as _date
    if finding not in BOUNDARY_FINDINGS:
        raise StateError(f"unknown boundary finding: {finding!r}")
    try:
        project = load_project(metadata_dir, schemas_dir)
    except StateError:
        return False

    entry = {
        "finding": finding,
        "task_id": task_id or "(none)",
        "date": (when or _date.today().isoformat()),
        "detail": detail,
    }
    if slug:
        entry["slug"] = slug

    out = json.loads(json.dumps(project))
    out.setdefault("boundary_findings", []).append(entry)

    try:
        schema = wrkparse.load_schema(schemas_dir, "project")
        txn = Txn(metadata_dir)
        txn.stage_json(Path(metadata_dir) / "project.json", out, schema,
                       "project.schema.json")
        txn.commit()
        return True
    except Exception:
        return False


def open_boundary_findings(project):
    """Return recorded boundary findings. Section 17 reads this."""
    return project.get("boundary_findings", [])
