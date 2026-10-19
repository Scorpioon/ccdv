#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
CCOS WRKOPS 1.8.1 — wrkparse (shared handoff/report parser + validator)
=======================================================================
Single parser/validator used by BOTH report_writer.py (Stop) and
check_pairing.py (operator tool), per delta section 11.5.

  CONTRACTS.1.02   handoff/report identity fields are schema-governed
  CONTRACTS.2.01   report exists and pairs with its handoff
  PATCH_TRACE.2.02 report omits no finding (canonical sections)

Why this file exists (delta F05/F06):
  1.8.0 validated reports by lowercasing the whole file and regex-grepping for
  five heading patterns. That proved page SHAPE, never TRUTH: a report with the
  right headings and a WRONG task_id passed. And the regex `boundary\\s+law`
  rejected "Boundary-law" while the hook's own error text INSTRUCTED Claude to
  write "Boundary-law" — a self-inflicted trap.

Design constraints:
  - stdlib ONLY. CLAUDECLI.2.02 NO_INSTALL forbids pip deps in shipped hooks,
    so `jsonschema` is not available. validate_against_schema() implements the
    exact subset of Draft 2020-12 our four schemas actually use:
      type, required, properties, pattern, enum, format:date, minLength,
      additionalProperties
    Anything outside that subset is reported as an UNSUPPORTED schema keyword
    rather than silently ignored — a validator that quietly skips rules is how
    F05 happened in the first place.
  - No project hardcoding (library-before-project).
  - Pure functions; no I/O side effects beyond reading the paths handed to it.

Decision A (operator, 2026-07-17): expected_report is NOT copied into the report
  schema. active_task.json remains sole authority for LOCATION; the report proves
  IDENTITY only. Cross-reference happens in report_writer.py, not here.
