#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
CCOS WRKOPS 1.8.2 — wrkgit (read-only Git observation seam, B2)
==================================================================
B1 answered "where is the governed workspace, and which root authority is
trusted?" (`wrkroot.py`). B2 answers a narrower, different question: given an
explicitly supplied product/Git surface, what Git state exists there? This
module is the single place that observation lives — it does not discover a
wider root, does not persist `PRODUCT_ROOT`, and does not bind a worktree
identity into durable state. Callers supply the path to inspect; every other
batch that needs Git facts imports this instead of shelling out itself.

G1 — SAFETY INVARIANT (no mutation, ever)
------------------------------------------
Every git subprocess reachable from this module is one of exactly eight
read-only invocations (see the exhaustive list in the B2 execution report;
B3A adds the eighth, `rev-parse --git-path info/exclude`, for
`local_exclude_path()`):
  rev-parse --is-inside-work-tree
  rev-parse --git-dir
  rev-parse --git-common-dir
  rev-parse --git-path info/exclude
  rev-parse --abbrev-ref HEAD
  ls-files --error-unmatch --
  check-ignore -v -z --no-index --stdin
  check-ignore -q --no-index --
None of these can create, modify, or delete a commit, ref, index entry,
working-tree file, or config value. No git verb capable of mutation — add,
commit, push, pull, fetch, merge, rebase, reset, checkout, switch, branch,
tag, stash, clean, rm, mv, restore, gc, prune, remote, submodule, worktree
add/remove/move/repair/prune, clone, init, or any `config` write form — is
ever constructed by this module. Git mutation remains OPERATOR-owned
(CLAUDECLI.2.04); `wrkgit` cannot be used to route around that boundary.

G5 — NOT_A_REPO is explicit, not a bare False
-----------------------------------------------
Every function here returns a 3-tuple `(value, status, diagnostic_lines)` —
the same shape `wrkroot.resolve_workspace_root()` already uses, so callers
learn one return convention, not two. `status` is always one of the small
literal strings below; a caller that only inspects `value` can still be
fooled by a falsy result, but a caller that checks `status == NOT_A_REPO`
never mistakes "this directory has no Git" for "this path IS tracked but
happens to evaluate false", "this path IS a repo but the predicate is
False", etc. A non-directory / non-existent query path is `INVALID_QUERY`,
never silently coerced into `NOT_A_REPO`.

  REPO            = "repo"            supplied path is inside a git worktree
  NOT_A_REPO      = "not_a_repo"      confirmed: supplied path is not inside
                                       a git tree (git ran and said so)
  INVALID_QUERY   = "invalid_query"   bad caller input (product_root does
                                       not exist / is not a directory)
  GIT_ERROR       = "git_error"       Git/subprocess/decoding failure that
                                       is NOT the confirmed ordinary no-repo
                                       case (B3A / ITV-B2-04, ITV-B2-05) --
                                       e.g. dubious ownership, a corrupt
                                       repository, permission failure, the
                                       git executable not being invocable,
                                       or output that could not be decoded.
                                       Uncertainty is never reported as
                                       NOT_A_REPO.
  OUTSIDE_REPO    = "outside_repo"    a queried path resolves outside root
  DETACHED        = "detached"        HEAD is not on a branch (branch() only)
  OK              = "ok"              observation succeeded

B3A error-classification law (ITV-B2-04, ITV-B2-05)
-------------------------------------------------------
`is_repo()` distinguishes a *confirmed* ordinary non-repository (git ran,
and its own diagnostic said "not a git repository") from every other
failure shape, which is reported as `GIT_ERROR` instead of being collapsed
into `NOT_A_REPO`. This distinction is made on git's own fatal-message text
rather than on exit code alone, because git also exits non-zero for
dubious-ownership and other failures that are not "no repository here" --
see `_looks_like_not_a_repo()`. Every other public function in this module
that issues its own git invocation after `is_repo()` has already confirmed
`REPO` applies the same rule: a `None`/non-zero result from `_git()` at that
point is a `GIT_ERROR`, never silently reinterpreted as any other status.

Ignore semantics (decision doc §5, contract §4.6/4.7)
-------------------------------------------------------
`ignored_by()` and `excluded()` are deliberately two different questions:
  ignored_by()  — "what rule, if any, decided this path's ignore status?"
                  May return a match whose pattern is a NEGATION (starts
                  with `!`) — that is still the deciding rule, even though
                  a negation means the path is NOT effectively excluded.
  excluded()    — "is this path effectively excluded right now?" A negation
                  match means excluded() is False even though ignored_by()
                  found a matching rule. Collapsing these two into one
                  boolean is exactly the bug the architecture decision
                  forbids (§5, §4.7): a tracked path can simultaneously be
                  tracked() == True and excluded() == True (ignored after
                  being committed), and these are independent facts this
                  module preserves rather than resolves for the caller.
