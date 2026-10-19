#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
CCOS WRKOPS 1.8.1 — wrkblock (generated CLAUDE.md active-task block)
=====================================================================
Delta section 9. The ONLY writer of the WRKOPS:ACTIVE_TASK block.

  WRKOPS.9.01 (F22)  generated block: only taskctl.py writes it
  WRKOPS.9.04        preserve every byte outside the generated range

Why this file exists (delta F03/F22):
  The marker constants WRKOPS:ACTIVE_TASK:BEGIN/:END appear in NO file in the
  1.8.0 library. Nothing writes, reads, or validates that block. This module
  creates them and is the sole authorised writer. guard_paths.py already blocks
  Claude from editing CLAUDE.md (NO_SELF_MODIFY holds today, per audit); this
  module is invoked by taskctl.py OUT of band, not by Claude.

Design constraints (delta 9.4):
  - require exactly one begin marker and one end marker;
  - derive values ONLY from active_task.json (caller passes the dict; this
    module never opens the pointer itself — single responsibility);
  - preserve every byte outside the generated range;
  - fail if markers are missing, duplicated, or out of order;
  - verify the post-write file;
  - write "NO ACTIVE TASK" when no active pointer exists;
  - never weaken NO_SELF_MODIFY for Claude.

  stdlib only (CLAUDECLI.2.02 NO_INSTALL).
