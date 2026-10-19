#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
CCOS WRKOPS 1.8.1 — wrkpack (task pack intake + archive safety)
================================================================
Delta section 5. The intake surface for `<slug>.wrkpack.zip`.

  FILE_HANDOFF (5.5)  pack intake archive safety
  CONTRACTS.1.02      identity fields are schema-governed

Threat model — why this file is paranoid:
  A pack is the ONE artifact that crosses the boundary from outside the
  workspace to inside it. Everything else in WRKOPS is local. That makes this
  the only place where a hostile or merely broken input can reach the
  filesystem, so it is the only place where "probably fine" is not an
  acceptable standard.

  The classic zip attacks are all live here: traversal (`../../etc/cron.d/x`),
  absolute paths, symlinks pointing outside the root, duplicate members where
  the validator sees entry A and the extractor writes entry B, and zip bombs.

Design law — INSPECT, THEN EXTRACT, NEVER TRUST:
  Every check runs against the zip's CENTRAL DIRECTORY before a single byte is
  written to disk. We never extract to a temp dir and validate afterwards:
  that hands the attacker a write primitive and asks him politely not to use
  it. If any check fails, nothing was ever written, because nothing was ever
  extracted.

  We also never use ZipFile.extract()/extractall(). CPython sanitises names
  inside extract(), but that sanitisation is a silent REPAIR: a traversal entry
  becomes a harmless local file and the operator is never told the pack was
  hostile. We want the rejection, not the repair. So we resolve every path
  ourselves, verify containment, and write bytes explicitly.

Windows note (the operator ships on Windows):
  posixpath.isabs("C:/evil.txt") is False. A drive-absolute or UNC path walks
  straight past a POSIX-only absolute check. Zip spec says forward slashes, but
  a hostile pack has no obligation to follow the spec. Every path check here
  runs BOTH posixpath and ntpath, plus explicit drive/UNC detection, and treats
  a backslash as a separator. Verified empirically, not assumed.

  stdlib only (CLAUDECLI.2.02 NO_INSTALL). zipfile + hashlib + stat cover the
  whole of 5.5; no dependency is required.
