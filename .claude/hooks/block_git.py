#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
CCOS WRKOPS 1.8 — block-git (PreToolUse, matcher: Bash)
=======================================================
Deterministic git-mutation gate. settings.json holds the static deny-list;
this hook exists for the part that needs LOGIC rather than a flat pattern:

  CLAUDECLI.2.04  no git mutations (add/commit/push/branch/merge/rebase/stash…)
  PATCH.8.01 / WRKOPS.10.04  no commit without an APPLY verdict

Why a hook and not only settings.json: git verbs appear mid-command, chained
with && or ;, and aliased. A flat deny pattern misses `foo && git commit`.
This parses every segment. Read-only git (status/diff/log/show) stays allowed
so the session can still inspect state (CLAUDECLI permits read-only).

The APPLY-gate is intentionally conservative: commits are BLOCKED here on
principle because in CCOS the operator — never CC — commits (KAIA doctrine:
operator-only git). The .md fallback explains the verdict flow for the human.

  exit 0 : allow     exit 2 : BLOCK     (never exit 1)

Env:
  CCOS_ALLOW_READONLY_GIT   "1" (default) keeps status/diff/log/show allowed

1.8.2 — B2 corrective (architecture decision A06 / tracker F-0018)
--------------------------------------------------------------------
Four defects closed here, all in the verb-scanner's reach through the
command line, not in the allow/deny policy shape:

  1. `git config` was blanket-allowed as READONLY. Every form — including
     `--local` writes — is now blocked. This batch does not try to
     distinguish a read-only `--get` from a mutating `--set`/`--unset`
     mode; the conservative rule is to block `config` outright (decision
     doc §4, "Required corrections").
  2. `git worktree ...` was blanket-MUTATING, which also blocked the
     read-only `git worktree list` a caller needs to observe worktree
     topology (`wrkgit.worktree_id`'s administrative-layout reasoning
     depends on being able to run this without going through Claude Code's
     own gate — but scripts a session runs FOR ITSELF still go through this
     hook, so the carve-out has to exist here too). `worktree list` (with
     or without `--porcelain`/`-z`) is now allowed; every other `worktree`
     subcommand (add/remove/move/prune/repair/lock/unlock) stays blocked.
  3. `git check-ignore` is now allowed read-only — the primitive `wrkgit`
     recommends for ignore-rule observation.
  4. The verb scanner walked past leading `-`-prefixed tokens looking for
     the first non-flag token and called THAT the subcommand. For
     `git -C <path> status`, `-C` is correctly skipped as a flag, but its
     OWN ARGUMENT (`<path>`) does not start with `-` either, so the old
     scanner returned the path itself as the "verb" — never recognizing
     `status`, and never recognizing a mutating verb hiding behind `-C`
     either. `git_calls()` below (renamed by the ITV corrective further
     down; same global-option logic) now knows which global options consume a
     following argument (`-C`, `-c`, `--git-dir`, `--work-tree`,
     `--namespace`, `--exec-path`, in both `--opt value` and `--opt=value`
     form) and skips exactly that argument, not the next bare token.
     Quoted arguments with embedded spaces are tokenized whole (see
     `tokenize()`) so `git -C "path with spaces" status` parses the same
     way `git -C /no/spaces status` does.

1.8.2 — B2 ITV corrective (ITV-B2-01 / ITV-B2-03, decision v0.1)
--------------------------------------------------------------------
The independent ITV reproduced a live mutation bypass in the batch above:
a read-only git verb on one physical line laundered a mutating verb on a
later line of the SAME Bash tool call, e.g. `git status\ngit push origin
main` exited 0. Two upstream defects, both pre-existing and unchanged by
the B2 A06 batch, combined to cause it:

  1. `segments()` split on `&&`/`||`/`;`/`|`/`&` but never on `\n`/`\r`, so
     a multi-line command arrived as a single segment.
  2. the scanner returned on the FIRST recognized git token in a segment,
     so even within one segment only one verb was ever classified.