Both use `--no-index` so a TRACKED path's ignore status is still visible —
without it, git treats tracked files as categorically "not excluded"
regardless of matching patterns, which would hide exactly the
tracked-but-now-ignored case the contract requires this module to surface.
`-v -z` on `ignored_by()` gives the machine-parsable form: fields are
NUL-separated (never tab/newline), so a Windows drive-letter path, embedded
spaces, or Unicode in the source file or queried path cannot be misread as a
field boundary the way a naive text split could. Git requires `-z` to be
paired with `--stdin` (an invocation of `-z` without it fails with
`fatal: -z only makes sense with --stdin`, corrective
B2_WRKGIT_CHECK_IGNORE_Z_STDIN_OMISSION) — so the queried path is fed on
stdin, NUL-terminated, instead of passed as a trailing argument; `excluded()`
uses neither `-z` nor `--stdin` and is unaffected. For one queried path on
stdin, git's verbose NUL output is four separate fields — source, line,
pattern, pathname (not a combined `source:line:pattern` header sharing one
field with the pathname, corrective
B2_WRKGIT_CHECK_IGNORE_NUL_FIELD_PARSER_OMISSION) — trimmed of the trailing
empty NUL token and consumed positionally; a successful match whose output
is not exactly four fields is reported as `GIT_ERROR` rather than silently
fabricating a partial `IgnoreMatch`.

Worktree identity (decision doc §6, contract §4.3)
------------------------------------------------------
`worktree_id()` uses the normalized relationship between `git_dir` and
`git_common_dir`, per the decision doc's recommended practical
representation: the main worktree has `git_dir == git_common_dir` (returns
the literal id `"main"`); a linked worktree's `git_dir` is
`<git_common_dir>/worktrees/<name>`, so its id is that relative path
(`worktrees/<name>`) — deterministic for the same Git administrative layout,
distinct per linked worktree, and never derived from the checked-out branch
name (a worktree can change branch without changing identity). This is
observation only: B2 does not write `worktree_id` into any durable state.

Environment isolation (contract §4.8)
----------------------------------------
Every function accepts an optional `env` mapping, passed through verbatim to
the git subprocess, with one deliberate exception: `_git()` always pins
`LC_ALL=C` / `LANGUAGE=C` on top of whatever mapping it is given. This
exists so ITV-B2-04's ordinary-not-a-repo classification (above) never
depends on the caller's, the operator's, or the test's ambient shell locale
accidentally producing an English fatal message — it is pinned on purpose,
deterministically, rather than relied upon by accident. Everything else
(`HOME`/`GIT_CONFIG_GLOBAL`/`GIT_CONFIG_NOSYSTEM` and so on) is still passed
through untouched, so isolated global-ignore testing is unaffected. This
affects only the human-readable language of git's own diagnostic messages,
never path/content bytes, which remain governed by the UTF-8 decoding
contract below, and never command semantics. `wrkgit` itself never reads or
writes global config — it only forwards whatever environment the caller
gives it (default: `os.environ`).

