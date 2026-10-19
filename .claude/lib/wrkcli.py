#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
CCOS WRKOPS 1.8.2 — wrkcli (stable entrypoint, deterministic output, no-pyc)
============================================================================
B8. The boring front door.

    an explicit argument vector
  + an explicitly supplied manifest path, when a command needs one
  ------------------------------------------------------------------
  = one deterministic, byte-comparable answer and one stable exit code

Why this module exists
----------------------
Routine WRKOPS operations were being reconstructed as ad-hoc one-off Python
invocations, once per occasion, each one carrying its own assumptions about
where the archive is, which interpreter is running, and what "the manifest"
means. Every reconstruction is a chance to get one of those wrong. This module
is the one invocation surface those operations are supposed to have: three
read-only commands, one output contract, one exit-code vocabulary.

It is deliberately NOT a CLI framework. There is no plugin registry, no
command discovery, no configuration file, and no dependency beyond the standard
library plus this archive's own sibling modules. Three commands are three
commands.

What this module will not do
----------------------------
It does not deploy. `self-check` imports the B7 apply engine to prove that it
IMPORTS, and there is no code path here that calls preflight, apply or
rollback; there is no code path here that creates, writes, moves, renames or
deletes anything anywhere. The only bytes this module emits go to the caller's
own output streams.

Nothing is inferred
-------------------
The current working directory is not consulted, and neither is the process
environment. A command that needs a manifest is handed an ABSOLUTE manifest
path and uses it verbatim; a relative one is refused rather than resolved,
because resolving it would silently make the directory a process happens to be
standing in into filesystem authority — the exact failure wrkroot's F024/F031
rules exist to prevent, and the exact reason B6 refuses to infer a deployment
root. There is no default manifest path (`MANIFEST_DEFAULT is None`), and
CCOS_WORKSPACE_ROOT / CLAUDE_PROJECT_DIR are never read here at all.

Bytecode hygiene (F-0006)
-------------------------
Importing a WRKOPS module writes `__pycache__/<name>.cpython-XX.pyc` beside it
unless the interpreter is told not to. Under a deployed `.claude/lib/`, that
turns a read-only operation into a tree-mutating one and leaves artefacts no
manifest projection declares. So the LAUNCHER path turns bytecode off before
any sibling module is imported: `main()` calls `enable_no_bytecode()` first,
and every product import in this module is lazy, performed inside the command
that needs it — never at module import time. The two operator-side spellings of
the same request are `PYTHONDONTWRITEBYTECODE=1` and `python -B`; either one
makes the flag true before this module is even loaded, and `self-check` reports
which state it actually observed rather than assuming one.

Importing this module as a LIBRARY changes no interpreter state: a library that
silently flips a global flag on import is a library that surprises its host. A
library caller that wants the launcher's hygiene calls `enable_no_bytecode()`
itself, or invokes `main()`.

Nothing here deletes a cache. `bytecode_paths()` reports what it finds and
`inventory()` excludes it; removing an artefact is an operator decision, and a
hygiene helper that could also delete is a hygiene helper that tidies away
evidence.

Output contract
---------------
Machine mode (`--json`): one JSON object, UTF-8 without BOM, LF only, two-space
indent, sorted keys, exactly one final LF, stable key names, no ANSI colour, no
timestamp unless the caller passed `--stamp`. The same rendering rule B5, B6
and B7 already use, so every artefact this archive emits is byte-comparable by
one rule.

Human mode (the default): `key: value` lines in a frozen order, LF only, ASCII
only, no ANSI colour, no platform-localised wording. A test can compare the
lines.

Errors are structured in machine mode and one short stable line in human mode,
they are written to the error stream rather than the output stream, and they
always carry a non-zero exit code.