"""
import json
import re
from datetime import date
from pathlib import Path

__version__ = "1.0.1"

# --- canonical report sections (delta 11.4) --------------------------------
# Exact headings. No fuzzy matching, no regex alternation. If you change this
# list you MUST change the operator-facing instruction text that quotes it, or
# you rebuild the F06 trap.
CANONICAL_SECTIONS = [
    "## Files written or modified",
    "## Files read but not modified",
    "## Findings outside declared scope",
    "## Boundary law checks triggered",
    "## Smoke checklist",
    "## Validation note",
]

# Sections a report must carry to be complete. "Validation note" is present in
# the canonical set but is operator-owned, so it is not required of Claude.
REQUIRED_SECTIONS = CANONICAL_SECTIONS[:5]

_DATE_RE = re.compile(r"^\d{4}-\d{2}-\d{2}$")


class ParseError(Exception):
    """Raised when a document cannot be parsed at all (not merely invalid)."""


# --- front matter ----------------------------------------------------------

def parse_front_matter(text):
    """Extract YAML-ish front matter from a markdown document.

    Returns (fields: dict, body: str).

    Deliberately a minimal scalar parser: our handoff/report front matter is
    flat `key: value` pairs (see handoff.schema.json / report.schema.json).
    Nested structures are NOT silently dropped — they raise ParseError, because
    a field we cannot read is a field we cannot validate.
    """
    if not text.startswith("---"):
        raise ParseError("missing front matter: document must open with '---'")

    lines = text.splitlines()
    close = None
    for i in range(1, len(lines)):
        if lines[i].strip() == "---":
            close = i
            break
    if close is None:
        raise ParseError("unterminated front matter: no closing '---'")

    fields = {}
    for ln in lines[1:close]:
        raw = ln.rstrip()
        if not raw.strip() or raw.lstrip().startswith("#"):
            continue
        if raw.startswith((" ", "\t", "-")):
            raise ParseError(
                f"unsupported nested/list front-matter entry: {raw.strip()!r} "
                "(handoff/report front matter must be flat key: value)")
        if ":" not in raw:
            raise ParseError(f"malformed front-matter line: {raw.strip()!r}")
        key, _, val = raw.partition(":")
        key = key.strip()
        val = val.strip()
        if len(val) >= 2 and val[0] == val[-1] and val[0] in "'\"":
            val = val[1:-1]
        if key in fields:
            raise ParseError(f"duplicate front-matter key: {key!r}")
        fields[key] = val

    body = "\n".join(lines[close + 1:])
    return fields, body


# --- minimal Draft 2020-12 subset validator --------------------------------

_SUPPORTED = {
    "$schema", "$id", "title", "schema_version", "type", "required",
    "properties", "additionalProperties", "pattern", "enum", "format",
    "minLength", "description",
    # 1.0.1 — added for project.json (slug_ledger array) and scope.json.
    # These are the ONLY three keywords the four shipped schemas use beyond the
    # original flat set; adding them keeps taskctl on the same parser as the
    # hooks (delta 11.5) with zero third-party dependencies.
    "items", "minItems", "minimum",
}

# JSON Schema type name -> Python types. `bool` is excluded from integer/number
# because in Python `True` is an int, and a schema asking for an integer must
# not silently accept a boolean.
_TYPE_MAP = {
    "string": str,
    "object": dict,
    "array": list,
    "integer": int,
    "number": (int, float),
    "boolean": bool,
    "null": type(None),
}


def _type_ok(value, tname):
    py = _TYPE_MAP.get(tname)
    if py is None:
        return True  # unknown type name is caught by the keyword audit
    if tname in ("integer", "number") and isinstance(value, bool):
        return False
    return isinstance(value, py)


def _validate_node(value, spec, path, errors):
    """Validate one value against one schema node. Recurses into objects/arrays.

    `path` is a dotted/indexed location string used in error messages, so a bad
    ledger entry reports as `slug_ledger[3].task_id` rather than `task_id`.
    """
    # keyword audit at every level — an unsupported keyword nested three deep is
    # just as capable of silently not-validating as one at the root (F05).
    unsupported = set(spec) - _SUPPORTED
    if unsupported:
        errors.append(
            f"{path}: SCHEMA USES UNSUPPORTED KEYWORDS {sorted(unsupported)} — "
            "wrkparse validates a documented subset only; extend wrkparse "
            "before relying on these")

    t = spec.get("type")
    if t is not None and not _type_ok(value, t):
        errors.append(f"{path}: expected {t}, got {type(value).__name__}")
        return  # further checks would be meaningless against the wrong type

    if "enum" in spec and value not in spec["enum"]:
        errors.append(f"{path}: {value!r} is not one of {spec['enum']}")

    if isinstance(value, str):
        if "pattern" in spec and not re.search(spec["pattern"], value):
            errors.append(f"{path}: {value!r} does not match required pattern "
                          f"{spec['pattern']}")
        if "minLength" in spec and len(value) < spec["minLength"]:
            errors.append(f"{path}: shorter than minLength {spec['minLength']}")
        if spec.get("format") == "date":
            if not _DATE_RE.match(value):
                errors.append(f"{path}: {value!r} is not an ISO date (YYYY-MM-DD)")
            else:
                try:
                    y, m, d = (int(p) for p in value.split("-"))
                    date(y, m, d)
                except ValueError:
                    errors.append(f"{path}: {value!r} is not a real calendar date")

    if isinstance(value, (int, float)) and not isinstance(value, bool):
        if "minimum" in spec and value < spec["minimum"]:
            errors.append(f"{path}: {value} is below minimum {spec['minimum']}")

    if isinstance(value, list):
        if "minItems" in spec and len(value) < spec["minItems"]:
            errors.append(f"{path}: has {len(value)} item(s), "
                          f"minItems is {spec['minItems']}")
        item_spec = spec.get("items")
        if isinstance(item_spec, dict):
            for i, item in enumerate(value):
                _validate_node(item, item_spec, f"{path}[{i}]", errors)

    if isinstance(value, dict):
        for req in spec.get("required", []):
            if req not in value or value[req] in ("", None):
                errors.append(f"{path}.{req}: missing required field")
        props = spec.get("properties", {})
        for k, sub in props.items():
            if k in value and value[k] not in ("", None):
                _validate_node(value[k], sub, f"{path}.{k}", errors)
        if spec.get("additionalProperties") is False:
            for k in value:
                if k not in props:
                    errors.append(f"{path}.{k}: unexpected field not allowed")


def validate_against_schema(data, schema):
    """Validate data against the supported Draft 2020-12 subset.

    Handles both flat front-matter dicts (all values are strings, straight from
    parse_front_matter) and fully typed JSON documents (project.json, with its
    nested slug_ledger array). Same parser for hooks and taskctl — delta 11.5.

    Returns a list of human-readable error strings; empty list == valid.
    Unsupported schema keywords are reported as errors rather than ignored:
    silently skipping a rule is exactly the F05 failure mode.
    """
    errors = []
    _validate_node(data, schema, "<root>", errors)
    # tidy the root prefix so flat front-matter errors read as before
    return [e.replace("<root>.", "").replace("<root>: ", "") for e in errors]


def load_schema(schema_dir, name):
    p = Path(schema_dir) / f"{name}.schema.json"
    if not p.exists():
        raise ParseError(f"schema not found: {p}")
    try:
        return json.loads(p.read_text(encoding="utf-8"))
    except Exception as e:
        raise ParseError(f"schema is not valid JSON: {p} ({e})")


# --- document-level helpers -------------------------------------------------

def read_document(path):
    """Read a markdown document, returning (fields, body).

    Encoding is strict: a report we cannot decode is a report we cannot trust
    (delta 11.2 'encoding is valid'). errors='replace' would mask corruption.
    """
    p = Path(path)
    if not p.exists():
        raise ParseError(f"file not found: {path}")
    try:
        text = p.read_text(encoding="utf-8")
    except UnicodeDecodeError as e:
        raise ParseError(f"file is not valid UTF-8: {path} ({e})")
    return parse_front_matter(text)


def missing_sections(body, required=None):
    """Return canonical sections absent from the body, in canonical order.

    Exact prefix match on a stripped line. Not a regex. This is the F06 fix:
    'Boundary-law' is simply not the canonical heading and is reported as
    missing, with the exact expected string given back to the caller.
    """
    required = REQUIRED_SECTIONS if required is None else required
    present = {ln.strip() for ln in body.splitlines()}
    return [s for s in required if s not in present]


def identity_of(fields):
    """Extract the identity tuple used for pairing checks."""
    return (fields.get("task_id"), fields.get("slug"))