Subprocess / decoding boundary (ITV-B2-05)
----------------------------------------------
`_git()` never raises. An `OSError` (git not on PATH, launch failure), a
`subprocess.SubprocessError`, or a `UnicodeError` decoding git's own output
is caught inside `_git()` and reported to the caller as `None`, exactly like
the pre-existing "git executable could not be invoked" case. Output decoding
itself additionally cannot raise: `_git()` decodes as UTF-8 with
`errors="replace"`, so a byte sequence that is not valid UTF-8 becomes a
safe-to-render replacement character instead of an exception, preserving
the repository-wide UTF-8 invariant while never leaking a decode failure
through a public call. Every public function treats a `None` result from
`_git()` the same way it treats any other post-`is_repo()` git failure: an
explicit `GIT_ERROR`, never a raised exception and never a false
`NOT_A_REPO`.
"""
import os
import subprocess
from dataclasses import dataclass
from pathlib import Path

__version__ = "1.0.0"

REPO = "repo"
NOT_A_REPO = "not_a_repo"
INVALID_QUERY = "invalid_query"
GIT_ERROR = "git_error"
OUTSIDE_REPO = "outside_repo"
DETACHED = "detached"
OK = "ok"


@dataclass(frozen=True)
class IgnoreMatch:
    """The single rule git reports as deciding a queried path's ignore
    status (see module docstring — this may be a NEGATION rule; that does
    not mean the path is excluded, see `excluded()`).

    source_file   the file the deciding pattern lives in (as git reports it:
                  a path relative to the repo for an in-tree .gitignore,
                  `$GIT_DIR/info/exclude` for the exclude file, or an
                  absolute path for an external/global excludesfile).
    source_line   1-based line number within source_file, when git's line
                  field is parseable as an integer; None otherwise (contract
                  4.6 — "source line where available").
    pattern       the raw pattern text, including a leading '!' if it is a
                  negation.
    is_negation   True iff pattern.startswith("!").
    queried_path  the path git matched this rule against, as git echoed it.
    """
    source_file: str
    source_line: int
    pattern: str
    is_negation: bool
    queried_path: str


def _git(root, args, env=None, input_data=None):
    """Run one read-only git invocation rooted at `root`. Returns the
    CompletedProcess, or None if git could not be invoked at all, launching
    it failed, or its output could not be decoded — never raises (ITV-B2-05;
    see module docstring "Subprocess / decoding boundary").

    Pins `LC_ALL`/`LANGUAGE` to `C` on top of whatever `env` is given, so
    `is_repo()`'s classification of git's own fatal text is deterministic
    rather than dependent on the caller's ambient locale (ITV-B2-04; see
    module docstring "Environment isolation"). Decodes stdout/stderr as
    UTF-8 with `errors="replace"` so a non-UTF-8 byte sequence can never
    raise here — it degrades to a safe-to-render replacement character
    instead.

    `input_data`, when given, is fed to the subprocess on stdin (text mode,
    so an embedded NUL is passed through as an ordinary character) — used
    only by `ignored_by()`'s `--stdin` query."""
    e = dict(os.environ if env is None else env)
    e["LC_ALL"] = "C"
    e["LANGUAGE"] = "C"
    cmd = ["git", "-C", str(root)] + list(args)
    try:
        return subprocess.run(cmd, input=input_data, capture_output=True,
                               text=True, encoding="utf-8", errors="replace",
                               env=e)
    except (OSError, subprocess.SubprocessError, UnicodeError):
        return None


def _looks_like_not_a_repo(stderr_text):
    """Deterministic classification of git's plumbing fatal text for the
    ordinary "no repository here" case (contract §A, ITV-B2-04), distinct
    from every other failure shape — dubious ownership, permission denial,
    a corrupt repository, etc. — all of which fall through to `GIT_ERROR`
    instead. Safe to rely on because `_git()` always pins `LC_ALL=C` /
    `LANGUAGE=C`, so this substring is not a function of the caller's shell
    locale."""
    return "not a git repository" in stderr_text.lower()


def _normalize_query_path(root_path, query):
    """Resolve `query` against `root_path`; return the repo-relative path
    (posix-separated, for safe passing to git) or None if it resolves
    outside `root_path` entirely. An outside-repo path is never silently
    reinterpreted as something else (contract 4.5)."""
    q = Path(query)
    if not q.is_absolute():
        q = root_path / q
    try:
        q_resolved = q.resolve(strict=False)
        root_resolved = root_path.resolve(strict=False)
    except OSError:
        return None
    try:
        rel = q_resolved.relative_to(root_resolved)
    except ValueError:
        return None
    return rel


def is_repo(product_root, env=None):
    """Is `product_root` inside a git work tree?

    Returns (is_repo_bool_or_None, status, diagnostic_lines).
    status is REPO, NOT_A_REPO, INVALID_QUERY, or GIT_ERROR (see module
    docstring — "B3A error-classification law"). A dubious-ownership-style
    or other non-confirmed Git failure is GIT_ERROR, never NOT_A_REPO.
    """
    p = Path(product_root)
    if not p.exists() or not p.is_dir():
        return None, INVALID_QUERY, [f"{product_root!r} is not an existing directory"]
    r = _git(p, ["rev-parse", "--is-inside-work-tree"], env)
    if r is None:
        return None, GIT_ERROR, ["git could not be invoked, or its output could not be decoded"]
    if r.returncode == 0:
        if r.stdout.strip() == "true":
            return True, REPO, []
        return False, NOT_A_REPO, ["not inside a git work tree (e.g. a bare repository)"]
    stderr = (r.stderr or "").strip()
    if _looks_like_not_a_repo(stderr):
        return False, NOT_A_REPO, [stderr or "not a git repository"]
    return None, GIT_ERROR, [stderr or f"git rev-parse --is-inside-work-tree exited {r.returncode}"]