Fixed here, properties only, no policy-shape change:

  P1. `segments()` now also splits on `\r\n`, bare `\r`, and bare `\n`.
      Every physical line is its own segment, so a read-only line can
      never launder a mutating line that follows it in the same call.
  P2. `git_calls()` (formerly `git_call()`, singular-return) now yields
      EVERY recognized git invocation in a segment, not just the first,
      and `main()` classifies each one — any single mutating/unknown
      occurrence denies the whole Bash call, no matter how many other git
      invocations in the same segment are read-only.
  P3. Git-executable recognition is now one normalization helper,
      `_is_git_executable()`: case-insensitive, and symmetric across
      `/` vs `\\` path separators and the optional `.exe` suffix — so
      `GIT`, `C:\\Git\\bin\\git`, `C:\\Git\\bin\\git.exe`, and
      `/usr/bin/git.exe` are all recognized alike (previously only a
      trailing `/git`, `\\git.exe`, or the bare literals `git`/`git.exe`
      were caught; `\\git` with no `.exe`, `/git.exe`, and any
      case-varied form all evaded the old predicate).
"""
import sys, os, json, re

EXIT_ALLOW, EXIT_BLOCK = 0, 2

MUTATING = {
    "add", "commit", "push", "pull", "fetch", "merge", "rebase", "reset",
    "revert", "cherry-pick", "stash", "branch", "checkout", "switch",
    "tag", "clean", "rm", "mv", "am", "apply", "restore", "gc", "prune",
    "remote", "submodule", "clone", "init",
}
# "config" and "worktree" are NOT in either set below — B2 gives both a
# dedicated policy branch in main() because neither is a flat allow/deny:
# config is unconditionally blocked regardless of allow_ro, and worktree is
# allowed only for its read-only "list" subcommand.
READONLY = {"status", "diff", "log", "show", "blame", "ls-files",
            "rev-parse", "describe", "shortlog", "reflog", "check-ignore"}

# Git global options that consume the NEXT token as their argument (so that
# argument must never be mistaken for the git subcommand). Long forms are
# also recognized in the attached "--opt=value" shape, which needs no extra
# token to skip.
GLOBAL_OPTS_WITH_ARG = {"-C", "-c", "--git-dir", "--work-tree", "--namespace",
                         "--exec-path"}


def die(reason: str):
    sys.stderr.write("[block-git BLOCK] " + reason + "\n")
    print(json.dumps({"hookSpecificOutput": {
        "hookEventName": "PreToolUse",
        "permissionDecision": "deny",
        "permissionDecisionReason": reason,
    }}))
    sys.exit(EXIT_BLOCK)


def segments(cmd: str):
    """Split a shell line into command segments on && ; | & separators, and
    on \\r\\n / \\r / \\n (B2 ITV corrective P1) — a physical line boundary
    is a command boundary for classification purposes, so a read-only verb
    on one line can never launder a mutating verb on a later line of the
    same Bash tool call."""
    return [s.strip() for s in re.split(r"&&|\|\||;|\||&|\r\n|\r|\n", cmd) if s.strip()]


def tokenize(seg: str):
    """Whitespace-split `seg` into tokens, treating a "..."/'...' run as one
    token with the quotes stripped. No escape processing — this is only
    good enough to locate the git global-option arguments correctly; the
    shell's own quoting semantics are not this gate's problem, only not
    getting fooled by them is."""
    toks = []
    i, n = 0, len(seg)
    while i < n:
        while i < n and seg[i].isspace():
            i += 1
        if i >= n:
            break
        if seg[i] in "\"'":
            q = seg[i]
            j = seg.find(q, i + 1)
            if j == -1:
                toks.append(seg[i + 1:])
                i = n
            else:
                toks.append(seg[i + 1:j])
                i = j + 1
        else:
            j = i
            while j < n and not seg[j].isspace():
                j += 1
            toks.append(seg[i:j])
            i = j
    return toks


def _is_git_executable(tok: str) -> bool:
    """True if `tok` names the git executable (B2 ITV corrective P3).
    Case-insensitive and symmetric across `/` vs `\\` path separators and
    the optional `.exe` suffix, so `git`, `GIT`, `git.exe`, `.../git`,
    `...\\git`, `.../git.exe`, and `...\\git.exe` are all recognized alike
    — normalization over asymmetric suffix special cases, as required."""
    t = tok.strip().strip("\"'").lower().replace("\\", "/")
    if not t:
        return False
    base = t.rsplit("/", 1)[-1]
    return base in ("git", "git.exe")


def git_calls(seg: str):
    """Yield every recognized git invocation in a segment (B2 ITV corrective
    P2 — the scanner no longer stops after the first one), walking past Git
    global options for each (notably `-C <path>`, whose argument must never
    be mistaken for the subcommand — B2 A06). Yields:
      ("", [])        bare `git` (only global options, no subcommand);
      (verb, rest)    verb lowercased, rest = the tokens that followed it,
                      unquoted (used to look at e.g. `worktree`'s own
                      subcommand).
    Yields nothing if `seg` contains no recognized git invocation.
    """
    toks = tokenize(seg)
    n = len(toks)
    i = 0
    while i < n:
        if not _is_git_executable(toks[i]):
            i += 1
            continue
        j = i + 1
        while j < n:
            cur = toks[j]
            if cur in GLOBAL_OPTS_WITH_ARG:
                j += 2  # skip the option AND its argument
                continue
            if "=" in cur and cur.split("=", 1)[0] in GLOBAL_OPTS_WITH_ARG:
                j += 1  # attached "--opt=value" form, no extra token
                continue
            if cur.startswith("-"):
                j += 1  # an ordinary flag, no argument to skip
                continue
            break
        if j < n:
            yield toks[j].lower(), toks[j + 1:]
            i = j + 1
        else:
            yield "", []  # bare 'git' — only global options were present
            i = j


def worktree_subverb(rest):
    """First non-flag token following `git worktree`, lowercased; "" if
    none was given (`git worktree` alone is not the allowed `list` form)."""
    for r in rest:
        if not r.startswith("-"):
            return r.lower()
    return ""


def main():
    try:
        data = json.load(sys.stdin)
    except Exception:
        die("could not parse PreToolUse input JSON")
    if not isinstance(data, dict):
        die("PreToolUse input is not a JSON object")

    if data.get("tool_name") != "Bash":
        sys.exit(EXIT_ALLOW)

    cmd = (data.get("tool_input", {}) or {}).get("command", "") or ""
    if "git" not in cmd.lower():
        sys.exit(EXIT_ALLOW)

    allow_ro = os.environ.get("CCOS_ALLOW_READONLY_GIT", "1") == "1"

    for seg in segments(cmd):
        for verb, rest in git_calls(seg):
            if verb == "":
                continue  # bare `git` (global options only) — nothing to gate

            if verb == "config":
                die("B2 A06 / CLAUDECLI.2.04 — 'git config' is blocked in every "
                    "form, including read-only '--get' — this batch does not "
                    "distinguish read-only config modes from mutating ones, so "
                    f"config stays blocked outright. segment: `{seg}`")

            if verb == "worktree":
                sub = worktree_subverb(rest)
                if sub == "list":
                    continue
                die(f"CLAUDECLI.2.04 — 'git worktree {sub or '<unspecified>'}' is "
                    f"blocked; only the read-only 'git worktree list' form is "
                    f"allowed (B2 A06). segment: `{seg}`")

            if verb in READONLY and allow_ro:
                continue
            if verb == "commit":
                die("PATCH.8.01 / WRKOPS.10.04 — commits belong to the operator, "
                    "and never occur without an APPLY verdict. CC does not commit. "
                    f"segment: `{seg}`")
            if verb in MUTATING:
                die(f"CLAUDECLI.2.04 — git mutation '{verb}' is forbidden; git "
                    f"operations belong to the operator. segment: `{seg}`")
            # unknown git verb -> conservative block
            die(f"CLAUDECLI.2.04 — unrecognized git subcommand '{verb}' blocked "
                f"by default (git mutations belong to the operator). segment: `{seg}`")

    sys.exit(EXIT_ALLOW)


if __name__ == "__main__":
    main()
