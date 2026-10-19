#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
CCOS WRKOPS 1.8.1 — hookpath (shared library locator for hooks)
================================================================
Decision 4 (operator, 2026-07-18): the shared library deploys to
`.claude/lib/`, hooks deploy to `.claude/hooks/`. This module is the ONE place
that knows how to bridge them.

Why this exists:
  Delta 11.5 requires ONE shared parser for report_writer + check_pairing (and
  now session_genesis). But install copies hooks flat into `.claude/hooks/`
  while `lib/` is a sibling, not a package. Without a locator each hook would
  either (a) re-implement pointer reading — the exact divergence 11.5 forbids,
  and how F05 happened — or (b) carry its own copy-pasted sys.path stanza,
  which is four chances to get it subtly different.

Layouts supported (checked in order):
  1. deployed:   .claude/hooks/hookpath.py  ->  .claude/lib/
  2. repo/dev:   lib/hooks/hookpath.py      ->  lib/
  3. CCOS_LIB_DIR env override (explicit wins over inference)

Usage, at the top of a hook:

    import hookpath; hookpath.bootstrap()
    import wrkstate

Failure policy:
  bootstrap() does NOT raise. It returns the resolved dir or None. A hook that
  cannot find the library must decide its own fate per its event contract:
  SessionStart says so loudly and exits 0 (it cannot block); a PreToolUse guard
  must fail CLOSED. Never let a missing import silently become "no rule applied"
  — a hook that fails open is worse than no hook, because it looks enforced.
"""
import os
import sys
from pathlib import Path

__version__ = "1.0.0"

_MARKER = "wrkparse.py"   # the file that proves we found the real library


def candidates():
    """Yield plausible library dirs, most explicit first."""
    env = os.environ.get("CCOS_LIB_DIR", "").strip()
    if env:
        yield Path(env)
    here = Path(__file__).resolve().parent
    yield here.parent / "lib"      # .claude/hooks -> .claude/lib  (deployed)
    yield here.parent              # lib/hooks     -> lib          (repo/dev)
    yield here                     # flat colocation (tolerated, not preferred)


def find_lib():
    """Return the library dir containing wrkparse.py, or None."""
    for c in candidates():
        try:
            if (c / _MARKER).is_file():
                return c.resolve()
        except OSError:
            continue
    return None


def bootstrap():
    """Put the shared library on sys.path. Returns the dir, or None."""
    d = find_lib()
    if d is None:
        return None
    s = str(d)
    if s not in sys.path:
        sys.path.insert(0, s)
    return d


def missing_message():
    """Operator-facing explanation of where we looked and what to do."""
    looked = "\n".join(f"    - {c}" for c in candidates())
    return (
        "shared library not found (wrkparse.py). Looked in:\n"
        f"{looked}\n"
        "  Install copies lib/*.py -> <project>/.claude/lib/ (Decision 4).\n"
        "  Set CCOS_LIB_DIR to override.")