def git_dir(product_root, env=None):
    """Absolute `.git` directory for this worktree (contract 4.2).

    Returns (path_or_None, status, diagnostic_lines).
    """
    _, status, diag = is_repo(product_root, env)
    if status != REPO:
        return None, status, diag
    p = Path(product_root)
    r = _git(p, ["rev-parse", "--git-dir"], env)
    if r is None or r.returncode != 0:
        return None, GIT_ERROR, [((r.stderr if r else "git could not be invoked, or its output could not be decoded") or "").strip() or "git rev-parse --git-dir failed"]
    gd = Path(r.stdout.strip())
    if not gd.is_absolute():
        gd = p / gd
    return str(gd.resolve(strict=False)), OK, []


def git_common_dir(product_root, env=None):
    """Absolute administrative common dir shared by all worktrees of this
    repo (contract 4.2). Equal to `git_dir()` for the main worktree; the
    parent of `worktrees/<name>` entries for a linked one.

    Returns (path_or_None, status, diagnostic_lines).
    """
    _, status, diag = is_repo(product_root, env)
    if status != REPO:
        return None, status, diag
    p = Path(product_root)
    r = _git(p, ["rev-parse", "--git-common-dir"], env)
    if r is None or r.returncode != 0:
        return None, GIT_ERROR, [((r.stderr if r else "git could not be invoked, or its output could not be decoded") or "").strip() or "git rev-parse --git-common-dir failed"]
    gcd = Path(r.stdout.strip())
    if not gcd.is_absolute():
        gcd = p / gcd
    return str(gcd.resolve(strict=False)), OK, []


def worktree_id(product_root, env=None):
    """Deterministic worktree identity, derived from the git_dir/
    git_common_dir relationship (contract 4.3; decision doc §6). Never
    derived from the checked-out branch name. Observation only — B2 does
    not bind this into durable state.

    Returns (id_or_None, status, diagnostic_lines).
    """
    gd, gd_status, gd_diag = git_dir(product_root, env)
    if gd_status != OK:
        return None, gd_status, gd_diag
    gcd, gcd_status, gcd_diag = git_common_dir(product_root, env)
    if gcd_status != OK:
        return None, gcd_status, gcd_diag
    gd_p, gcd_p = Path(gd), Path(gcd)
    if gd_p == gcd_p:
        return "main", OK, []
    try:
        rel = gd_p.relative_to(gcd_p)
        return rel.as_posix(), OK, []
    except ValueError:
        return gd_p.as_posix(), OK, [
            "git_dir is not nested under git_common_dir on this layout; "
            "using the resolved git_dir path itself as the worktree identity"]


def branch(product_root, env=None):
    """Current branch name, read-only. Detached HEAD is returned as the
    explicit DETACHED sentinel — never confused with NOT_A_REPO or None
    (contract 4.4).

    Returns (name_or_DETACHED_or_None, status, diagnostic_lines).
    """
    _, status, diag = is_repo(product_root, env)
    if status != REPO:
        return None, status, diag
    p = Path(product_root)
    r = _git(p, ["rev-parse", "--abbrev-ref", "HEAD"], env)
    if r is None or r.returncode != 0:
        return None, GIT_ERROR, [((r.stderr if r else "git could not be invoked, or its output could not be decoded") or "").strip() or "git rev-parse --abbrev-ref HEAD failed"]
    name = r.stdout.strip()
    if name == "HEAD":
        return DETACHED, OK, []
    return name, OK, []


def tracked(product_root, path, env=None):
    """Is `path` tracked in the index? (contract 4.5)

    Returns (bool_or_None, status, diagnostic_lines). status is
    OUTSIDE_REPO if `path` does not resolve inside `product_root` — it is
    never silently reinterpreted as a repo-relative path.
    """
    _, status, diag = is_repo(product_root, env)
    if status != REPO:
        return None, status, diag
    p = Path(product_root)
    rel = _normalize_query_path(p, path)
    if rel is None:
        return None, OUTSIDE_REPO, [f"{path!r} does not resolve to a path inside {product_root!r}"]
    r = _git(p, ["ls-files", "--error-unmatch", "--", rel.as_posix()], env)
    if r is None:
        return None, GIT_ERROR, ["git could not be invoked, or its output could not be decoded"]
    if r.returncode == 0:
        return True, OK, []
    if r.returncode == 1:
        return False, OK, []
    return None, GIT_ERROR, [(r.stderr or "").strip() or f"git ls-files --error-unmatch exited {r.returncode}"]


