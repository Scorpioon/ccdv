#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
CCOS WRKOPS 1.8.1 — taskctl (lifecycle controller)
===================================================
Delta section 7. Steps 2/3/4 of section 18: start, status, atomic ledger +
active-task update, generated CLAUDE.md block.

  WRKOPS.7.02   every state-changing command is atomic (all or nothing)
  WRKOPS.9.04   only taskctl.py writes the generated block
  CONTRACTS.1.02 handoff identity fields are schema-governed

Commands implemented here:
    taskctl.py start <handoff|pack>   (7.3)
    taskctl.py status                 (7.4)
    taskctl.py validate               (7.5.6 — see Decision 5)
    taskctl.py close                  (7.5)
    taskctl.py abort --reason "..."   (7.6)

Decision 5 (operator, 2026-07-18) — operator validation is a COMMAND.
  Delta 7.5.6 requires close to "verify operator-validation state", and 11.3
  says "Claude does not claim operator validation" — but the delta never
  defines where that record LIVES. The candidates were: report front matter
  (state: VALIDATED) or the canonical "## Validation note" section. Both fail
  the same way: Claude writes the report, so Claude would be signing its own
  certificate, and 7.5.6 becomes a check of the session's claim against itself.

  So validation is recorded in active_task.json by `taskctl.py validate`, and
  guard_paths.py blocks Claude from _wrkops/metadata/ entirely (Decision 6,
  F22's authorised-writer half). Claude cannot forge the record because Claude
  cannot write the file. The guarantee is structural, not a request.

  `validate` is a fifth command beyond 7.1's four. Flagged as a deviation.

Pack intake (`<slug>.wrkpack.zip`) landed in step 7 via wrkpack.py. `start`
accepts either a bare handoff .md or a task pack. A pack is INSPECTED in full
(5.5 archive safety) before a single byte is extracted; a pack that fails any
check is rejected whole, never partially unpacked.

Decision A (operator, 2026-07-17): active_task.json is sole authority for
  LOCATION. expected_report is derived ONCE here at start (7.3.7), stored, and
  never recomputed at Stop. report_writer.py reads the stored string.

Exit codes:
    0  success
    2  refused / invalid / would violate a law
    3  interrupted transaction detected (operator must resolve)

  stdlib only (CLAUDECLI.2.02 NO_INSTALL).
"""
import argparse
import json
import os
import re
import sys
from datetime import date
from pathlib import Path, PurePosixPath

_HERE = Path(__file__).resolve().parent
if str(_HERE) not in sys.path:
    sys.path.insert(0, str(_HERE))

import wrkparse
import wrkblock
import wrkstate
import wrkpack
import wrkroot
import wrkpaths

__version__ = "1.4.0"

# States a task may be in at activation. A handoff arriving already
# IMPLEMENTED or COMMITTED is not a new task; refusing it here prevents a
# closed task being resurrected through the start door (F18 family).
STARTABLE_STATES = {"REQUESTED", "SCOPED"}

# Terminal states — a ledger entry in one of these has had its turn. Reusing
# its task_id or slug is rejected by 7.3.6 regardless.
TERMINAL_STATES = {"COMMITTED", "SHIPPED", "ABORTED", "REJECTED",
                   "SUPERSEDED", "CANCELLED", "FAILED"}


def _env(name, default):
    v = os.environ.get(name, "").strip()
    return v if v else default


class Ctx:
    """Resolved workspace layout. All paths derive from env, never hardcoded.

    1.8.2 — B1 (A01): the root used to be `Path(root or CCOS_WORKSPACE_ROOT
    or ".").resolve()` with NO validation at all — any string, including a
    non-existent or relative one, was accepted silently. That was the actual
    A01 divergence for this consumer: not a second F024/F031 implementation,
    but the total absence of one. `root` (taskctl's --root) is now resolved
    through wrkroot.resolve_declared_root(), the SAME classify/fail-closed
    rule CCOS_WORKSPACE_ROOT itself is held to elsewhere. taskctl is an
    out-of-band OPERATOR tool, not a session hook, so — unlike guard_paths.py
    — an unresolved root with no operator intent anywhere (no --root, no
    CCOS_WORKSPACE_ROOT, no CLAUDE_PROJECT_DIR) falls back to cwd, preserving
    this command's historical default ("$CCOS_WORKSPACE_ROOT or cwd"). A
    concrete-but-unusable --root/CCOS_WORKSPACE_ROOT still FAILS CLOSED
    (F031) rather than silently widening to cwd.
    """

    def __init__(self, root=None):
        resolved, status, diag = wrkroot.resolve_declared_root(root)
        if resolved is None:
            if status == "declared_unresolved":
                raise SystemExit(_die(
                    "workspace root cannot be resolved:\n  "
                    + "\n  ".join(diag)))
            # No operator intent anywhere -- historical default is cwd.
            resolved = "."
        self.root = Path(resolved).resolve()
        paths = wrkpaths.Paths(self.root)
        self.ops_root = paths.ops_root
        self.handoff_dir = paths.handoff_dir
        self.report_dir = paths.report_dir
        self.metadata_dir = paths.metadata_dir
        self.inbox_dir = self.handoff_dir / "_inbox"
        self.archive_dir = self.handoff_dir / "_archive"
        self.active_path = self.root / _env(
            "CCOS_ACTIVE_TASK", "_wrkops/metadata/active_task.json")
        self.claude_md = self.root / _env("CCOS_CLAUDE_MD", "CLAUDE.md")
        self.schemas_dir = Path(
            _env("CCOS_SCHEMAS_DIR", str(_HERE.parent / "schemas")))

    def rel(self, p):
        """Path relative to workspace root, forward-slashed.

        Delta 5.3/13 forbid absolute paths in durable records: an absolute path
        is machine-specific and breaks the moment the workspace moves.
        """
        try:
            return Path(p).resolve().relative_to(self.root).as_posix()
        except ValueError:
            raise SystemExit(
                _die(f"path escapes workspace root: {p}\n"
                     f"  root: {self.root}\n"
                     f"  PATH_SOVEREIGNTY forbids recording it."))


def _die(msg, code=2):
    sys.stderr.write(f"taskctl: REFUSED — {msg}\n")
    return code


def _ok(msg):
    sys.stdout.write(msg + "\n")


def derive_expected_report(ctx, slug):
    """7.3.7 — derive the expected report path from CCOS_REPORT_DIR + slug.

    Derived exactly once, here, then stored in active_task.json. Nothing
    downstream recomputes it (Decision A).
    """
    return (ctx.report_dir / f"{slug}.report.md")


def attachment_root(ctx, slug):
    """Directory a task's attachments materialize into. Never outside it."""
    return ctx.handoff_dir / f"{slug}.attachments"


def _attachment_target(ctx, slug, att):
    """Workspace path an attachment member materializes to at activation.

    B3R-A (2.2.1): the SAME mapping is used to (a) stage the attachment's
    bytes and (b) compute the workspace-relative path recorded for a
    required_reads entry, so the path active_task.json records is always the
    path something was actually written to — never a second, independently
    derived guess.

    B3R-B1 (§3): taskctl no longer OWNS that mapping, it consumes it.
    The prefix arithmetic that used to live here was a second, weaker copy of
    wrkpack's derivation: it stripped `attachments/` textually and handed the
    remainder to pathlib, so `attachments//a.md` became `/a.md` — absolute,
    outside the attachment root — and was caught only because ctx.rel() and
    wrkpack._resolve_within() happened to be downstream (ITV-B3RA-01 / D14).
    Defence-in-depth is not a licence for a helper to emit an unsafe path.
    Derivation is now wrkpack.attachment_relative_target()'s job, and this
    function proves containment on the result rather than assuming it.

    Raises wrkpack.PackError for any member that cannot yield a safe,
    contained target. Callers must fail closed on it.
    """
    rel = wrkpack.attachment_relative_target(att)
    return wrkpack._resolve_within(attachment_root(ctx, slug), rel)


# --- durable path reader containment (B3R-B1 §6) ----------------------------
#
# active_task.json is the sole authority for LOCATION (Decision A), and its
# schema proves SHAPE — a non-empty string — not CONTAINMENT. `"/etc/passwd"`
# and `"../../../../etc/passwd"` are both valid strings, and `ctx.root / p`
# with an absolute p discards the root entirely. Every reader that stat'ed a
# durable path was therefore one hand-edit away from being an out-of-workspace
# existence oracle (ITV-B3RA-02), and B3R-A widened that surface from two fixed
# fields to a caller-listed array.
#
# So containment is re-proven on READ, at the same standard as on write, and
# the name-shape half runs first — it is pure string work, so a tampered path
# is refused before anything touches the filesystem. There is no "we already
# validated it at start" exemption: the file is on disk between those two
# moments, which is the entire threat.

class DurablePathError(Exception):
    """A durable workspace-relative path failed reader-side containment."""


def _contained_path(ctx, field, value):
    """Prove `value` is a contained workspace-relative path; return it resolved.

    Raises DurablePathError. Reuses wrkpack.check_member_name() rather than
    re-deriving the shape law: absolute, drive-qualified, UNC/rooted, '..'
    traversal, empty and NUL-bearing paths are the same hostile shapes there
    and here, and one implementation is the only way they stay the same.
    """
    if not isinstance(value, str):
        raise DurablePathError(
            f"{field} is not a string: {value!r}")

    reason = wrkpack.check_member_name(value)
    if reason:
        raise DurablePathError(
            f"{field} is not a safe workspace-relative path: {reason}")
    if not wrkpack._segments(value):
        raise DurablePathError(
            f"{field} names no path at all: {value!r}")

    # Only now touch the filesystem. resolve() also collapses any symlink that
    # points out of the workspace, which relative_to() then refuses.
    target = (ctx.root / PurePosixPath(value.replace("\\", "/"))).resolve()
    try:
        target.relative_to(ctx.root)
    except ValueError:
        raise DurablePathError(
            f"{field} resolves OUTSIDE the workspace root: {value!r}\n"
            f"      root:   {ctx.root}\n"
            f"      target: {target}")
    return target


def durable_path_problems(ctx, active):
    """Re-prove every durable path in the pointer. Returns a list of problems.

    Empty list means every path a reader may dereference is contained. The
    minimum set is the contract's (§6): handoff, expected_report, and every
    required_reads entry.
    """
    problems = []
    for field in ("handoff", "expected_report"):
        try:
            _contained_path(ctx, field, active.get(field))
        except DurablePathError as e:
            problems.append(str(e))

    rr = active.get("required_reads")
    if rr is not None:
        if not isinstance(rr, list):
            problems.append(f"required_reads is not a list: {rr!r}")
        else:
            for i, r in enumerate(rr):
                try:
                    _contained_path(ctx, f"required_reads[{i}]", r)
                except DurablePathError as e:
                    problems.append(str(e))
    return problems


def _die_durable(problems):
    """Refuse a command whose durable paths are not workspace-contained."""
    return _die(
        "durable task state names paths outside the workspace (B3R-B1 6):\n"
        "  - " + "\n  - ".join(problems) + "\n"
        "  active_task.json is the sole authority for LOCATION, so a tampered\n"
        "  or malformed path is a corrupt authority, not a path to follow.\n"
        "  Refusing to dereference it. No state change was made (7.2).")


# --- start ------------------------------------------------------------------

def cmd_start(ctx, args):
    pack = None
    manifest = None

    # 7.3.1/7.3.3 resolve the selection. "latest" is only meaningful against
    # the inbox, and only when it is unambiguous (5.5).
    if args.source in ("latest", "-"):
        try:
            pack = wrkpack.resolve_inbox(ctx.inbox_dir, args.source)
        except wrkpack.PackError as e:
            return _die(str(e))
        src = pack
    else:
        src = Path(args.source)
        if not src.exists():
            cand = ctx.inbox_dir / args.source
            if cand.exists():
                src = cand
            else:
                return _die(f"source not found: {args.source}")
        if not src.is_file():
            return _die(f"not a file: {src}")
        if src.name.endswith(wrkpack.PACK_SUFFIX):
            pack = src

    if pack is None and src.suffix.lower() == ".zip":
        return _die(
            f"not a task pack: {src.name!r} — canonical extension is "
            f"<slug>{wrkpack.PACK_SUFFIX} (5.1)")

    # 7.3.2 validate schema and archive safety.
    if pack is not None:
        # Full 5.5 inspection BEFORE anything touches disk. A pack that fails
        # here is rejected whole; nothing was extracted, so there is nothing to
        # roll back.
        try:
            manifest = wrkpack.inspect(pack)
            htext = wrkpack.read_member(pack, manifest["handoff"]).decode("utf-8")
            fields, _body = wrkparse.parse_front_matter(htext)
        except wrkpack.PackError as e:
            return _die(f"pack rejected (5.5):\n  {e}")
        except (wrkparse.ParseError, UnicodeDecodeError) as e:
            return _die(f"pack handoff unusable: {e}")
        handoff_text = htext
    else:
        try:
            fields, _body = wrkparse.read_document(src)
        except wrkparse.ParseError as e:
            return _die(f"handoff is unparseable: {e}")
        with open(src, "r", encoding="utf-8", newline="") as _fh:
            handoff_text = _fh.read()

    try:
        schema = wrkparse.load_schema(ctx.schemas_dir, "handoff")
    except wrkparse.ParseError as e:
        return _die(str(e))

    errs = wrkparse.validate_against_schema(fields, schema)
    if errs:
        return _die("handoff fails handoff.schema.json:\n  - "
                    + "\n  - ".join(errs))

    task_id, slug = wrkparse.identity_of(fields)
    state = fields.get("state")

    # 7.3.5 validate state is one a task may START in
    if state not in STARTABLE_STATES:
        return _die(
            f"handoff state is {state!r} — a task may only start in "
            f"{sorted(STARTABLE_STATES)}.\n"
            f"  A handoff already past SCOPED describes work that has begun or\n"
            f"  ended; starting it would resurrect or double-run it.")

    # interrupted-transaction gate FIRST: an unresolved partial commit is a
    # deeper problem than a busy state, and may be the very reason a task looks
    # active. Never write state on top of it, and diagnose it before anything
    # else so the operator sees the real cause.
    pend = wrkstate.pending_journal(ctx.metadata_dir)
    if pend:
        return _die(
            f"an earlier transaction was INTERRUPTED mid-commit.\n"
            f"  Journal: {ctx.metadata_dir / wrkstate.JOURNAL_NAME}\n"
            f"  Targets: {pend.get('targets')}\n"
            f"  Run `taskctl.py status` and resolve manually before starting.\n"
            f"  Auto-repair is not offered: the operator owns state recovery.", 3)

    # 7.3.4 reject a second active task
    try:
        active = wrkstate.load_active(ctx.metadata_dir, ctx.schemas_dir)
    except wrkstate.StateError as e:
        return _die(str(e))
    if active is not None:
        return _die(
            f"a task is already active: {active['task_id']} "
            f"({active['slug']}).\n"
            f"  Close or abort it first (7.3.4). Two active tasks means the\n"
            f"  sole authority is no longer sole.")

    # 7.3.10 load ledger
    try:
        project = wrkstate.load_project(ctx.metadata_dir, ctx.schemas_dir)
    except wrkstate.StateError as e:
        return _die(str(e))

    # 7.3.6 reject reused task ID or slug
    if wrkstate.ledger_find(project, task_id=task_id):
        return _die(f"task_id {task_id!r} already exists in the ledger (7.3.6)")
    if wrkstate.ledger_find(project, slug=slug):
        return _die(f"slug {slug!r} already exists in the ledger (7.3.6)")

    # 7.3.8 normalize the handoff into _wrkops/handoffs/
    dest = ctx.handoff_dir / f"{slug}.md"
    already_home = (pack is None and src.resolve() == dest.resolve())

    # 7.3.7 derive expected report
    expected = derive_expected_report(ctx, slug)

    # B3R-A (2.2) — required_reads materialization mapping. Pure path
    # derivation, no I/O, so it can run before the atomic commit and the
    # final workspace-relative paths can be baked into active_new below —
    # never recomputed afterward, same discipline as expected_report
    # (Decision A). Absent for bare handoffs and ordinary packs (2.4).
    #
    # B3R-B1: derivation can now REFUSE (the seam is self-defensive), and a
    # refusal here must not become a traceback. inspect() has already proven
    # every required read safe, unique by target, and free of alias
    # collisions, so this is the last line of a defence in depth — but the
    # last line still has to hold.
    required_reads_rel = []
    if pack is not None and manifest.get("required_reads"):
        try:
            for rr in manifest["required_reads"]:
                required_reads_rel.append(
                    ctx.rel(_attachment_target(ctx, slug, rr)))
        except wrkpack.PackError as e:
            return _die(f"required_read target derivation refused:\n  {e}\n"
                        f"  No state change was made (7.2).")

    # 7.3.12 generated block must be writable BEFORE we commit anything —
    # a start that lands the pointer but cannot project it is a partial
    # activation (7.2).
    if ctx.claude_md.exists():
        try:
            wrkblock.ensure_markers(ctx.claude_md)
        except wrkblock.BlockError as e:
            return _die(f"CLAUDE.md generated block unusable:\n  {e}\n"
                        f"  Refusing to activate: 7.2 forbids partial activation.")
    else:
        return _die(f"CLAUDE.md not found at {ctx.claude_md} — the generated "
                    f"block is a required record (7.3.12).")

    active_new = {
        "task_id": task_id,
        "slug": slug,
        "handoff": ctx.rel(dest),
        "expected_report": ctx.rel(expected),
        "state": state,
    }
    if required_reads_rel:
        active_new["required_reads"] = required_reads_rel
    project_new = wrkstate.ledger_upsert(project, task_id, slug, state)

    # --- atomic commit (7.2) -------------------------------------------
    # Everything a successful start must produce is staged first and committed
    # in one pass: the normalized handoff, any attachments, the pointer, the
    # ledger, and (for packs) the archived original. A failure anywhere leaves
    # the workspace exactly as it was.
    txn = wrkstate.Txn(ctx.metadata_dir)
    try:
        if not already_home:
            txn.stage_text(dest, handoff_text)

        # attachments travel with the task, under the slug, never at top level.
        # required_reads is always a subset of attachments (B3R-A 2.1.1), so
        # every required read is staged here too, in the SAME transaction as
        # the pointer/ledger/handoff — there is no separate materialization
        # step and therefore no window where the pointer could commit ahead
        # of the bytes it names (2.2.2/2.2.4).
        #
        # B3R-B1 (§3): one seam, one containment proof. The staging loop used
        # to re-strip the `attachments/` prefix itself and run a second
        # _resolve_within() over its own copy of the arithmetic — two
        # derivations for one file, which is how two names quietly become one
        # target. _attachment_target() now derives and contains in one place,
        # and PackError from it aborts the transaction below.
        if pack is not None and manifest.get("attachments"):
            for att in manifest["attachments"]:
                data = wrkpack.read_member(pack, att)
                target = _attachment_target(ctx, slug, att)
                txn._stage_bytes(target, data)

        txn.stage_json(ctx.active_path, active_new,
                       wrkparse.load_schema(ctx.schemas_dir, "active_task"),
                       "active_task.schema.json")
        txn.stage_json(ctx.metadata_dir / "project.json", project_new,
                       wrkparse.load_schema(ctx.schemas_dir, "project"),
                       "project.schema.json")

        # 7.3.11 move the original pack into _archive/. Staged as a copy so the
        # transaction stays all-or-nothing; the original is unlinked only after
        # the commit succeeds.
        archived = None
        if pack is not None:
            archived = ctx.archive_dir / pack.name
            if archived.exists():
                txn.abort()
                return _die(
                    f"archive already holds {pack.name!r} — refusing to "
                    f"overwrite evidence (7.6: never delete evidence)")
            txn._stage_bytes(archived, pack.read_bytes())

        txn.commit()
    except (wrkstate.StateError, wrkparse.ParseError, wrkpack.PackError) as e:
        txn.abort()
        return _die(f"{e}\n  No state change was made (7.2).")

    # The pack is archived and committed; only now is it safe to remove the
    # original. Ordering matters: a crash here leaves a copy in _archive/ AND
    # the original in _inbox/, which is redundant but never lossy.
    if pack is not None and archived is not None and archived.exists():
        try:
            if pack.resolve() != archived.resolve():
                pack.unlink()
        except OSError as e:
            sys.stderr.write(
                f"taskctl: pack archived to {ctx.rel(archived)} but the "
                f"original could not be removed ({e}). Harmless duplicate; "
                f"delete {pack} by hand.\n")

    # The generated block is written AFTER the pointer commits, because it is a
    # PROJECTION of the pointer (9.1) — it must never lead. If this fails, the
    # pointer is authoritative and `status` will show the block as STALE.
    try:
        wrkblock.write_block(ctx.claude_md, active_new)
    except wrkblock.BlockError as e:
        sys.stderr.write(
            f"taskctl: pointer committed but block projection FAILED: {e}\n"
            f"  active_task.json is authoritative and correct.\n"
            f"  Re-run `taskctl.py status` after fixing CLAUDE.md markers.\n")
        return 2

    # 7.3.13 compact machine-readable status
    result = {
        "result": "STARTED",
        "task_id": task_id,
        "slug": slug,
        "state": state,
        "handoff": active_new["handoff"],
        "expected_report": active_new["expected_report"],
    }
    if pack is not None:
        result["source_pack"] = pack.name
        result["archived_to"] = ctx.rel(archived)
        if manifest.get("attachments"):
            result["attachments"] = len(manifest["attachments"])
        if required_reads_rel:
            result["required_reads"] = required_reads_rel
    _ok(json.dumps(result, indent=2))
    return 0


# --- validate ---------------------------------------------------------------

def cmd_validate(ctx, args):
    """Record operator validation of the active task's report (Decision 5).

    Only the operator runs this. Claude cannot: guard_paths.py blocks all
    writes to the metadata dir, and taskctl is invoked out of band.

    We deliberately DO check the report before accepting validation. Not to
    second-guess the operator — the operator may validate a report Claude got
    wrong, that is their prerogative — but because validating a report that
    does not exist, or that proves a different task, is almost certainly a
    mistake rather than a decision. --force exists for when it is not.
    """
    try:
        active = wrkstate.load_active(ctx.metadata_dir, ctx.schemas_dir)
    except wrkstate.StateError as e:
        return _die(str(e))
    if active is None:
        return _die("no active task to validate (10.1)")

    pend = wrkstate.pending_journal(ctx.metadata_dir)
    if pend:
        return _die(
            f"an earlier transaction was INTERRUPTED mid-commit.\n"
            f"  Journal: {ctx.metadata_dir / wrkstate.JOURNAL_NAME}\n"
            f"  Resolve manually before validating.", 3)

    # B3R-B1 (§6) — before the report path is dereferenced below, re-prove it
    # is inside the workspace. Recording validation against a file outside the
    # root would certify evidence this workspace does not own.
    bad = durable_path_problems(ctx, active)
    if bad:
        return _die_durable(bad)

    rp = ctx.root / active["expected_report"]
    problems = []
    if not rp.exists():
        problems.append(f"report does not exist: {active['expected_report']}")
    else:
        try:
            fields, body = wrkparse.read_document(rp)
            errs = wrkparse.validate_against_schema(
                fields, wrkparse.load_schema(ctx.schemas_dir, "report"))
            if errs:
                problems.append("report fails schema: " + "; ".join(errs))
            rid = wrkparse.identity_of(fields)
            if rid != (active["task_id"], active["slug"]):
                problems.append(
                    f"report identity {rid} does not match active task "
                    f"({active['task_id']!r}, {active['slug']!r})")
            miss = wrkparse.missing_sections(body)
            if miss:
                problems.append("report missing sections: " + ", ".join(miss))
        except wrkparse.ParseError as e:
            problems.append(f"report unparseable: {e}")

    if problems and not args.force:
        return _die(
            "refusing to record validation:\n  - " + "\n  - ".join(problems) +
            "\n  Validating a report with these problems is more likely a "
            "slip than a decision.\n  If you mean it, re-run with --force; the "
            "note will record that you did.")

    entry = {"validated": True, "date": date.today().isoformat()}
    if args.note:
        entry["note"] = args.note
    if problems and args.force:
        entry["note"] = ((args.note + " | ") if args.note else "") + \
            "FORCED despite: " + "; ".join(problems)

    new = json.loads(json.dumps(active))
    new["operator_validation"] = entry

    txn = wrkstate.Txn(ctx.metadata_dir)
    try:
        txn.stage_json(ctx.active_path, new,
                       wrkparse.load_schema(ctx.schemas_dir, "active_task"),
                       "active_task.schema.json")
        txn.commit()
    except (wrkstate.StateError, wrkparse.ParseError) as e:
        txn.abort()
        return _die(f"{e}\n  No state change was made (7.2).")

    _ok(json.dumps({"result": "VALIDATED", "task_id": active["task_id"],
                    "slug": active["slug"], "date": entry["date"],
                    "forced": bool(problems and args.force)}, indent=2))
    return 0


# --- close ------------------------------------------------------------------

def cmd_close(ctx, args):
    """7.5 — close the active task. Atomic; evidence preserved."""
    try:
        active = wrkstate.load_active(ctx.metadata_dir, ctx.schemas_dir)
    except wrkstate.StateError as e:
        return _die(str(e))
    if active is None:
        return _die("no active task to close (10.1)")

    pend = wrkstate.pending_journal(ctx.metadata_dir)
    if pend:
        return _die(
            f"an earlier transaction was INTERRUPTED mid-commit.\n"
            f"  Journal: {ctx.metadata_dir / wrkstate.JOURNAL_NAME}\n"
            f"  Resolve manually before closing.", 3)

    # B3R-B1 (§6) — a close reads the report and then writes terminal state.
    # Both halves are wrong if the pointer names a file outside the workspace:
    # the evidence would not be ours, and the ledger would record a task
    # closed on it. Fail closed before the first stat, and before any mutation.
    bad = durable_path_problems(ctx, active)
    if bad:
        return _die_durable(bad)

    task_id, slug = active["task_id"], active["slug"]
    rp = ctx.root / active["expected_report"]

    # 7.5.1 report exists
    if not rp.exists():
        return _die(
            f"7.5.1 — no report at {active['expected_report']}. A task closes "
            f"on evidence, not on assertion.\n  Use `abort --reason` if the "
            f"task ended without one.")

    # 7.5.2 schema
    try:
        fields, body = wrkparse.read_document(rp)
    except wrkparse.ParseError as e:
        return _die(f"7.5.2 — report unparseable: {e}")
    errs = wrkparse.validate_against_schema(
        fields, wrkparse.load_schema(ctx.schemas_dir, "report"))
    if errs:
        return _die("7.5.2 — report fails report.schema.json:\n  - "
                    + "\n  - ".join(errs))

    # 7.5.3/7.5.4 identity equality
    rid = wrkparse.identity_of(fields)
    if rid[0] != task_id:
        return _die(f"7.5.3 — task ID mismatch: report says {rid[0]!r}, "
                    f"active task is {task_id!r}")
    if rid[1] != slug:
        return _die(f"7.5.4 — slug mismatch: report says {rid[1]!r}, "
                    f"active task is {slug!r}")

    # 7.5.5 required sections
    miss = wrkparse.missing_sections(body)
    if miss:
        return _die("7.5.5 — report is missing required sections:\n  "
                    + "\n  ".join(miss))

    # 7.5.6 operator validation
    ov = active.get("operator_validation") or {}
    if not ov.get("validated"):
        return _die(
            "7.5.6 — this task has no operator validation.\n"
            "  The operator validates; Claude does not (11.3). Run:\n"
            "    taskctl.py validate\n"
            "  then close.")

    # 7.5.7 terminal state — from the report, which is Claude's account of what
    # happened, constrained by the report schema's enum.
    terminal = fields.get("state")

    project = wrkstate.load_project(ctx.metadata_dir, ctx.schemas_dir)
    project_new = wrkstate.ledger_upsert(project, task_id, slug, terminal)

    # 7.5.8/7.5.10 — archive the pointer, never delete it. "Clear or archive"
    # (7.5.8) permits deletion; we archive. A closed task's pointer is the only
    # record of what expected_report and operator_validation said at close, and
    # 7.5.10 requires evidence preservation. Deleting it would satisfy the
    # letter and lose the audit trail.
    closed_dir = ctx.metadata_dir / "closed"
    archived_ptr = closed_dir / f"{task_id}.active_task.json"
    ptr_archive = json.loads(json.dumps(active))
    ptr_archive["state"] = terminal
    ptr_archive["closed_date"] = date.today().isoformat()

    txn = wrkstate.Txn(ctx.metadata_dir)
    try:
        txn._stage_bytes(
            archived_ptr,
            (json.dumps(ptr_archive, indent=2, ensure_ascii=False) + "\n")
            .encode("utf-8"))
        txn.stage_json(ctx.metadata_dir / "project.json", project_new,
                       wrkparse.load_schema(ctx.schemas_dir, "project"),
                       "project.schema.json")
        txn.stage_delete(ctx.active_path)
        txn.commit()
    except (wrkstate.StateError, wrkparse.ParseError) as e:
        txn.abort()
        return _die(f"{e}\n  No state change was made (7.2).")

    # 7.5.9 generated block -> NO ACTIVE TASK
    block_note = None
    try:
        wrkblock.write_block(ctx.claude_md, None)
    except wrkblock.BlockError as e:
        block_note = str(e)
        sys.stderr.write(
            f"taskctl: task closed but the CLAUDE.md block could not be "
            f"updated: {e}\n  The pointer is gone, so the block is STALE. "
            f"Fix the markers and run `taskctl.py status`.\n")

    out = {"result": "CLOSED", "task_id": task_id, "slug": slug,
           "state": terminal,
           "handoff": active["handoff"],
           "report": active["expected_report"],
           "pointer_archived_to": ctx.rel(archived_ptr),
           "evidence": "handoff and report preserved (7.5.10)",
           "git": "untouched — operator owns commits (7.5.11)"}
    if block_note:
        out["warning"] = f"CLAUDE.md block not updated: {block_note}"
    _ok(json.dumps(out, indent=2))
    return 0


# --- abort ------------------------------------------------------------------

def cmd_abort(ctx, args):
    """7.6 — abort the active task. Reason required; evidence preserved."""
    reason = (args.reason or "").strip()
    if not reason:
        return _die("7.6 — abort requires an explicit reason: "
                    "taskctl.py abort --reason \"...\"")

    try:
        active = wrkstate.load_active(ctx.metadata_dir, ctx.schemas_dir)
    except wrkstate.StateError as e:
        return _die(str(e))
    if active is None:
        return _die("no active task to abort (10.1)")

    pend = wrkstate.pending_journal(ctx.metadata_dir)
    if pend:
        return _die(
            f"an earlier transaction was INTERRUPTED mid-commit.\n"
            f"  Journal: {ctx.metadata_dir / wrkstate.JOURNAL_NAME}\n"
            f"  Resolve manually before aborting.", 3)

    task_id, slug = active["task_id"], active["slug"]

    # 7.6 — abort takes NO position on the report. A partial report is evidence
    # of where the work stopped, and demanding a complete one before allowing
    # an abort would trap the operator in the failure they are trying to leave.
    #
    # B3R-B1 (§6): the same reasoning decides what an uncontained path does
    # here. close and validate REFUSE, because both act on the report's
    # content. Abort acts on nothing but the pointer, and a corrupt pointer is
    # the likeliest reason an operator is aborting at all — refusing would
    # trap them in exactly the failure 7.6 exists to release. So the path is
    # never dereferenced, and the fact that it could not be is reported.
    bad = durable_path_problems(ctx, active)
    if bad:
        report_state = "UNVERIFIABLE"
    else:
        rp = ctx.root / active["expected_report"]
        report_state = "present" if rp.exists() else "absent"

    project = wrkstate.load_project(ctx.metadata_dir, ctx.schemas_dir)
    project_new = wrkstate.ledger_upsert(project, task_id, slug, "ABORTED")

    closed_dir = ctx.metadata_dir / "closed"
    archived_ptr = closed_dir / f"{task_id}.active_task.json"
    ptr_archive = json.loads(json.dumps(active))
    ptr_archive["state"] = "ABORTED"
    ptr_archive["aborted_date"] = date.today().isoformat()
    ptr_archive["abort_reason"] = reason

    txn = wrkstate.Txn(ctx.metadata_dir)
    try:
        txn._stage_bytes(
            archived_ptr,
            (json.dumps(ptr_archive, indent=2, ensure_ascii=False) + "\n")
            .encode("utf-8"))
        txn.stage_json(ctx.metadata_dir / "project.json", project_new,
                       wrkparse.load_schema(ctx.schemas_dir, "project"),
                       "project.schema.json")
        txn.stage_delete(ctx.active_path)
        txn.commit()
    except (wrkstate.StateError, wrkparse.ParseError) as e:
        txn.abort()
        return _die(f"{e}\n  No state change was made (7.2).")

    block_note = None
    try:
        wrkblock.write_block(ctx.claude_md, None)
    except wrkblock.BlockError as e:
        block_note = str(e)
        sys.stderr.write(
            f"taskctl: task aborted but the CLAUDE.md block could not be "
            f"updated: {e}\n")

    out = {"result": "ABORTED", "task_id": task_id, "slug": slug,
           "reason": reason,
           "handoff": active["handoff"],
           "report": report_state,
           "pointer_archived_to": ctx.rel(archived_ptr),
           "evidence": "handoff and partial report preserved (7.6)",
           "git": "untouched — operator owns commits (7.6)"}
    if bad:
        out["durable_path_errors"] = bad
        out["note"] = ("durable paths were not workspace-contained and were "
                       "NOT dereferenced (B3R-B1 6); the archived pointer "
                       "preserves them verbatim as evidence")
    if block_note:
        out["warning"] = f"CLAUDE.md block not updated: {block_note}"
    _ok(json.dumps(out, indent=2))
    return 0


# --- status -----------------------------------------------------------------

def cmd_status(ctx, args):
    out = {}

    pend = wrkstate.pending_journal(ctx.metadata_dir)
    if pend:
        out["transaction"] = {
            "state": "INTERRUPTED",
            "targets": pend.get("targets", []),
            "note": "a commit did not finish; records may be incoherent. "
                    "Resolve manually — taskctl will not auto-repair.",
        }

    try:
        active = wrkstate.load_active(ctx.metadata_dir, ctx.schemas_dir)
    except wrkstate.StateError as e:
        out["active"] = None
        out["active_error"] = str(e)
        _ok(json.dumps(out, indent=2))
        return 2

    if active is None:
        out["active"] = None
        out["message"] = "NO ACTIVE TASK"
    else:
        # B3R-B1 (§6) — status is the reader that dereferences the most durable
        # paths, so it is the one a tampered pointer turns into an
        # out-of-workspace existence oracle (ITV-B3RA-02). Re-prove containment
        # BEFORE the first .exists(), and fail closed the same way a corrupt
        # pointer already does: an authority that cannot be trusted is an
        # error, never a quietly-answered question.
        bad = durable_path_problems(ctx, active)
        if bad:
            out["active"] = None
            out["active_error"] = (
                "active_task.json names paths outside the workspace (present "
                "but unusable — this is not 'no active task', it is a corrupt "
                "authority):\n  - " + "\n  - ".join(bad))
            out["durable_path_errors"] = bad
            _ok(json.dumps(out, indent=2))
            return 2

        handoff_p = ctx.root / active["handoff"]
        report_p = ctx.root / active["expected_report"]
        out["active"] = {
            "task_id": active["task_id"],
            "slug": active["slug"],
            "state": active["state"],
            "handoff": active["handoff"],
            "expected_report": active["expected_report"],
        }
        out["handoff_exists"] = handoff_p.exists()
        out["report_exists"] = report_p.exists()

        # B3R-A (2.3) — required reads are activation authority; status must
        # expose per-path existence and an aggregate coherence state without
        # the caller having to re-derive anything. Omitted entirely when no
        # required_reads were declared (2.4 backward compatibility) — absence
        # of the key, not an empty/true placeholder, is the "not applicable"
        # signal. A path deleted after activation shows up here as missing,
        # never silently treated as available (2.3 closing sentence).
        required = active.get("required_reads") or []
        if required:
            rr_out = []
            for r in required:
                rr_out.append({"path": r, "exists": (ctx.root / r).exists()})
            out["required_reads"] = rr_out
            out["required_reads_coherent"] = all(e["exists"] for e in rr_out)

        # pairing state — identity equality, per CONTRACTS.2.01
        pairing = "NO_REPORT"
        if report_p.exists():
            try:
                rf, rbody = wrkparse.read_document(report_p)
                rid = wrkparse.identity_of(rf)
                if rid == (active["task_id"], active["slug"]):
                    miss = wrkparse.missing_sections(rbody)
                    pairing = "PAIRED" if not miss else "PAIRED_INCOMPLETE"
                    if miss:
                        out["missing_sections"] = miss
                else:
                    pairing = "IDENTITY_MISMATCH"
                    out["report_identity"] = list(rid)
            except wrkparse.ParseError as e:
                pairing = "REPORT_UNPARSEABLE"
                out["report_error"] = str(e)
        out["pairing"] = pairing

        # operator-validation state (Decision 5). The record lives in
        # active_task.json, which Claude cannot write; a "## Validation note"
        # in the report is NOT validation, because Claude writes the report.
        ov = active.get("operator_validation") or {}
        out["operator_validation"] = (
            "VALIDATED" if ov.get("validated") else "NOT_RECORDED")
        if ov.get("date"):
            out["validated_date"] = ov["date"]
        if ov.get("note"):
            out["validation_note"] = ov["note"]
        out["closeable"] = bool(ov.get("validated")) and pairing == "PAIRED"

    # ledger state
    try:
        project = wrkstate.load_project(ctx.metadata_dir, ctx.schemas_dir)
        if active is not None:
            hits = wrkstate.ledger_find(project, task_id=active["task_id"])
            out["ledger_state"] = hits[0]["state"] if hits else "ABSENT"
            if hits and hits[0]["state"] != active["state"]:
                out["ledger_divergence"] = (
                    f"ledger says {hits[0]['state']}, pointer says "
                    f"{active['state']} — pointer is authority (9.1)")
        out["ledger_entries"] = len(project.get("slug_ledger", []))
        bf = wrkstate.open_boundary_findings(project)
        if bf:
            out["boundary_findings"] = bf
            out["promotion_blocked"] = (
                f"{len(bf)} unresolved boundary finding(s) — section 17 "
                f"requires no unresolved CRITICAL finding")
    except wrkstate.StateError as e:
        out["ledger_error"] = str(e)

    # generated block state — projection must match the authority
    try:
        current = wrkblock.read_block(ctx.claude_md)
        expected_block = wrkblock.render_block(active)
        out["generated_block"] = (
            "IN_SYNC" if current.replace("\r", "") == expected_block
            else "STALE")
    except wrkblock.BlockError as e:
        out["generated_block"] = "UNUSABLE"
        out["generated_block_error"] = str(e)

    # git — observation only (7.4), never mutation
    out["git"] = _git_observe(ctx.root)

    _ok(json.dumps(out, indent=2))
    return 0


def _git_observe(root):
    import subprocess
    def g(*a):
        try:
            r = subprocess.run(["git", *a], cwd=str(root), capture_output=True,
                               text=True, timeout=5)
            return r.stdout.strip()
        except Exception:
            return ""
    branch = g("rev-parse", "--abbrev-ref", "HEAD")
    if not branch:
        return {"available": False}
    return {
        "available": True,
        "branch": branch,
        "dirty": bool(g("status", "--porcelain")),
        "note": "observation only — operator owns all git mutation",
    }


# --- entry ------------------------------------------------------------------

def main(argv=None):
    ap = argparse.ArgumentParser(
        prog="taskctl.py",
        description="WRKOPS 1.8.1 lifecycle controller (start/status).")
    ap.add_argument("--root", default=None,
                    help="workspace root (default: $CCOS_WORKSPACE_ROOT or cwd)")
    sub = ap.add_subparsers(dest="cmd", required=True)

    p_start = sub.add_parser("start", help="activate a task from a handoff")
    p_start.add_argument(
        "source",
        help="path to a handoff .md, a <slug>.wrkpack.zip, an inbox "
             "filename, or 'latest' (refused if ambiguous)")

    sub.add_parser("status", help="report active task + record coherence")

    p_val = sub.add_parser(
        "validate", help="record OPERATOR validation of the report (7.5.6)")
    p_val.add_argument("--note", default=None, help="optional note")
    p_val.add_argument("--force", action="store_true",
                       help="validate despite report problems (recorded)")

    sub.add_parser("close", help="close the active task (7.5)")

    p_ab = sub.add_parser("abort", help="abort the active task (7.6)")
    p_ab.add_argument("--reason", required=True,
                      help="explicit reason (required by 7.6)")

    args = ap.parse_args(argv)
    ctx = Ctx(args.root)

    if args.cmd == "start":
        return cmd_start(ctx, args)
    if args.cmd == "status":
        return cmd_status(ctx, args)
    if args.cmd == "validate":
        return cmd_validate(ctx, args)
    if args.cmd == "close":
        return cmd_close(ctx, args)
    if args.cmd == "abort":
        return cmd_abort(ctx, args)
    return 2


if __name__ == "__main__":
    sys.exit(main())