"""
from pathlib import Path

__version__ = "1.1.0"

BEGIN_MARKER = "<!-- WRKOPS:ACTIVE_TASK:BEGIN -->"
END_MARKER = "<!-- WRKOPS:ACTIVE_TASK:END -->"

NO_ACTIVE_TEXT = "NO ACTIVE TASK"

# Field order is fixed by delta 9.2. Do not reorder: the block is read by
# humans and diffed by operators; a stable order makes a real diff meaningful.
_ACTIVE_FIELDS = [
    ("Task ID", "task_id"),
    ("Slug", "slug"),
    ("State", "state"),
    ("Handoff", "handoff"),
    ("Expected report", "expected_report"),
]


class BlockError(Exception):
    """Raised when the generated block cannot be located or written safely."""


def render_block(active=None):
    """Render the full generated block, markers included.

    `active` is an active_task.json dict, or None for the no-active state.
    Returns a string WITHOUT a trailing newline.
    """
    lines = [BEGIN_MARKER]
    if active is None:
        lines.append(NO_ACTIVE_TEXT)
    else:
        for label, key in _ACTIVE_FIELDS:
            val = active.get(key)
            if val in ("", None):
                raise BlockError(
                    f"cannot render active block: active_task.json is missing "
                    f"{key!r} — validate against active_task.schema.json first")
            lines.append(f"{label}: {val}")
        # B3R-A — required reads are activation authority (contract 2.3), so
        # the projection must surface WHERE they landed without the reader
        # having to guess or re-derive the attachment mapping. Absent or
        # empty is the ordinary-pack/bare-handoff case (2.4) and renders
        # nothing extra, preserving the pre-B3R-A block shape exactly.
        required = active.get("required_reads")
        if required:
            lines.append("Required reads:")
            for r in required:
                lines.append(f"  - {r}")
    lines.append(END_MARKER)
    return "\n".join(lines)


def _locate_markers(text, path_label):
    """Return (begin_idx, end_idx) line indices. Raises on any irregularity."""
    lines = text.splitlines()
    begins = [i for i, ln in enumerate(lines) if ln.strip() == BEGIN_MARKER]
    ends = [i for i, ln in enumerate(lines) if ln.strip() == END_MARKER]

    if len(begins) == 0 or len(ends) == 0:
        raise BlockError(
            f"{path_label}: generated block markers not found. Expected exactly "
            f"one {BEGIN_MARKER} and one {END_MARKER}. Add them (empty block is "
            f"fine) — taskctl will fill it.")
    if len(begins) > 1 or len(ends) > 1:
        raise BlockError(
            f"{path_label}: duplicated markers (begin x{len(begins)}, "
            f"end x{len(ends)}) — exactly one of each is required (9.4). "
            f"Refusing to guess which block is authoritative.")
    if begins[0] > ends[0]:
        raise BlockError(
            f"{path_label}: markers out of order — end marker at line "
            f"{ends[0] + 1} precedes begin marker at line {begins[0] + 1}.")
    return begins[0], ends[0]


def read_block(path):
    """Return the current generated block text (markers included)."""
    p = Path(path)
    if not p.exists():
        raise BlockError(f"file not found: {path}")
    try:
        text = p.read_text(encoding="utf-8")
    except UnicodeDecodeError as e:
        raise BlockError(f"file is not valid UTF-8: {path} ({e})")
    b, e = _locate_markers(text, str(path))
    return "\n".join(text.splitlines()[b:e + 1])


def write_block(path, active=None):
    """Replace the generated block in `path` with a block rendered from `active`.

    Every byte outside the marker range is preserved exactly, including the
    file's trailing-newline state and any CRLF line endings outside the block.
    Returns the new block text.

    Raises BlockError without writing if markers are absent, duplicated, or
    out of order. No partial write is possible: the full new text is built and
    verified in memory, then written once.
    """
    p = Path(path)
    if not p.exists():
        raise BlockError(f"file not found: {path}")
    try:
        # newline="" preserves CRLF verbatim. Path.read_text(newline=) is 3.13+,
        # so go through open() — this module must run on whatever Python the
        # operator's CCOS_PYTHON points at.
        with open(p, "r", encoding="utf-8", newline="") as fh:
            original = fh.read()
    except UnicodeDecodeError as e:
        raise BlockError(f"file is not valid UTF-8: {path} ({e})")

    # splitlines(keepends=True) preserves each line's own terminator, so mixed
    # or CRLF endings outside the block survive byte-for-byte.
    keep = original.splitlines(keepends=True)
    b, e = _locate_markers(original, str(path))

    # Line terminator to use inside the block: copy the begin marker's own, so
    # we never convert a CRLF file to LF (delta 13/14 line-ending policy).
    begin_line = keep[b]
    if begin_line.endswith("\r\n"):
        nl = "\r\n"
    elif begin_line.endswith("\n"):
        nl = "\n"
    else:
        nl = ""  # begin marker was the last line with no terminator

    block = render_block(active)
    block_lines = block.split("\n")
    rendered = [ln + nl for ln in block_lines]
    if nl == "":
        rendered = [ln + "\n" for ln in block_lines[:-1]] + [block_lines[-1]]
    else:
        # The end marker keeps whatever terminator the OLD end marker had, so a
        # file that ended without a newline still ends without one.
        old_end = keep[e]
        if not old_end.endswith(("\n", "\r\n")):
            rendered[-1] = block_lines[-1]

    new_text = "".join(keep[:b] + rendered + keep[e + 1:])

    with open(p, "w", encoding="utf-8", newline="") as fh:
        fh.write(new_text)

    # verify the post-write file (9.4) — read it back and confirm the block we
    # intended is the block on disk, and that markers are still well-formed.
    with open(p, "r", encoding="utf-8", newline="") as fh:
        verify = fh.read()
    vb, ve = _locate_markers(verify, str(path))
    got = "\n".join(
        ln.rstrip("\r\n") for ln in verify.splitlines()[vb:ve + 1])
    if got != block:
        raise BlockError(
            f"{path}: post-write verification FAILED — block on disk does not "
            f"match the intended block. File may be corrupt; inspect manually.")

    # outside-the-block byte preservation is a hard law (9.4), so prove it
    # rather than trust it.
    if "".join(keep[:b]) != "".join(verify.splitlines(keepends=True)[:vb]):
        raise BlockError(f"{path}: bytes BEFORE the block changed — aborting.")
    if "".join(keep[e + 1:]) != "".join(
            verify.splitlines(keepends=True)[ve + 1:]):
        raise BlockError(f"{path}: bytes AFTER the block changed — aborting.")

    return block


def ensure_markers(path):
    """Report whether `path` carries a well-formed marker pair.

    Returns True if usable; raises BlockError describing the exact problem
    otherwise. Never writes.
    """
    read_block(path)
    return True
