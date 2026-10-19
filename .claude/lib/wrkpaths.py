#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
CCOS WRKOPS 1.8.2 — wrkpaths (structural operational path source)
=====================================================================
B1 (A05 / path-constant portion of A04): the five root-sensitive consumers
each redefined the same handful of "_wrkops/..." structural paths
independently. guard_paths.py, session_genesis.py and report_writer.py each
had their own `os.environ.get("CCOS_METADATA_DIR", "_wrkops/metadata")` line;
taskctl.py had its own set for metadata/handoffs/reports/ops-root; and
check_pairing.py had none of the above — it simply hardcoded
"_wrkops/metadata/project.json", "_wrkops/handoffs" and "_wrkops/reports" as
string literals, with no env override at all. Five independent places that
had to agree, and one of them (guard_paths.py's SELF_MODIFY_GLOBS) had
drifted: it protected the STALE "docs/wrkops/*" shape instead of the
"_wrkops/docs" shape settings.base.json actually ships (A04's path-constant
finding). This module is the ONE place these defaults and env-var names live.

This module defines PATHS, not deployment policy: it does not decide what a
project's structural layout should become in some future release. It only
names where B1's five consumers currently agree WRKOPS operational state
lives, so they stop disagreeing by construction. No global registry, no
migration, no generalized RootContext.

Env var names carried over UNCHANGED from the pre-B1 consumers (none
renamed, so existing settings.json / operator env configuration keeps
working without edits):
  CCOS_OPS_ROOT       ops root dir              (default: _wrkops)
  CCOS_METADATA_DIR   state records dir         (default: _wrkops/metadata)
  CCOS_HANDOFF_DIR    handoffs dir              (default: _wrkops/handoffs)
  CCOS_REPORT_DIR     reports dir               (default: _wrkops/reports)
  CCOS_WRKOPS_DIR     protocol/docs dir         (default: _wrkops/docs)
"""
import os
from pathlib import Path

__version__ = "1.0.0"

OPS_ROOT = "_wrkops"
METADATA_DIR = "_wrkops/metadata"
HANDOFF_DIR = "_wrkops/handoffs"
REPORT_DIR = "_wrkops/reports"
DOCS_DIR = "_wrkops/docs"


def _env(env, name, default):
    e = os.environ if env is None else env
    v = e.get(name, "")
    v = v.strip() if isinstance(v, str) else v
    return v if v else default


class Paths:
    """Resolved structural WRKOPS paths under one workspace root.

    Every path a B1 consumer needs is derived from env exactly once, here —
    the ONE definition the five consumers now share (A05 / A04 path-constant
    portion). Consumers that need additional non-structural paths (taskctl's
    CCOS_ACTIVE_TASK pointer file, CCOS_CLAUDE_MD, CCOS_SCHEMAS_DIR) keep
    reading those themselves — this module covers only the four B1-relevant
    structural directories.
    """

    def __init__(self, root, env=None):
        self.root = Path(root)
        self.ops_root = self.root / _env(env, "CCOS_OPS_ROOT", OPS_ROOT)
        self.metadata_dir = self.root / _env(env, "CCOS_METADATA_DIR", METADATA_DIR)
        self.handoff_dir = self.root / _env(env, "CCOS_HANDOFF_DIR", HANDOFF_DIR)
        self.report_dir = self.root / _env(env, "CCOS_REPORT_DIR", REPORT_DIR)
        self.docs_dir = self.root / _env(env, "CCOS_WRKOPS_DIR", DOCS_DIR)

    @property
    def project_json(self):
        return self.metadata_dir / "project.json"

    @property
    def active_task_json(self):
        return self.metadata_dir / "active_task.json"