"""
import hashlib
import json
import ntpath
import posixpath
import re
import stat
import zipfile
from pathlib import Path, PurePosixPath

import wrkparse

__version__ = "1.2.0"

PACK_SUFFIX = ".wrkpack.zip"
MANIFEST_NAME = "manifest.json"

# 5.2 — the only top-level members a pack may carry. Anything else is an
# "unknown top-level file" and is rejected (5.5), because a pack that carries
# what we did not ask for is a pack we do not understand.
ALLOWED_TOP_LEVEL = {MANIFEST_NAME}
ATTACHMENTS_DIR = "attachments"

# 5.3 — records and authorities that are LOCAL and may never arrive in a pack.
PROHIBITED_NAMES = {
    "active_task.json",
    "project.json",
    ".git",
    ".gitignore",
    "settings.json",
    "settings.base.json",
    "claude.md",
}
PROHIBITED_SUFFIXES = (".report.md",)

# 5.3 — executable payloads. A pack is intent + scope, never code to run.
EXECUTABLE_SUFFIXES = (
    ".exe", ".dll", ".so", ".dylib", ".bat", ".cmd", ".com", ".scr",
    ".ps1", ".psm1", ".sh", ".bash", ".zsh", ".py", ".pyc", ".pyo",
    ".rb", ".pl", ".php", ".jar", ".msi", ".app", ".bin", ".elf",
    ".vbs", ".js", ".mjs", ".cjs", ".wsf", ".lnk",
)

# Zip-bomb ceilings. Generous for a handoff + a few attachments; nowhere near
# enough for a decompression bomb to matter.
MAX_MEMBERS = 64
MAX_TOTAL_UNCOMPRESSED = 32 * 1024 * 1024      # 32 MB
MAX_COMPRESSION_RATIO = 200                     # per-member


class PackError(Exception):
    """Raised when a pack is unsafe or invalid. Never auto-repaired."""


# --- path safety ------------------------------------------------------------

def _is_absolute_any(name):
    """True if `name` is absolute under POSIX **or** Windows semantics.

    Both, because the pack may have been built anywhere and will be opened on
    Windows. `C:/x` is not absolute to posixpath; `\\\\server\\share\\x` is not
    absolute to posixpath either. Either one lands outside the root.
    """
    return posixpath.isabs(name) or ntpath.isabs(name)


def _segments(name):
    """Split on BOTH separators. A hostile pack will use whichever we ignore."""
    return [s for s in re.split(r"[\\/]+", name) if s not in ("", ".")]


def check_member_name(name):
    """Return a rejection reason for `name`, or None if the name is safe.

    Pure function over the name alone — no filesystem access, so it cannot be
    fooled by anything on disk and can be unit-tested exhaustively.
    """
    if not name or not name.strip():
        return "empty member name"
    if "\x00" in name:
        return "member name contains a NUL byte"
    # Drive-qualified first: "C:x.txt" is drive-RELATIVE, so ntpath.isabs()
    # says False, yet it still resolves off our root on Windows.
    if ntpath.splitdrive(name)[0]:
        return f"drive-qualified path (5.5): {name!r}"
    if _is_absolute_any(name):
        return f"absolute path (5.5): {name!r}"
    segs = _segments(name)
    if ".." in segs:
        return f"'..' traversal (5.5): {name!r}"
    if name.startswith(("\\", "/")):
        return f"root-anchored path (5.5): {name!r}"
    return None


def _resolve_within(root, name):
    """Resolve `name` under `root`, proving containment. Raises on escape.

    This is the belt to check_member_name's braces. Name-level checks catch the
    known shapes; this catches whatever shape we did not think of, because it
    asks the only question that actually matters: does the final path live
    under the root?
    """
    root = Path(root).resolve()
    target = (root / PurePosixPath(name.replace("\\", "/"))).resolve()
    try:
        target.relative_to(root)
    except ValueError:
        raise PackError(
            f"entry resolves OUTSIDE the extraction root (5.5): {name!r}\n"
            f"  root:   {root}\n"
            f"  target: {target}")
    return target


# --- attachment target identity (B3R-B1 §3) ---------------------------------
#
# An attachment has TWO identities: the archive member name, and the workspace
# path it materializes to. B3R-A made required reads machine authority, and
# authority lives at the SECOND identity — the file the executor actually
# opens. Two distinct member names that collapse onto one target therefore
# collapse two authorities into one (ITV-B3RA-01), and the manifest string
# being unique proves nothing.
#
# So the member -> relative-target derivation exists exactly ONCE, here, and
# every consumer (collision detection at inspect time, taskctl materialization
# at activation time) calls it. A second copy of this arithmetic anywhere is
# the bug, not the redundancy.

def attachment_relative_target(member):
    """Attachment-relative path `member` materializes to. Raises PackError.

    The single shared derivation seam (B3R-B1 §3). Pure: no filesystem access,
    so it can be unit-tested exhaustively and cannot be fooled by whatever
    happens to exist on disk.

    Self-defensive by contract: it re-proves the *derived* target rather than
    stripping a prefix and trusting a downstream guard to catch the wreckage.
    `"attachments//a.md"` used to strip to `"/a.md"` — root-anchored, outside
    the attachment directory — and survived only because two later guards
    happened to refuse it (ITV-B3RA-01 / D14). A helper whose own output is
    unsafe is a helper waiting for the day nobody re-checks it.
    """
    if not isinstance(member, str):
        raise PackError(
            f"attachment member is not a string (B3R-B1 3): {member!r}")

    reason = check_member_name(member)
    if reason:
        raise PackError(f"unsafe attachment member (5.5): {reason}")

    segs = _segments(member)
    if not segs or segs[0] != ATTACHMENTS_DIR or len(segs) < 2:
        raise PackError(
            f"attachment must live under {ATTACHMENTS_DIR}/ (B3R-B1 3): "
            f"{member!r}")

    rel = "/".join(segs[1:])

    # Re-prove the DERIVED string, not the input. _segments() has already
    # dropped "." and empty segments and check_member_name() has already
    # refused "..", so nothing below should ever fire — which is precisely why
    # it is here: the day one of those upstream properties changes, this fails
    # closed instead of silently emitting an escaping target.
    if not rel or not rel.strip():
        raise PackError(
            f"attachment target is empty after normalization (B3R-B1 3): "
            f"{member!r}")
    reason = check_member_name(rel)
    if reason:
        raise PackError(
            f"attachment target is unsafe after normalization (B3R-B1 3): "
            f"{member!r} -> {rel!r}: {reason}")
    return rel


def attachment_target_identity(member):
    """Canonical identity of `member`'s materialization target, for collisions.

    Case-folded because the operator ships on Windows, where `A.md` and `a.md`
    are one file. This is the same law the duplicate-member check already
    applies to whole member names (it lowercases too); applying it to the
    DERIVED target is what closes the alias gap that check cannot see, because
    `attachments/./a.md` and `attachments/a.md` are two different member names
    and only one file.
    """
    return attachment_relative_target(member).lower()


# --- inspection -------------------------------------------------------------

def inspect(pack_path):
    """Validate a pack WITHOUT extracting. Returns the parsed manifest.

    Every 5.5 rejection that can be decided from the archive alone is decided
    here, before any write. Raises PackError with a specific reason; never
    returns a "mostly fine" result.
    """
    p = Path(pack_path)
    if not p.exists():
        raise PackError(f"pack not found: {p}")
    if not p.is_file():
        raise PackError(f"not a file: {p}")
    if not p.name.endswith(PACK_SUFFIX):
        raise PackError(
            f"not a task pack: {p.name!r} — canonical extension is "
            f"<slug>{PACK_SUFFIX} (5.1)")

    if not zipfile.is_zipfile(str(p)):
        raise PackError(f"malformed pack: not a zip archive: {p}")

    try:
        zf = zipfile.ZipFile(str(p))
    except zipfile.BadZipFile as e:
        raise PackError(f"malformed pack: {e}")

    with zf:
        # CRC integrity first — a corrupt archive is not worth analysing.
        try:
            bad = zf.testzip()
        except Exception as e:
            raise PackError(f"malformed pack: cannot read members ({e})")
        if bad is not None:
            raise PackError(f"malformed pack: CRC failure in member {bad!r}")

        infos = zf.infolist()
        if not infos:
            raise PackError("empty pack: no members")
        if len(infos) > MAX_MEMBERS:
            raise PackError(
                f"pack has {len(infos)} members, ceiling is {MAX_MEMBERS} "
                f"(zip-bomb guard)")

        names = [i.filename for i in infos]

        # duplicate members (5.5) — the validator/extractor split attack: we
        # inspect member A, the extractor writes member B with the same name.
        # Rejecting outright is the only honest answer, since "which one is
        # real" has no correct answer.
        seen = set()
        dupes = set()
        for n in names:
            key = n.replace("\\", "/").rstrip("/").lower()
            if key in seen:
                dupes.add(n)
            seen.add(key)
        if dupes:
            raise PackError(
                f"duplicate archive members (5.5): {sorted(dupes)} — refusing: "
                f"the member a validator sees may not be the member an "
                f"extractor writes")

        total = 0
        for i in infos:
            reason = check_member_name(i.filename)
            if reason:
                raise PackError(f"unsafe archive entry: {reason}")

            mode = i.external_attr >> 16
            if stat.S_ISLNK(mode):
                raise PackError(
                    f"symlink entry (5.5): {i.filename!r} — a link can point "
                    f"anywhere, including outside the root")
            # Reject entries whose type bits say they are something other than
            # a file or directory (fifo, socket, device, block). Note: many zip
            # writers set NO type bits at all (mode 0o600 or 0), which means
            # "unspecified", not "hostile" — treating that as an error would
            # reject virtually every legitimate pack. Only an explicitly odd
            # type is a problem; symlinks are caught above.
            fmt = stat.S_IFMT(mode)
            if fmt and fmt not in (stat.S_IFREG, stat.S_IFDIR):
                raise PackError(
                    f"non-regular archive entry (5.5): {i.filename!r} "
                    f"(type {oct(fmt)}) — only regular files are accepted")

            total += i.file_size
            if i.compress_size > 0:
                ratio = i.file_size / i.compress_size
                if ratio > MAX_COMPRESSION_RATIO:
                    raise PackError(
                        f"compression ratio {ratio:.0f}:1 for {i.filename!r} "
                        f"exceeds {MAX_COMPRESSION_RATIO}:1 (zip-bomb guard)")
        if total > MAX_TOTAL_UNCOMPRESSED:
            raise PackError(
                f"uncompressed size {total} exceeds "
                f"{MAX_TOTAL_UNCOMPRESSED} (zip-bomb guard)")

        files = [i for i in infos if not i.filename.endswith("/")]

        # 5.2/5.5 — top-level shape
        for i in files:
            segs = _segments(i.filename)
            low = segs[-1].lower()
            if low in PROHIBITED_NAMES or low.endswith(PROHIBITED_SUFFIXES):
                raise PackError(
                    f"prohibited pack content (5.3): {i.filename!r} — this "
                    f"record is LOCAL and is created only after validation")
            if low.endswith(EXECUTABLE_SUFFIXES):
                raise PackError(
                    f"executable payload (5.3): {i.filename!r} — a pack is "
                    f"intent and scope, never code to run")

        if MANIFEST_NAME not in [n.replace("\\", "/") for n in names]:
            raise PackError(f"pack is missing {MANIFEST_NAME} (5.2)")

        # --- manifest ---
        try:
            raw = zf.read(MANIFEST_NAME)
        except KeyError:
            raise PackError(f"pack is missing {MANIFEST_NAME} (5.2)")
        try:
            manifest = json.loads(raw.decode("utf-8"))
        except UnicodeDecodeError as e:
            raise PackError(f"malformed JSON: {MANIFEST_NAME} is not UTF-8 ({e})")
        except json.JSONDecodeError as e:
            raise PackError(f"malformed JSON in {MANIFEST_NAME}: {e}")
        if not isinstance(manifest, dict):
            raise PackError(
                f"malformed JSON: {MANIFEST_NAME} must be an object")

        handoff_name = manifest.get("handoff")
        declared = {MANIFEST_NAME}
        if isinstance(handoff_name, str) and handoff_name:
            declared.add(handoff_name.replace("\\", "/"))

        # Verify the declared handoff EXISTS before sweeping for unknown files.
        # Ordering matters for honesty: if the manifest points at a missing
        # handoff, "unknown file: handoff.md" is a true statement that sends the
        # operator hunting the wrong problem. Report the actual cause.
        if isinstance(handoff_name, str) and handoff_name:
            if handoff_name.replace("\\", "/") not in [
                    n.replace("\\", "/") for n in names]:
                raise PackError(
                    f"manifest declares handoff {handoff_name!r} but the pack "
                    f"does not contain it")

        # unknown top-level files (5.5) — everything must be manifest.json, the
        # declared handoff, or inside attachments/.
        for i in files:
            n = i.filename.replace("\\", "/")
            if n in declared:
                continue
            segs = _segments(n)
            if segs and segs[0] == ATTACHMENTS_DIR and len(segs) > 1:
                continue
            raise PackError(
                f"unknown file in pack (5.5): {n!r}\n"
                f"  A pack may contain: {MANIFEST_NAME}, the handoff declared "
                f"in the manifest, and {ATTACHMENTS_DIR}/ (5.2).")

        # more than one handoff (5.5) — any top-level .md that is not THE
        # declared handoff is a second handoff.
        top_md = [i.filename for i in files
                  if len(_segments(i.filename)) == 1
                  and i.filename.lower().endswith(".md")]
        extra_md = [n for n in top_md if n.replace("\\", "/") not in declared]
        if extra_md:
            raise PackError(
                f"more than one handoff (5.5): {sorted(extra_md)} alongside "
                f"{handoff_name!r} — a pack carries exactly one task")

        # manifest schema
        schema = wrkparse.load_schema(_schemas_dir(), "wrkpack")
        errs = wrkparse.validate_against_schema(manifest, schema)
        if errs:
            raise PackError(
                f"{MANIFEST_NAME} fails wrkpack.schema.json:\n  - "
                + "\n  - ".join(errs))

        reason = check_member_name(manifest["handoff"])
        if reason:
            raise PackError(f"manifest declares an unsafe handoff path: {reason}")
        if manifest["handoff"].replace("\\", "/") not in [
                n.replace("\\", "/") for n in names]:
            raise PackError(
                f"manifest declares handoff {manifest['handoff']!r} but the "
                f"pack does not contain it")

        for att in manifest.get("attachments", []):
            r = check_member_name(att)
            if r:
                raise PackError(f"manifest declares an unsafe attachment: {r}")
            if att.replace("\\", "/") not in [n.replace("\\", "/") for n in names]:
                raise PackError(
                    f"manifest declares attachment {att!r} but the pack does "
                    f"not contain it")

        # hashes (5.4) — verify what the manifest claims. A hash that is
        # declared and wrong is a louder problem than no hash at all.
        for member, expected in (manifest.get("hashes") or {}).items():
            r = check_member_name(member)
            if r:
                raise PackError(f"manifest hashes an unsafe path: {r}")
            try:
                data = zf.read(member)
            except KeyError:
                raise PackError(
                    f"manifest hashes {member!r} but the pack does not "
                    f"contain it")
            if not isinstance(expected, str):
                raise PackError(
                    f"manifest hash for {member!r} is not a string")
            got = hashlib.sha256(data).hexdigest()
            if got.lower() != expected.strip().lower():
                raise PackError(
                    f"hash mismatch for {member!r} (5.4):\n"
                    f"  manifest: {expected}\n"
                    f"  actual:   {got}\n"
                    f"  The pack does not contain what it claims to contain.")

        # required_reads (B3R-A contract 2.1) — machine-declared mandatory
        # authority. Every member must ALSO be a declared attachment (so it
        # inherits that existence check above), live under attachments/, be
        # unique, pass the same name-safety law as everything else, and carry
        # an explicit hashes entry (so it inherits the hash-verification loop
        # above too). This block adds no new trust path; it only requires that
        # required_reads be a subset of what the existing attachment/hash
        # machinery already proved.
        attachments_norm = {a.replace("\\", "/")
                            for a in manifest.get("attachments", [])}
        hashes_map = manifest.get("hashes") or {}
        seen_required = set()
        for rr in manifest.get("required_reads", []):
            r = check_member_name(rr)
            if r:
                raise PackError(
                    f"manifest declares an unsafe required_read (B3R-A "
                    f"2.1.4): {r}")
            norm = rr.replace("\\", "/")
            if norm in seen_required:
                raise PackError(
                    f"duplicate required_read (B3R-A 2.1.3): {rr!r} — each "
                    f"required read must be declared exactly once")
            seen_required.add(norm)
            segs = _segments(norm)
            if not (segs and segs[0] == ATTACHMENTS_DIR and len(segs) > 1):
                raise PackError(
                    f"required_read must live under {ATTACHMENTS_DIR}/ "
                    f"(B3R-A 2.1.2): {rr!r}")
            if norm not in attachments_norm:
                raise PackError(
                    f"required_read {rr!r} is not declared in manifest "
                    f"attachments (B3R-A 2.1.1) — every required read must "
                    f"also be a declared attachment")
            if norm not in hashes_map:
                raise PackError(
                    f"required_read {rr!r} has no entry in manifest hashes "
                    f"(B3R-A 2.1.5) — required reads must be hash-pinned, "
                    f"not merely present")

        # attachment target collisions (B3R-B1 2/4/5) — the uniqueness test
        # above compares manifest STRINGS, and two distinct strings can name
        # one file. When a pack declares required_reads it is declaring machine
        # authority, so identity moves to the materialization target: no two
        # attachment declarations may map to the same one.
        #
        # EVERY declared attachment participates, not just the required-read
        # entries. required_reads is a proven subset of attachments (2.1.1
        # above), so an ordinary attachment aliasing a required read would
        # otherwise be staged last and silently overwrite the authority it
        # shadows — exactly the last-write-wins collapse this batch exists to
        # close. Rejecting here means rejecting BEFORE cmd_start opens its
        # transaction: nothing is staged, so there is no authority residue to
        # clean up.
        #
        # Scoped deliberately to authority-declaring packs. An ordinary pack's
        # aliases remain tolerated as they were before B3R-A (inherited
        # behaviour, no authority at stake). For a pack that DOES declare
        # required_reads this may reject shapes 1.8.2 previously accepted;
        # per contract §4 that is intended hardening, not a compatibility
        # break.
        if manifest.get("required_reads"):
            by_target = {}
            for att in manifest.get("attachments", []):
                key = attachment_target_identity(att)
                first = by_target.get(key)
                if first is not None:
                    raise PackError(
                        f"attachment target collision (B3R-B1 2/4): {first!r} "
                        f"and {att!r} both materialize to "
                        f"{attachment_relative_target(att)!r}\n"
                        f"  This pack declares required_reads, so an "
                        f"attachment's identity is the file it becomes, not "
                        f"the string that names it.\n"
                        f"  Two names for one authority file cannot be told "
                        f"apart after materialization; the pack is refused "
                        f"rather than resolved last-write-wins.")
                by_target[key] = att

        # 5.5 — handoff identity must match the manifest
        try:
            htext = zf.read(manifest["handoff"]).decode("utf-8")
        except UnicodeDecodeError as e:
            raise PackError(f"handoff is not valid UTF-8 ({e})")
        try:
            fields, _body = wrkparse.parse_front_matter(htext)
        except wrkparse.ParseError as e:
            raise PackError(f"handoff is unparseable: {e}")

        hschema = wrkparse.load_schema(_schemas_dir(), "handoff")
        herrs = wrkparse.validate_against_schema(fields, hschema)
        if herrs:
            raise PackError(
                "handoff fails handoff.schema.json:\n  - " + "\n  - ".join(herrs))

        if fields.get("task_id") != manifest["task_id"]:
            raise PackError(
                f"mismatched task ID (5.5): manifest says "
                f"{manifest['task_id']!r}, handoff says "
                f"{fields.get('task_id')!r}")
        if fields.get("slug") != manifest["slug"]:
            raise PackError(
                f"mismatched slug (5.5): manifest says {manifest['slug']!r}, "
                f"handoff says {fields.get('slug')!r}")

        # 5.1 — the filename carries the slug; a mismatch means the operator is
        # not looking at the pack they think they are.
        stem = p.name[:-len(PACK_SUFFIX)]
        if stem != manifest["slug"]:
            raise PackError(
                f"pack filename {p.name!r} does not match manifest slug "
                f"{manifest['slug']!r} — expected {manifest['slug']}{PACK_SUFFIX}")

    return manifest


def _schemas_dir():
    import os
    d = os.environ.get("CCOS_SCHEMAS_DIR", "").strip()
    if d:
        return d
    return str(Path(__file__).resolve().parent.parent / "schemas")


# --- extraction -------------------------------------------------------------

def extract_members(pack_path, dest_root, members):
    """Extract named members under `dest_root`, proving containment per member.

    Only ever called AFTER inspect() has passed. Does not use extractall():
    we resolve and write every path ourselves so that containment is something
    we verified, not something we hope CPython did for us.

    Returns {member_name: written Path}.
    """
    dest_root = Path(dest_root).resolve()
    written = {}
    with zipfile.ZipFile(str(pack_path)) as zf:
        for m in members:
            reason = check_member_name(m)
            if reason:
                raise PackError(f"refusing to extract: {reason}")
            target = _resolve_within(dest_root, m)
            data = zf.read(m)
            target.parent.mkdir(parents=True, exist_ok=True)
            with open(target, "wb") as fh:
                fh.write(data)
            written[m] = target
    return written


def read_member(pack_path, member):
    """Read one member's bytes, with the same name checks as extraction."""
    reason = check_member_name(member)
    if reason:
        raise PackError(f"refusing to read: {reason}")
    with zipfile.ZipFile(str(pack_path)) as zf:
        return zf.read(member)


# --- inbox selection --------------------------------------------------------

def resolve_inbox(inbox_dir, selector=None):
    """Resolve a pack from the inbox. Raises on ambiguity (5.5).

    `selector` None or "latest" means "pick for me" — which is exactly the
    request we must refuse when there is more than one candidate. Guessing here
    would activate the wrong task with a straight face, and the operator would
    have no way to know until the work was done.
    """
    d = Path(inbox_dir)
    if not d.exists():
        raise PackError(f"inbox not found: {d}")
    packs = sorted(p for p in d.glob(f"*{PACK_SUFFIX}") if p.is_file())

    if selector and selector not in ("latest", "-"):
        cand = d / selector
        if not cand.exists():
            raise PackError(f"pack not found in inbox: {selector}")
        return cand

    if not packs:
        raise PackError(f"no {PACK_SUFFIX} found in {d}")
    if len(packs) > 1:
        names = "\n".join(f"    - {p.name}" for p in packs)
        raise PackError(
            f"ambiguous 'latest': {len(packs)} packs in the inbox (5.5):\n"
            f"{names}\n"
            f"  Name the pack explicitly. Picking by mtime would activate a "
            f"task you did not choose.")
    return packs[0]