def ignored_by(product_root, path, env=None):
    """The deciding ignore rule for `path`, if any (contract 4.6). May be a
    negation — see module docstring for why that is not the same as
    `excluded() == False` being absent.

    Returns (IgnoreMatch_or_None, status, diagnostic_lines). `value` is
    None with status OK when no rule matched at all (path is not mentioned
    by any ignore rule, positive or negated).
    """
    _, status, diag = is_repo(product_root, env)
    if status != REPO:
        return None, status, diag
    p = Path(product_root)
    rel = _normalize_query_path(p, path)
    if rel is None:
        return None, OUTSIDE_REPO, [f"{path!r} does not resolve to a path inside {product_root!r}"]
    r = _git(p, ["check-ignore", "-v", "-z", "--no-index", "--stdin"], env,
             input_data=rel.as_posix() + "\x00")
    if r is None:
        return None, GIT_ERROR, ["git could not be invoked, or its output could not be decoded"]
    if r.returncode not in (0, 1):
        return None, GIT_ERROR, [(r.stderr or "").strip() or f"git check-ignore exited {r.returncode}"]
    fields = r.stdout.split("\x00")
    while fields and fields[-1] == "":
        fields.pop()
    if not fields:
        return None, OK, []
    if len(fields) != 4:
        return None, GIT_ERROR, [
            "malformed 'check-ignore -v -z --stdin' output: expected 4 "
            f"NUL-separated fields (source, line, pattern, pathname), got "
            f"{len(fields)}: {fields!r}"]
    source_file, line_field, pattern, pathname = fields
    try:
        source_line = int(line_field)
    except ValueError:
        source_line = None
    match = IgnoreMatch(source_file=source_file, source_line=source_line,
                         pattern=pattern, is_negation=pattern.startswith("!"),
                         queried_path=pathname)
    return match, OK, []


def excluded(product_root, path, env=None):
    """Is `path` EFFECTIVELY excluded right now (contract 4.7)? This is the
    final verdict after negation is applied — independent of `tracked()`,
    and independent of whether `ignored_by()` found a (possibly negated)
    matching rule.

    Returns (bool_or_None, status, diagnostic_lines).
    """
    _, status, diag = is_repo(product_root, env)
    if status != REPO:
        return None, status, diag
    p = Path(product_root)
    rel = _normalize_query_path(p, path)
    if rel is None:
        return None, OUTSIDE_REPO, [f"{path!r} does not resolve to a path inside {product_root!r}"]
    r = _git(p, ["check-ignore", "-q", "--no-index", "--", rel.as_posix()], env)
    if r is None:
        return None, GIT_ERROR, ["git could not be invoked, or its output could not be decoded"]
    if r.returncode not in (0, 1):
        return None, GIT_ERROR, [(r.stderr or "").strip() or f"git check-ignore exited {r.returncode}"]
    return (r.returncode == 0), OK, []


def local_exclude_path(product_root, env=None):
    """Effective repository-common local exclude file for `product_root`
    (contract §C; decision doc §5 "worktree law"). Read-only.

    Resolves via git's own path resolver, `git rev-parse --git-path
    info/exclude`, and never derives the path manually from `git_dir()` —
    for a linked worktree, git resolves this under `GIT_COMMON_DIR`
    (repository-common), not the worktree-specific `GIT_DIR`, and a manual
    `git_dir()`-based join would get that wrong.

    Returns (absolute_path_or_None, status, diagnostic_lines). status is
    REPO's failure statuses passed through, or GIT_ERROR if git could not
    resolve the path.
    """
    _, status, diag = is_repo(product_root, env)
    if status != REPO:
        return None, status, diag
    p = Path(product_root)
    r = _git(p, ["rev-parse", "--git-path", "info/exclude"], env)
    if r is None or r.returncode != 0:
        return None, GIT_ERROR, [((r.stderr if r else "git could not be invoked, or its output could not be decoded") or "").strip() or "git rev-parse --git-path info/exclude failed"]
    raw = r.stdout.strip()
    if not raw:
        return None, GIT_ERROR, ["git rev-parse --git-path info/exclude produced no output"]
    ep = Path(raw)
    if not ep.is_absolute():
        ep = p / ep
    return str(ep.resolve(strict=False)), OK, []