Dependency law: standard library only, plus this archive's sibling modules.
CLAUDECLI.2.02 NO_INSTALL forbids pip dependencies in shipped code. Argument
parsing is hand-rolled rather than delegated to `argparse` for one reason: the
frozen error contract above (a named error code, a structured machine error, a
stable human line, and an exit code this module chooses) is not something
`argparse` can be configured to produce — it prints its own prose, on its own
stream, and exits on its own terms.
"""
import json
import os
import re
import sys
from dataclasses import dataclass
from pathlib import Path
from typing import Optional, Tuple

_HERE = Path(__file__).resolve().parent
if str(_HERE) not in sys.path:
    sys.path.insert(0, str(_HERE))

__version__ = "1.0.0"

__all__ = [
    "CliError",
    "Invocation",
    "Result",
    "TOOL_NAME",
    "PROG",
    "CMD_VERSION",
    "CMD_MANIFEST_SUMMARY",
    "CMD_SELF_CHECK",
    "CMD_HELP",
    "COMMANDS",
    "COMMAND_HELP",
    "COMMAND_OPTIONS",
    "GLOBAL_OPTIONS",
    "VALUE_OPTIONS",
    "MODE_HUMAN",
    "MODE_JSON",
    "MODES",
    "EXIT_OK",
    "EXIT_INTERNAL",
    "EXIT_USAGE",
    "EXIT_INPUT",
    "EXIT_CHECK_FAILED",
    "EXIT_CODES",
    "EXIT_CODE_NAMES",
    "ERR_MISSING_COMMAND",
    "ERR_UNKNOWN_COMMAND",
    "ERR_UNEXPECTED_ARGUMENT",
    "ERR_UNKNOWN_OPTION",
    "ERR_OPTION_NOT_SUPPORTED",
    "ERR_OPTION_REQUIRES_VALUE",
    "ERR_OPTION_REPEATED",
    "ERR_MODE_CONFLICT",
    "ERR_MANIFEST_REQUIRED",
    "ERR_MANIFEST_BLANK",
    "ERR_MANIFEST_PLACEHOLDER",
    "ERR_MANIFEST_NOT_ABSOLUTE",
    "ERR_MANIFEST_UNREADABLE",
    "ERR_MANIFEST_MALFORMED",
    "ERR_STAMP_INVALID",
    "ERR_MODULE_IMPORT",
    "ERR_INTERNAL",
    "ERRORS",
    "USAGE_ERRORS",
    "CHECK_PASS",
    "CHECK_FAIL",
    "CHECK_SKIPPED",
    "CHECK_STATUSES",
    "CHECK_IDS",
    "MANIFEST_DEFAULT",
    "ENV_INPUTS",
    "IGNORED_ENV_KEYS",
    "SELF_CHECK_MODULES",
    "REQUIRED_MODULES",
    "KNOWN_PROJECTION_IDS",
    "CACHE_DIR_NAMES",
    "BYTECODE_SUFFIXES",
    "EQUIVALENT_ENV_SPELLING",
    "EQUIVALENT_FLAG_SPELLING",
    "USAGE_LINES",
    "enable_no_bytecode",
    "bytecode_hygiene",
    "is_bytecode_path",
    "ignore_bytecode",
    "inventory",
    "bytecode_paths",
    "is_absolute_path",
    "render_json",
    "render_human",
    "parse_args",
    "dispatch",
    "run",
    "emit",
    "main",
]

# --- frozen vocabulary ------------------------------------------------------

TOOL_NAME = "wrkcli"
PROG = "wrkcli.py"

CMD_VERSION = "version"
CMD_MANIFEST_SUMMARY = "manifest-summary"
CMD_SELF_CHECK = "self-check"

# `help` is reachable only through -h/--help; it is not a command name a caller
# may type, and it is deliberately absent from COMMANDS so the frozen command
# set stays exactly the three supported operations.
CMD_HELP = "help"

COMMANDS = (CMD_MANIFEST_SUMMARY, CMD_SELF_CHECK, CMD_VERSION)

COMMAND_HELP = {
    CMD_MANIFEST_SUMMARY: "summarise an explicitly supplied deployment "
                          "manifest",
    CMD_SELF_CHECK: "read-only self-check of this CLI and its product modules",
    CMD_VERSION: "report the tool version and the supported command names",
}

# Options each command accepts, beyond GLOBAL_OPTIONS. An option offered to a
# command that has no use for it is a usage error rather than a silent no-op: a
# caller who passes --manifest to `version` believes something is being read.
COMMAND_OPTIONS = {
    CMD_MANIFEST_SUMMARY: ("manifest",),
    CMD_SELF_CHECK: ("manifest",),
    CMD_VERSION: (),
}

GLOBAL_OPTIONS = ("stamp",)
VALUE_OPTIONS = ("manifest", "stamp")

MODE_HUMAN = "human"
MODE_JSON = "json"
MODES = (MODE_HUMAN, MODE_JSON)

# Exit-code semantics. Frozen: a caller scripts against these numbers.
EXIT_OK = 0             # the command ran and reported a passing result
EXIT_INTERNAL = 1       # an unexpected fault inside this tool
EXIT_USAGE = 2          # the invocation itself was wrong
EXIT_INPUT = 3          # well-formed invocation, unusable caller-supplied input
EXIT_CHECK_FAILED = 4   # the command ran fully and reported a NEGATIVE result
EXIT_CODES = (EXIT_OK, EXIT_INTERNAL, EXIT_USAGE, EXIT_INPUT,
              EXIT_CHECK_FAILED)
EXIT_CODE_NAMES = {
    "ok": EXIT_OK,
    "internal_error": EXIT_INTERNAL,
    "usage_error": EXIT_USAGE,
    "input_error": EXIT_INPUT,
    "check_failed": EXIT_CHECK_FAILED,
}

# Error vocabulary. Every refusal path names exactly one of these; nothing is
# reported as free prose alone.
ERR_MISSING_COMMAND = "missing_command"
ERR_UNKNOWN_COMMAND = "unknown_command"
ERR_UNEXPECTED_ARGUMENT = "unexpected_argument"
ERR_UNKNOWN_OPTION = "unknown_option"
ERR_OPTION_NOT_SUPPORTED = "option_not_supported_by_command"
ERR_OPTION_REQUIRES_VALUE = "option_requires_value"
ERR_OPTION_REPEATED = "option_repeated"
ERR_MODE_CONFLICT = "output_mode_conflict"
ERR_MANIFEST_REQUIRED = "manifest_path_required"
ERR_MANIFEST_BLANK = "manifest_path_blank"
ERR_MANIFEST_PLACEHOLDER = "manifest_path_placeholder"
ERR_MANIFEST_NOT_ABSOLUTE = "manifest_path_not_absolute"
ERR_MANIFEST_UNREADABLE = "manifest_unreadable"
ERR_MANIFEST_MALFORMED = "manifest_malformed"
ERR_STAMP_INVALID = "stamp_not_a_single_line"
ERR_MODULE_IMPORT = "product_module_import_failed"
ERR_INTERNAL = "internal_error"

ERRORS = (
    ERR_INTERNAL,
    ERR_MANIFEST_BLANK,
    ERR_MANIFEST_MALFORMED,
    ERR_MANIFEST_NOT_ABSOLUTE,
    ERR_MANIFEST_PLACEHOLDER,
    ERR_MANIFEST_REQUIRED,
    ERR_MANIFEST_UNREADABLE,
    ERR_MISSING_COMMAND,
    ERR_MODE_CONFLICT,
    ERR_MODULE_IMPORT,
    ERR_OPTION_NOT_SUPPORTED,
    ERR_OPTION_REPEATED,
    ERR_OPTION_REQUIRES_VALUE,
    ERR_STAMP_INVALID,
    ERR_UNEXPECTED_ARGUMENT,
    ERR_UNKNOWN_COMMAND,
    ERR_UNKNOWN_OPTION,
)

# Errors about the INVOCATION rather than about an input. These, and only
# these, carry EXIT_USAGE and append the one-line usage hint.
USAGE_ERRORS = (
    ERR_MANIFEST_BLANK,
    ERR_MANIFEST_NOT_ABSOLUTE,
    ERR_MANIFEST_PLACEHOLDER,
    ERR_MANIFEST_REQUIRED,
    ERR_MISSING_COMMAND,
    ERR_MODE_CONFLICT,
    ERR_OPTION_NOT_SUPPORTED,
    ERR_OPTION_REPEATED,
    ERR_OPTION_REQUIRES_VALUE,
    ERR_STAMP_INVALID,
    ERR_UNEXPECTED_ARGUMENT,
    ERR_UNKNOWN_COMMAND,
    ERR_UNKNOWN_OPTION,
)

CHECK_PASS = "pass"
CHECK_FAIL = "fail"
CHECK_SKIPPED = "skipped"
CHECK_STATUSES = (CHECK_FAIL, CHECK_PASS, CHECK_SKIPPED)

# The self-check's frozen check list, in the order it reports them.
CHECK_IDS = (
    "product_modules_import",
    "cli_surface_frozen",
    "manifest_parses",
    "cwd_not_authority",
    "env_not_authority",
    "bytecode_hygiene",
)

# There is no default manifest path, and this constant exists so that absence
# is ASSERTABLE rather than merely true. A default would have to come from
# somewhere, and every candidate source (the working directory, the process
# environment, this module's own location) is an inference.
MANIFEST_DEFAULT = None

# Environment variables any supported command reads as input: none.
ENV_INPUTS = ()

# Named explicitly so the claim is checkable rather than implied: these are
# consulted by the hooks and by the lifecycle controller, and they are NOT
# authority here. This module reads no environment variable at all.
IGNORED_ENV_KEYS = ("CCOS_WORKSPACE_ROOT", "CLAUDE_PROJECT_DIR")

# Product modules `self-check` proves importable. Importability is the whole
# assertion: a syntax error or a broken sibling import in any of these breaks
# every WRKOPS operation, and it is cheap to find out here instead of during a
# deployment.
SELF_CHECK_MODULES = (
    "wrkdeployapply",
    "wrkdeployplan",
    "wrkparse",
    "wrkpaths",
    "wrkroot",
    "wrksettings",
)

# Modules a supported command actually calls into.
REQUIRED_MODULES = ("wrkdeployplan",)

# The B5/B6/B7/B8 projections `manifest-summary` reports the presence of. A
# manifest that has lost one of these has lost a batch's product surface, and
# noticing that is worth one deterministic boolean each.
KNOWN_PROJECTION_IDS = (
    "b5.lib.wrksettings",
    "b5.schema.settings",
    "b5.test.test_wrksettings",
    "b6.lib.wrkdeployplan",
    "b6.test.test_wrkdeployplan",
    "b7.lib.wrkdeployapply",
    "b7.test.test_wrkdeployapply",
    "b8.lib.wrkcli",
    "b8.test.test_wrkcli",
)

# --- bytecode / cache vocabulary --------------------------------------------
# Narrow on purpose. These are Python's own bytecode artefacts and nothing
# else: a helper that quietly also excluded `.pytest_cache`, `.mypy_cache` or
# `node_modules` would be inventing inventory policy under the name of
# bytecode hygiene.
CACHE_DIR_NAMES = ("__pycache__",)
BYTECODE_SUFFIXES = (".pyc", ".pyo")

EQUIVALENT_ENV_SPELLING = "PYTHONDONTWRITEBYTECODE=1"
EQUIVALENT_FLAG_SPELLING = "-B"

USAGE_LINES = (
    "usage: " + PROG + " <command> [options]",
    "",
    "commands:",
    "  manifest-summary --manifest PATH   summarise a deployment manifest",
    "  self-check [--manifest PATH]       read-only self-check",
    "  version                            tool version and command names",
    "",
    "options:",
    "  --json              machine-readable JSON output",
    "  --human             human-readable output (default)",
    "  --manifest PATH     ABSOLUTE path to a deployment manifest; used",
    "                      verbatim, never resolved against anything",
    "  --stamp VALUE       caller-supplied single-line stamp, emitted verbatim",
    "  -h, --help          print this usage",
    "",
    "exit codes:",
    "  0 ok  1 internal_error  2 usage_error  3 input_error  4 check_failed",
)

# Drive-qualified absolute path (C:\..., K:/...). The same rule wrksettings
# holds a resolved env value to, so one archive judges one path shape the same
# way on every platform instead of asking the host what "absolute" means.
_DRIVE_ABS_RE = re.compile(r"^[A-Za-z]:[\\/]")

# Any $VAR / ${VAR} / %VAR% token left in a value that was supposed to be a
# real path. The same rule B7 holds a deployment root to: a placeholder is a
# declaration that something else must supply the real path, never a path.
_PLACEHOLDER_RE = re.compile(r"\$\{?[A-Za-z_][A-Za-z0-9_]*\}?"
                             r"|%[A-Za-z_][A-Za-z0-9_]*%")

# Set true by enable_no_bytecode(), so `self-check` can distinguish "the
# launcher turned bytecode off" from "the interpreter already had it off".
_HYGIENE_ENABLED = False


class CliError(Exception):
    """One named, structured refusal.

    Carries the frozen error code, the exit code it maps to, and a single-line
    detail — never a bare message. Fail-closed: every rejection path raises
    one of these, and nothing returns a partially computed result.
    """

    def __init__(self, code, detail, exit_code=None, command=None):
        super().__init__(detail)
        self.code = code
        self.detail = detail
        self.exit_code = exit_code if exit_code is not None else (
            EXIT_USAGE if code in USAGE_ERRORS else EXIT_INPUT)
        self.command = command


# --- bytecode hygiene -------------------------------------------------------

def enable_no_bytecode():
    """Turn interpreter bytecode writing off. Returns the resulting state.

    Called by `main()` BEFORE any product module is imported, which is the
    whole point: `sys.dont_write_bytecode` is consulted at import time, so
    setting it afterwards would leave every already-imported sibling's `.pyc`
    already written. Importing this module does NOT call this — see the module
    docstring on why a library may not flip a global flag behind its host.

    Idempotent, and it never removes an existing cache: this makes future
    imports quiet, it does not tidy away the past.
    """
    global _HYGIENE_ENABLED
    sys.dont_write_bytecode = True
    _HYGIENE_ENABLED = True
    return bool(sys.dont_write_bytecode)


def bytecode_hygiene():
    """The observed bytecode state, as a JSON-safe dict.

    Reports what IS, not what was intended: `dont_write_bytecode` may be true
    because `enable_no_bytecode()` set it, because the caller passed `-B`, or
    because `PYTHONDONTWRITEBYTECODE` was set in the launching environment —
    `hygiene_enabled_by_launcher` distinguishes the first case from the other
    two. Carries no filesystem path, so a command's output stays a function of
    its arguments and the interpreter's own flags.
    """
    prefix = getattr(sys, "pycache_prefix", None)
    return {
        "bytecode_suffixes": list(BYTECODE_SUFFIXES),
        "cache_dir_names": list(CACHE_DIR_NAMES),
        "dont_write_bytecode": bool(sys.dont_write_bytecode),
        "equivalent_env_spelling": EQUIVALENT_ENV_SPELLING,
        "equivalent_flag_spelling": EQUIVALENT_FLAG_SPELLING,
        "hygiene_enabled_by_launcher": bool(_HYGIENE_ENABLED),
        "pycache_prefix_set": prefix is not None,
    }


def is_bytecode_path(path):
    """True if `path` is a Python bytecode file or lies inside a cache dir.

    Purely lexical — no filesystem is consulted, so the same path classifies
    identically on any machine and on a path that no longer exists. Separator
    spelling is normalised first, so a Windows path and its posix spelling
    answer the same.
    """
    if isinstance(path, Path):
        raw = str(path)
    elif isinstance(path, str):
        raw = path
    else:
        return False
    if not raw:
        return False
    norm = raw.replace("\\", "/")
    segments = [s for s in norm.split("/") if s not in ("", ".")]
    if any(s in CACHE_DIR_NAMES for s in segments):
        return True
    leaf = segments[-1] if segments else ""
    return any(leaf.endswith(suffix) for suffix in BYTECODE_SUFFIXES)


def ignore_bytecode(paths):
    """`paths` with every bytecode/cache path dropped, input order preserved.

    Order is preserved rather than sorted because a caller who handed in an
    ordered inventory is entitled to get the same order back minus the
    exclusions; `inventory()` is the sorted entry point.
    """
    return tuple(p for p in (paths or ()) if not is_bytecode_path(p))


def inventory(root, include_dirs=False):
    """Deterministic, read-only inventory of `root`, bytecode/cache excluded.

    Returns root-relative posix paths, sorted, so two inventories of identical
    trees compare equal regardless of the order the host's directory walk
    happened to produce. Cache directories are PRUNED rather than filtered
    after the fact, so nothing inside one is even visited. Links are not
    followed: an inventory that walked through one would report another tree's
    contents as this one's.

    Creates nothing, opens nothing, and deletes nothing. Returns an empty
    tuple for a path that is not an existing directory — absence is a result
    here, not an exception, because a caller checking an undeployed root must
    not have to guard the call.
    """
    base = str(root)
    if not os.path.isdir(base):
        return tuple()
    found = []
    for current, dirs, files in os.walk(base, followlinks=False):
        dirs[:] = sorted(d for d in dirs if d not in CACHE_DIR_NAMES)
        if include_dirs:
            for name in dirs:
                found.append(os.path.relpath(os.path.join(current, name),
                                             base))
        for name in sorted(files):
            if any(name.endswith(suffix) for suffix in BYTECODE_SUFFIXES):
                continue
            found.append(os.path.relpath(os.path.join(current, name), base))
    return tuple(sorted(p.replace("\\", "/") for p in found))


def bytecode_paths(root):
    """Every bytecode/cache path under `root`, root-relative posix, sorted.

    The counterpart of `inventory()`: what that one excludes, this one names.
    A leak check asserts this is empty; nothing here removes what it finds.
    """
    base = str(root)
    if not os.path.isdir(base):
        return tuple()
    found = []
    for current, dirs, files in os.walk(base, followlinks=False):
        dirs[:] = sorted(dirs)
        for name in dirs:
            if name in CACHE_DIR_NAMES:
                found.append(os.path.relpath(os.path.join(current, name),
                                             base))
        for name in files:
            if any(name.endswith(suffix) for suffix in BYTECODE_SUFFIXES):
                found.append(os.path.relpath(os.path.join(current, name),
                                             base))
    return tuple(sorted(p.replace("\\", "/") for p in found))


# --- path shape -------------------------------------------------------------

def is_absolute_path(value):
    """True for a POSIX absolute, UNC, or drive-qualified path string."""
    if not isinstance(value, str) or not value:
        return False
    if _DRIVE_ABS_RE.match(value):
        return True
    return value.replace("\\", "/").startswith("/")


# --- deterministic rendering ------------------------------------------------

def render_json(payload):
    """Render one machine payload to deterministic bytes.

    UTF-8, no BOM, LF line endings, two-space indentation, keys sorted,
    exactly one final LF. Two renders of identical semantic input are
    byte-identical. The same contract B5's `render`, B6's `to_json` and B7's
    receipt renderer use.
    """
    text = json.dumps(payload, indent=2, sort_keys=True, ensure_ascii=False,
                      separators=(",", ": "))
    return (text + "\n").encode("utf-8")


def render_human(lines):
    """Render human output lines to deterministic bytes.

    One LF after every line and no other line terminator, so the result is
    identical on every platform. The caller owns the line ORDER; this function
    only guarantees the bytes.
    """
    return "".join(str(line) + "\n" for line in (lines or ())).encode("utf-8")


# --- structured surface -----------------------------------------------------

@dataclass(frozen=True)
class Invocation:
    """One fully validated invocation. Nothing here was inferred.

    `manifest_path` is the caller's string, verbatim: it is never resolved,
    normalised, or joined to anything, so what a command reports reading is
    exactly what the caller asked it to read.
    """
    command: str
    mode: str
    manifest_path: Optional[str] = None
    stamp: Optional[str] = None

    def to_dict(self):
        return {
            "command": self.command,
            "mode": self.mode,
            "manifest_path": self.manifest_path,
            "stamp": self.stamp,
        }


@dataclass(frozen=True)
class Result:
    """One command's complete answer, in both renderings.

    `payload` is the machine object and `lines` the human lines — both are
    computed for every result, so the two modes can never drift into
    disagreeing about what happened. `error` is non-None only when this result
    IS a refusal, which is also the single thing that routes output to the
    error stream.
    """
    command: str
    mode: str
    ok: bool
    exit_code: int
    payload: dict
    lines: Tuple[str, ...]
    error: Optional[dict] = None

    @property
    def is_error(self):
        return self.error is not None

    def to_json(self):
        return render_json(self.payload)

    def to_human(self):
        return render_human(self.lines)

    def to_bytes(self):
        return self.to_json() if self.mode == MODE_JSON else self.to_human()


def _tool_block():
    return {"name": TOOL_NAME, "version": __version__}


def _base_payload(command, ok, exit_code, stamp=None):
    payload = {
        "command": command,
        "exit_code": exit_code,
        "ok": bool(ok),
        "tool": _tool_block(),
    }
    if stamp is not None:
        payload["stamp"] = stamp
    return payload


def _stamp_lines(stamp):
    """The stamp line, or no line at all.

    A stamp is emitted only because the caller passed one — this module never
    reads a clock, so an output with no `--stamp` carries no time at all and
    two runs a day apart are byte-identical.
    """
    return ("stamp: " + stamp,) if stamp is not None else ()


# --- argument parsing -------------------------------------------------------

def _scan_mode(argv):
    """The requested output mode, found before anything else is parsed.

    Done as its own pass so that a refusal can be rendered in the mode the
    caller asked for: a machine caller that mistyped a command still gets a
    JSON error object rather than prose it cannot parse.
    """
    wants_json = "--json" in argv
    wants_human = "--human" in argv
    if wants_json and wants_human:
        raise CliError(ERR_MODE_CONFLICT,
                       "--json and --human are mutually exclusive; pass one")
    return MODE_JSON if wants_json else MODE_HUMAN


def _split_option(token):
    """(name, inline value or None) for a `--opt` / `--opt=value` token."""
    body = token[2:]
    if "=" in body:
        name, _, value = body.partition("=")
        return name, value
    return body, None


def _validate_manifest_path(value):
    """Return the caller's manifest path verbatim, or refuse it.

    The path is NEVER resolved. An absolute path is used exactly as typed; a
    relative one is refused, because resolving it would make the working
    directory authority over what gets read (F024/F031). Existence is not
    checked here — that is the loader's answer to give, and it gives it as an
    input error rather than a usage error.
    """
    if not isinstance(value, str) or not value.strip():
        raise CliError(ERR_MANIFEST_BLANK,
                       "--manifest requires a non-empty path")
    if _PLACEHOLDER_RE.search(value):
        raise CliError(
            ERR_MANIFEST_PLACEHOLDER,
            "--manifest=" + repr(value) + " still carries an unresolved "
            "placeholder token; a placeholder is a declaration that something "
            "else must supply the real path, never a path")
    if not is_absolute_path(value):
        raise CliError(
            ERR_MANIFEST_NOT_ABSOLUTE,
            "--manifest=" + repr(value) + " is not an absolute path; a "
            "manifest path is used verbatim and is never resolved against the "
            "current working directory")
    return value


def _validate_stamp(value):
    """Return the caller's stamp verbatim, or refuse it.

    A multi-line stamp would break the one-LF-per-line human contract, and a
    blank one carries no information while still changing the output shape.
    """
    if not isinstance(value, str) or not value.strip():
        raise CliError(ERR_STAMP_INVALID,
                       "--stamp requires a non-empty single-line value")
    if "\n" in value or "\r" in value:
        raise CliError(ERR_STAMP_INVALID,
                       "--stamp must be a single line with no CR or LF")
    return value


def parse_args(argv):
    """Parse and fully validate one argument vector. Raises CliError.

    Returns an Invocation. Nothing is defaulted from outside the vector: no
    working directory, no environment variable, no file on disk. The only
    default here is the output mode, and it is a rendering choice rather than
    an input.
    """
    argv = [str(a) for a in (argv or [])]
    mode = _scan_mode(argv)

    if any(token in ("-h", "--help") for token in argv):
        return Invocation(command=CMD_HELP, mode=mode)

    command = None
    options = {}
    index = 0
    while index < len(argv):
        token = argv[index]
        if token in ("--json", "--human"):
            index += 1
            continue
        if token.startswith("-"):
            if not token.startswith("--") or len(token) < 3:
                raise CliError(ERR_UNKNOWN_OPTION,
                               "unknown option " + repr(token))
            name, inline = _split_option(token)
            if name not in VALUE_OPTIONS:
                raise CliError(ERR_UNKNOWN_OPTION,
                               "unknown option " + repr("--" + name))
            if name in options:
                raise CliError(ERR_OPTION_REPEATED,
                               "option " + repr("--" + name) + " was given "
                               "more than once; it accepts exactly one value")
            if inline is not None:
                options[name] = inline
                index += 1
                continue
            if index + 1 >= len(argv) or argv[index + 1].startswith("--"):
                raise CliError(ERR_OPTION_REQUIRES_VALUE,
                               "option " + repr("--" + name) + " requires a "
                               "value")
            options[name] = argv[index + 1]
            index += 2
            continue
        if command is not None:
            raise CliError(ERR_UNEXPECTED_ARGUMENT,
                           "unexpected argument " + repr(token) + "; exactly "
                           "one command is accepted")
        command = token
        index += 1

    if command is None:
        raise CliError(ERR_MISSING_COMMAND,
                       "no command given; supported commands are "
                       + " ".join(COMMANDS))
    if command not in COMMANDS:
        raise CliError(ERR_UNKNOWN_COMMAND,
                       "unknown command " + repr(command) + "; supported "
                       "commands are " + " ".join(COMMANDS),
                       command=command)

    allowed = tuple(COMMAND_OPTIONS[command]) + tuple(GLOBAL_OPTIONS)
    for name in sorted(options):
        if name not in allowed:
            raise CliError(
                ERR_OPTION_NOT_SUPPORTED,
                "option " + repr("--" + name) + " is not supported by "
                + repr(command) + "; it accepts "
                + (" ".join("--" + a for a in allowed) or "no options"),
                command=command)

    stamp = None
    if "stamp" in options:
        stamp = _validate_stamp(options["stamp"])

    manifest_path = None
    if "manifest" in options:
        manifest_path = _validate_manifest_path(options["manifest"])
    elif command == CMD_MANIFEST_SUMMARY:
        raise CliError(
            ERR_MANIFEST_REQUIRED,
            "manifest-summary requires an explicit --manifest PATH; there is "
            "no default manifest path and one is never inferred",
            command=command)

    return Invocation(command=command, mode=mode, manifest_path=manifest_path,
                      stamp=stamp)


# --- lazy product imports ---------------------------------------------------

def _import_module(name):
    """Import one sibling product module by name.

    Lazy by design: the launcher turns bytecode writing off before any command
    runs, and an import performed at THIS module's import time would happen
    before that had a chance to.
    """
    return __import__(name)


def _import_required(name, command):
    try:
        return _import_module(name)
    except Exception as exc:                     # noqa: BLE001
        raise CliError(
            ERR_MODULE_IMPORT,
            "product module " + repr(name) + " could not be imported: "
            + type(exc).__name__ + ": " + str(exc).replace("\n", " "),
            exit_code=EXIT_INTERNAL, command=command)


# --- command: version -------------------------------------------------------

def _version_payload(stamp=None):
    payload = _base_payload(CMD_VERSION, True, EXIT_OK, stamp)
    payload["commands"] = list(COMMANDS)
    payload["command_help"] = {name: COMMAND_HELP[name] for name in COMMANDS}
    payload["modes"] = list(MODES)
    payload["default_mode"] = MODE_HUMAN
    payload["exit_codes"] = dict(EXIT_CODE_NAMES)
    return payload


def cmd_version(inv):
    """Report the tool version and the supported command names.

    Carries nothing environmental: no interpreter version, no platform, no
    path. That is not an omission — it is what makes this command's output the
    same bytes on every machine, which in turn is what makes it usable as a
    fixture in someone else's test.
    """
    payload = _version_payload(inv.stamp)
    lines = _stamp_lines(inv.stamp) + (
        TOOL_NAME + " " + __version__,
        "commands: " + " ".join(COMMANDS),
        "modes: " + " ".join(MODES),
        "default_mode: " + MODE_HUMAN,
        "exit_codes: " + " ".join(
            name + "=" + str(EXIT_CODE_NAMES[name])
            for name in sorted(EXIT_CODE_NAMES, key=EXIT_CODE_NAMES.get)),
    )
    return Result(command=CMD_VERSION, mode=inv.mode, ok=True,
                  exit_code=EXIT_OK, payload=payload, lines=lines)


# --- command: help ----------------------------------------------------------

def cmd_help(inv):
    payload = _base_payload(CMD_HELP, True, EXIT_OK, inv.stamp)
    payload["usage"] = list(USAGE_LINES)
    payload["commands"] = list(COMMANDS)
    return Result(command=CMD_HELP, mode=inv.mode, ok=True, exit_code=EXIT_OK,
                  payload=payload, lines=_stamp_lines(inv.stamp) + USAGE_LINES)


# --- command: manifest-summary ---------------------------------------------

def _load_manifest(path, command):
    """Load one manifest through the archive's own strict loader.

    B6's `load_manifest` is reused rather than reimplemented so that a
    manifest this CLI calls readable is exactly a manifest the planner calls
    readable — two loaders in one archive is two definitions of "valid UTF-8
    JSON manifest".
    """
    plan = _import_required("wrkdeployplan", command)
    try:
        return plan, plan.load_manifest(path)
    except plan.DeployPlanError as exc:
        raise CliError(ERR_MANIFEST_UNREADABLE,
                       str(exc).replace("\n", " "), command=command)


def _manifest_summary(plan, manifest, path):
    """The deterministic summary of one already-loaded manifest."""
    projections = manifest.get("projections")
    projections = projections if isinstance(projections, list) else []

    ids = []
    targets = []
    kinds = []
    malformed = 0
    for entry in projections:
        if not isinstance(entry, dict):
            malformed += 1
            continue
        pid = entry.get("id")
        if isinstance(pid, str) and pid.strip():
            ids.append(pid)
        else:
            malformed += 1
        kind = entry.get("kind")
        if isinstance(kind, str) and kind.strip():
            kinds.append(kind)
        target = entry.get("target")
        if isinstance(target, str) and target.strip():
            targets.append(target)

    kind_counts = {name: 0 for name in plan.SUPPORTED_KINDS}
    unsupported = set()
    for kind in kinds:
        if kind in kind_counts:
            kind_counts[kind] += 1
        else:
            unsupported.add(kind)

    seen_ids = set(ids)
    present = {pid: pid in seen_ids for pid in KNOWN_PROJECTION_IDS}

    return {
        "path": path,
        "manifest_version": manifest.get("manifest_version"),
        "target_release": manifest.get("target_release"),
        "hash_algorithm": manifest.get("hash_algorithm"),
        "declared_archive_root": manifest.get("archive_root"),
        "declared_deployment_root": manifest.get("deployment_root"),
        "projection_count": len(projections),
        "unique_projection_id_count": len(seen_ids),
        "duplicate_projection_ids": sorted(
            {pid for pid in ids if ids.count(pid) > 1}),
        "malformed_projection_count": malformed,
        "target_count": len(targets),
        "unique_target_count": len(set(targets)),
        "duplicate_targets": sorted(
            {t for t in targets if targets.count(t) > 1}),
        "kind_counts": kind_counts,
        "unsupported_kinds": sorted(unsupported),
        "available_stacks": list(plan.manifest_stacks(manifest)),
        "known_projections": present,
        "known_projections_present_count": sum(1 for v in present.values()
                                               if v),
        "known_projections_missing": sorted(k for k, v in present.items()
                                            if not v),
    }


def cmd_manifest_summary(inv):
    """Summarise an explicitly supplied deployment manifest.

    Reports; it does not adjudicate. A duplicate id or an unsupported kind is
    stated as a fact and the command still exits 0, because the command
    succeeded at summarising. `self-check` is the command that renders a
    verdict, and B6's planner is the authority that BLOCKS a deployment. A
    summariser that also failed the build would be a third opinion nobody
    asked for.
    """
    plan, manifest = _load_manifest(inv.manifest_path, inv.command)

    errors = plan.validate_manifest(manifest)
    if errors:
        raise CliError(
            ERR_MANIFEST_MALFORMED,
            "manifest is not structurally valid: "
            + "; ".join(e.replace("\n", " ") for e in errors),
            command=inv.command)

    summary = _manifest_summary(plan, manifest, inv.manifest_path)
    payload = _base_payload(inv.command, True, EXIT_OK, inv.stamp)
    payload["manifest"] = summary

    lines = _stamp_lines(inv.stamp) + (
        "manifest: " + str(summary["path"]),
        "manifest_version: " + str(summary["manifest_version"]),
        "target_release: " + str(summary["target_release"]),
        "hash_algorithm: " + str(summary["hash_algorithm"]),
        "declared_archive_root: " + str(summary["declared_archive_root"]),
        "declared_deployment_root: "
        + str(summary["declared_deployment_root"]),
        "projections: " + str(summary["projection_count"]),
        "unique_projection_ids: "
        + str(summary["unique_projection_id_count"]),
        "duplicate_projection_ids: "
        + str(len(summary["duplicate_projection_ids"])),
        "malformed_projections: " + str(summary["malformed_projection_count"]),
        "targets: " + str(summary["target_count"]),
        "unique_targets: " + str(summary["unique_target_count"]),
        "duplicate_targets: " + str(len(summary["duplicate_targets"])),
    ) + tuple(
        "kind " + kind + ": " + str(summary["kind_counts"][kind])
        for kind in sorted(summary["kind_counts"])
    ) + (
        "unsupported_kinds: " + str(len(summary["unsupported_kinds"])),
        "available_stacks: " + " ".join(summary["available_stacks"]),
    ) + tuple(
        "known " + pid + ": "
        + ("present" if summary["known_projections"][pid] else "absent")
        for pid in KNOWN_PROJECTION_IDS
    ) + (
        "known_projections_missing: "
        + str(len(summary["known_projections_missing"])),
    )

    return Result(command=inv.command, mode=inv.mode, ok=True,
                  exit_code=EXIT_OK, payload=payload, lines=lines)


# --- command: self-check ----------------------------------------------------

def _check(check_id, status, detail):
    return {"id": check_id, "status": status, "detail": detail}


def _path_shaped(value):
    """True if `value` looks like a filesystem path rather than a plain token."""
    if not isinstance(value, str) or not value:
        return False
    if is_absolute_path(value):
        return True
    return "/" in value or "\\" in value


def _path_shaped_values(value, path=""):
    """Dotted paths of every path-shaped string inside a JSON-safe payload."""
    found = []
    if isinstance(value, dict):
        for key in sorted(value, key=str):
            child = (path + "." + str(key)) if path else str(key)
            found += _path_shaped_values(value[key], child)
    elif isinstance(value, list):
        for i, item in enumerate(value):
            found += _path_shaped_values(item, path + "[" + str(i) + "]")
    elif _path_shaped(value):
        found.append(path)
    return found


def _probe_refuses(argv, expected_code):
    """True if `parse_args(argv)` refuses with exactly `expected_code`."""
    try:
        parse_args(argv)
    except CliError as exc:
        return exc.code == expected_code
    except Exception:                            # noqa: BLE001
        return False
    return False


def _check_product_modules():
    imported = []
    failed = []
    for name in SELF_CHECK_MODULES:
        try:
            module = _import_module(name)
        except Exception as exc:                 # noqa: BLE001
            failed.append(name + " (" + type(exc).__name__ + ")")
            continue
        version = getattr(module, "__version__", None)
        imported.append(name + "=" + (version if isinstance(version, str)
                                      else "unversioned"))
    if failed:
        entry = _check("product_modules_import", CHECK_FAIL,
                       "product module(s) failed to import: "
                       + ", ".join(failed))
    else:
        entry = _check("product_modules_import", CHECK_PASS,
                       "all " + str(len(SELF_CHECK_MODULES))
                       + " product modules import: " + ", ".join(imported))
    return entry, imported, failed


def _check_cli_surface():
    problems = []
    if not isinstance(__version__, str) or not __version__.strip():
        problems.append("this module exposes no usable __version__")
    if COMMANDS != tuple(sorted(COMMANDS)):
        problems.append("COMMANDS is not in sorted order")
    if len(set(COMMANDS)) != len(COMMANDS):
        problems.append("COMMANDS carries a duplicate")
    missing_handler = [c for c in COMMANDS if c not in _HANDLERS]
    if missing_handler:
        problems.append("command(s) with no handler: "
                        + " ".join(missing_handler))
    orphan_handler = [c for c in sorted(_HANDLERS)
                      if c not in COMMANDS and c != CMD_HELP]
    if orphan_handler:
        problems.append("handler(s) for no declared command: "
                        + " ".join(orphan_handler))
    missing_help = [c for c in COMMANDS if c not in COMMAND_HELP]
    if missing_help:
        problems.append("command(s) with no help line: "
                        + " ".join(missing_help))
    missing_options = [c for c in COMMANDS if c not in COMMAND_OPTIONS]
    if missing_options:
        problems.append("command(s) with no declared option set: "
                        + " ".join(missing_options))
    if tuple(sorted(set(EXIT_CODE_NAMES.values()))) != tuple(
            sorted(set(EXIT_CODES))):
        problems.append("EXIT_CODE_NAMES and EXIT_CODES disagree")
    if set(USAGE_ERRORS) - set(ERRORS):
        problems.append("USAGE_ERRORS names a code outside ERRORS")
    if len(set(ERRORS)) != len(ERRORS):
        problems.append("ERRORS carries a duplicate")
    if problems:
        return _check("cli_surface_frozen", CHECK_FAIL, "; ".join(problems))
    return _check(
        "cli_surface_frozen", CHECK_PASS,
        TOOL_NAME + " " + __version__ + " declares " + str(len(COMMANDS))
        + " commands, each with a handler, a help line and an option set; "
        + str(len(ERRORS)) + " frozen error codes; "
        + str(len(EXIT_CODES)) + " frozen exit codes")


def _check_manifest(inv):
    if inv.manifest_path is None:
        return _check(
            "manifest_parses", CHECK_SKIPPED,
            "no --manifest was supplied; a manifest path is never inferred "
            "from the working directory, the environment, or this module's "
            "own location, so there is nothing to parse")
    try:
        plan, manifest = _load_manifest(inv.manifest_path, inv.command)
    except CliError as exc:
        return _check("manifest_parses", CHECK_FAIL,
                      exc.code + ": " + exc.detail)
    errors = plan.validate_manifest(manifest)
    if errors:
        return _check("manifest_parses", CHECK_FAIL,
                      "manifest parsed but is not structurally valid: "
                      + "; ".join(e.replace("\n", " ") for e in errors))
    projections = manifest.get("projections") or []
    return _check(
        "manifest_parses", CHECK_PASS,
        "the supplied manifest parses as UTF-8 JSON and passes the B6 "
        "structural check with " + str(len(projections)) + " projections")


def _check_cwd_not_authority():
    problems = []
    if MANIFEST_DEFAULT is not None:
        problems.append("MANIFEST_DEFAULT is not None, so a manifest path "
                        "could be defaulted rather than declared")
    probes = (
        (["manifest-summary", "--manifest", "relative/MANIFEST.json"],
         ERR_MANIFEST_NOT_ABSOLUTE),
        (["manifest-summary", "--manifest", "./MANIFEST.json"],
         ERR_MANIFEST_NOT_ABSOLUTE),
        (["manifest-summary", "--manifest", "   "], ERR_MANIFEST_BLANK),
        (["manifest-summary", "--manifest", "${WORKSPACE_ROOT}/M.json"],
         ERR_MANIFEST_PLACEHOLDER),
        (["manifest-summary"], ERR_MANIFEST_REQUIRED),
    )
    for argv, expected in probes:
        if not _probe_refuses(argv, expected):
            problems.append("a manifest path that must be refused as "
                            + expected + " was not refused: " + " ".join(argv))
    leaked = _path_shaped_values(_version_payload())
    if leaked:
        problems.append("the version payload carries path-shaped value(s) "
                        "nobody supplied: " + " ".join(leaked))
    if problems:
        return _check("cwd_not_authority", CHECK_FAIL, "; ".join(problems))
    return _check(
        "cwd_not_authority", CHECK_PASS,
        "no command has a default manifest path; a relative, blank or "
        "placeholder path is refused rather than resolved; and the output of "
        "a command given no path carries no path")


def _check_env_not_authority(inv):
    problems = []
    if tuple(ENV_INPUTS) != ():
        problems.append("ENV_INPUTS is not empty, so a command declares an "
                        "environment input")
    if not set(IGNORED_ENV_KEYS) >= {"CCOS_WORKSPACE_ROOT",
                                     "CLAUDE_PROJECT_DIR"}:
        problems.append("IGNORED_ENV_KEYS does not name both root variables "
                        "it must refuse as authority")
    leaked = _path_shaped_values(_version_payload())
    if leaked:
        problems.append("the version payload carries path-shaped value(s) "
                        "nobody supplied: " + " ".join(leaked))
    if inv.manifest_path is not None:
        reported = None
        try:
            plan, manifest = _load_manifest(inv.manifest_path, inv.command)
            reported = _manifest_summary(plan, manifest,
                                         inv.manifest_path)["path"]
        except CliError:
            reported = None
        if reported != inv.manifest_path:
            problems.append("the reported manifest path is not the caller's "
                            "own string, so something rewrote it")
    if problems:
        return _check("env_not_authority", CHECK_FAIL, "; ".join(problems))
    detail = ("no command declares an environment input and "
              + " / ".join(IGNORED_ENV_KEYS) + " are never consulted as "
              "authority; a supplied manifest path is reported back verbatim")
    if inv.manifest_path is None:
        detail += (" (no manifest was supplied, so the verbatim-path leg of "
                   "this check did not run)")
    return _check("env_not_authority", CHECK_PASS, detail)


def _check_bytecode():
    state = bytecode_hygiene()
    if not state["dont_write_bytecode"]:
        return _check(
            "bytecode_hygiene", CHECK_FAIL,
            "sys.dont_write_bytecode is False, so an import performed by this "
            "command can write a .pyc; launch through this module's main() "
            "entrypoint, or set " + EQUIVALENT_ENV_SPELLING + ", or pass "
            + EQUIVALENT_FLAG_SPELLING), state
    source = ("the launcher entrypoint turned it off before importing any "
              "product module"
              if state["hygiene_enabled_by_launcher"] else
              "the interpreter was already started with bytecode writing off ("
              + EQUIVALENT_ENV_SPELLING + " or "
              + EQUIVALENT_FLAG_SPELLING + ")")
    return _check(
        "bytecode_hygiene", CHECK_PASS,
        "sys.dont_write_bytecode is True, so no import performed by this "
        "command writes a .pyc: " + source), state


def cmd_self_check(inv):
    """Read-only self-check. Proves; never repairs, deploys, or deletes.

    Every check below is a live assertion rather than a claim: the modules are
    really imported, the refusals are really attempted, the interpreter flag is
    really read. What this command deliberately does NOT do is manipulate the
    working directory or the process environment in order to prove the
    negative laws differentially — a shipped read-only command that mutates
    process state to test itself is a command with a side effect. Those
    differential proofs (running the CLI from another directory, running it
    with CCOS_WORKSPACE_ROOT set to a bogus value, and proving a subprocess
    launch creates no `__pycache__`) live in the archive's own test suite,
    where manipulating the process is legitimate. Each detail string says
    which leg of its law was proven here.

    A failed check is a RESULT, not an error: the payload goes to the output
    stream and the exit code is EXIT_CHECK_FAILED, because the command did its
    job and the answer was no.
    """
    checks = []

    modules_check, imported, _failed = _check_product_modules()
    checks.append(modules_check)
    checks.append(_check_cli_surface())
    checks.append(_check_manifest(inv))
    checks.append(_check_cwd_not_authority())
    checks.append(_check_env_not_authority(inv))
    bytecode_check, bytecode_state = _check_bytecode()
    checks.append(bytecode_check)

    counts = {
        CHECK_FAIL: sum(1 for c in checks if c["status"] == CHECK_FAIL),
        CHECK_PASS: sum(1 for c in checks if c["status"] == CHECK_PASS),
        CHECK_SKIPPED: sum(1 for c in checks if c["status"] == CHECK_SKIPPED),
    }
    ok = counts[CHECK_FAIL] == 0
    exit_code = EXIT_OK if ok else EXIT_CHECK_FAILED

    payload = _base_payload(inv.command, ok, exit_code, inv.stamp)
    payload["checks"] = checks
    payload["check_ids"] = list(CHECK_IDS)
    payload["counts"] = counts
    payload["bytecode"] = bytecode_state
    payload["product_modules"] = sorted(imported)
    payload["manifest_path"] = inv.manifest_path
    payload["deployment_apply_called"] = False

    lines = _stamp_lines(inv.stamp) + (
        "self-check: " + (CHECK_PASS if ok else CHECK_FAIL),
    )
    for entry in checks:
        lines += ("check " + entry["id"] + ": " + entry["status"],)
        if entry["status"] == CHECK_FAIL:
            lines += ("  detail: " + entry["detail"],)
    lines += (
        "dont_write_bytecode: "
        + ("true" if bytecode_state["dont_write_bytecode"] else "false"),
        "deployment_apply_called: false",
        "pass: " + str(counts[CHECK_PASS]),
        "fail: " + str(counts[CHECK_FAIL]),
        "skipped: " + str(counts[CHECK_SKIPPED]),
    )

    return Result(command=inv.command, mode=inv.mode, ok=ok,
                  exit_code=exit_code, payload=payload, lines=lines)


# --- dispatch ---------------------------------------------------------------

_HANDLERS = {
    CMD_HELP: cmd_help,
    CMD_MANIFEST_SUMMARY: cmd_manifest_summary,
    CMD_SELF_CHECK: cmd_self_check,
    CMD_VERSION: cmd_version,
}


def dispatch(inv):
    """Run one validated Invocation. Raises CliError for a named refusal."""
    handler = _HANDLERS.get(inv.command)
    if handler is None:
        raise CliError(ERR_UNKNOWN_COMMAND,
                       "no handler for command " + repr(inv.command),
                       command=inv.command)
    return handler(inv)


def error_result(code, detail, exit_code, mode=MODE_HUMAN, command=""):
    """Build the Result that represents one refusal, in both renderings."""
    detail = str(detail).replace("\n", " ").replace("\r", " ")
    error = {"code": code, "detail": detail}
    payload = _base_payload(command or "", False, exit_code)
    payload["error"] = error
    lines = ("error: " + code + ": " + detail,)
    if code in USAGE_ERRORS:
        lines += (USAGE_LINES[0],)
    return Result(command=command or "", mode=mode, ok=False,
                  exit_code=exit_code, payload=payload, lines=lines,
                  error=error)


def run(argv):
    """Parse, validate and run one argument vector. Returns a Result.

    Never raises: a refusal and an unexpected fault are both structured,
    inspectable Results, because an exception escaping here would take the
    exit code and the machine-readable reason with it. Mutates no interpreter
    state — `main()` is the entrypoint that owns the bytecode flag.
    """
    mode = MODE_HUMAN
    try:
        mode = _scan_mode([str(a) for a in (argv or [])])
    except CliError:
        mode = MODE_HUMAN
    try:
        inv = parse_args(argv)
        return dispatch(inv)
    except CliError as exc:
        return error_result(exc.code, exc.detail, exc.exit_code, mode=mode,
                            command=exc.command or "")
    except Exception as exc:                     # noqa: BLE001
        return error_result(
            ERR_INTERNAL, type(exc).__name__ + ": " + str(exc),
            EXIT_INTERNAL, mode=mode)


# --- emission ---------------------------------------------------------------

def _binary_stream(stream, fallback):
    """The binary face of a stream.

    Output is written as BYTES on purpose: a text stream on Windows translates
    every LF into CRLF, which would break the LF-only contract on exactly the
    platform this archive is operated from.
    """
    target = fallback if stream is None else stream
    buffer = getattr(target, "buffer", None)
    return buffer if buffer is not None else target


def emit(result, stdout=None, stderr=None):
    """Write one Result to the caller's streams. Returns its exit code.

    A refusal goes to the ERROR stream and everything else to the output
    stream, so a machine caller can parse its output without having to first
    decide whether what it got was an answer.
    """
    stream = _binary_stream(stderr if result.is_error else stdout,
                            sys.stderr if result.is_error else sys.stdout)
    stream.write(result.to_bytes())
    flush = getattr(stream, "flush", None)
    if callable(flush):
        flush()
    return result.exit_code


def main(argv=None):
    """The supported launcher entrypoint. Returns the process exit code.

    Bytecode writing is turned off FIRST, before `run()` triggers the first
    lazy product import, so a launcher-driven operation leaves no
    `__pycache__` beside the modules it read.
    """
    enable_no_bytecode()
    return emit(run(sys.argv[1:] if argv is None else argv))


if __name__ == "__main__":
    sys.exit(main())
