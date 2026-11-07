#!/usr/bin/env python3
"""Range-engine wiring patch (HEAD b160f82e2dd69f3e2e215346d1f12f137b172621, main).

Fixes PROVEN by sandbox investigation against that exact HEAD:
  M1  tsconfig.json                  -- add missing {"path": "./lib/range-engine"}
                                       to "references" (root `tsc --build` silently
                                       skipped the core engine library).
  M2  artifacts/api-server/tsconfig.json
                                     -- add missing {"path": "../../lib/range-engine"}
                                       to "references" (api-server imports
                                       @workspace/range-engine in routes/backtest.ts
                                       but only referenced lib/db and lib/api-zod).
  M3  tsconfig.base.json             -- remove dead compilerOptions.customConditions
                                       ["workspace"]: no workspace or installed
                                       package uses a "workspace" export condition,
                                       so the option resolved nothing.

Usage (in Termux, from the repo root):
    cd ~/projects/Range-engine
    nano f.py          # paste this file
    python3 f.py

Safety:
  * Verifies branch == main and HEAD == EXPECTED_HEAD before any write.
  * Edits are surgical text insertions/deletions on exact anchors, so the
    diff contains ONLY the intended lines (no JSON reformatting noise).
  * Each target file must match the expected ORIGINAL content or the
    already-patched content; anything else aborts that mutation (exit 1,
    no write to that file) instead of guessing.
  * Detects already-applied mutations: re-running is safe, never duplicates.
  * Verifies every mutation by re-parsing the JSON after writing.
  * Never commits, never pushes. You review `git diff`, then commit/push.
  * Optional build check runs only if pnpm + tsc are already installed;
    if the toolchain is absent it is reported UNVERIFIED, not faked as PASS.
"""

import json
import subprocess
import sys
from pathlib import Path

EXPECTED_HEAD = "b160f82e2dd69f3e2e215346d1f12f137b172621"
EXPECTED_BRANCH = "main"

RESULTS = []  # (name, status, detail)


def report(name, status, detail=""):
    RESULTS.append((name, status, detail))
    print(f"[{status}] {name}" + (f" -- {detail}" if detail else ""))


def run(cmd, cwd):
    return subprocess.run(cmd, cwd=str(cwd), capture_output=True, text=True)


def find_repo_root():
    if len(sys.argv) > 1:
        cand = Path(sys.argv[1]).expanduser().resolve()
        if (cand / "tsconfig.json").is_file():
            return cand
        print(f"FAIL: supplied root has no tsconfig.json: {cand}")
        sys.exit(1)
    cwd = Path.cwd().resolve()
    if (cwd / "tsconfig.json").is_file() and (cwd / ".git").exists():
        return cwd
    termux = Path.home() / "projects" / "Range-engine"
    if (termux / "tsconfig.json").is_file():
        return termux
    print("FAIL: could not locate the Range-engine repo root. "
          "Run from ~/projects/Range-engine or pass the root as an argument.")
    sys.exit(1)


def check_preconditions(root):
    ok = True
    r = run(["git", "rev-parse", "--abbrev-ref", "HEAD"], root)
    branch = r.stdout.strip()
    if branch != EXPECTED_BRANCH:
        report("precondition: branch", "FAIL",
               f"expected '{EXPECTED_BRANCH}', got '{branch}'")
        ok = False
    else:
        report("precondition: branch", "PASS", f"on '{branch}'")

    r = run(["git", "rev-parse", "HEAD"], root)
    head = r.stdout.strip()
    if head != EXPECTED_HEAD:
        report("precondition: HEAD", "FAIL",
               f"expected {EXPECTED_HEAD}, got {head}. "
               "This patch was verified against the expected HEAD only; "
               "do not run it on a different revision.")
        ok = False
    else:
        report("precondition: HEAD", "PASS", head)
    return ok


def references_of(path):
    """Return the parsed 'references' path list, or None if unparseable."""
    try:
        data = json.loads(path.read_text(encoding="utf-8"))
    except Exception as exc:  # noqa: BLE001 - reported, not a traceback
        report(f"parse {path.name}", "FAIL", str(exc))
        return None
    refs = data.get("references")
    if not isinstance(refs, list):
        return None
    return [str(item.get("path", "")) for item in refs
            if isinstance(item, dict)]


def add_reference(root, rel_path, anchor_last_path, new_path, label):
    """Surgically append one reference after the entry for anchor_last_path.

    The anchor is the exact original text of the last reference entry, so
    the diff is only the added lines. Already-applied and unexpected
    content are detected from the parsed JSON first.
    """
    path = root / rel_path
    paths = references_of(path)
    if paths is None:
        report(label, "FAIL", f"{rel_path} has no parseable 'references' list")
        return False
    if new_path in paths:
        report(label, "PASS", "already applied (reference already present)")
        return True
    if paths != [p for p in paths if p != new_path] or anchor_last_path not in paths:
        report(label, "FAIL",
               f"unexpected references {paths}; expected last entry "
               f"'{anchor_last_path}' -- refusing to guess")
        return False
    text = path.read_text(encoding="utf-8")
    # Exact anchor: the closing of the last reference object, indented as in
    # the original files (4 spaces for '{', 6 for '"path"', 4 for '}').
    anchor = '    {\n      "path": "%s"\n    }' % anchor_last_path
    if text.count(anchor) != 1:
        report(label, "FAIL",
               f"anchor for '{anchor_last_path}' found {text.count(anchor)} "
               "times (expected exactly 1); refusing to guess")
        return False
    replacement = anchor + ',\n    {\n      "path": "%s"\n    }' % new_path
    path.write_text(text.replace(anchor, replacement, 1), encoding="utf-8")
    after = references_of(path)
    if after is not None and new_path in after and len(after) == len(set(after)):
        report(label, "PASS", f"added {new_path}; references now: {after}")
        return True
    report(label, "FAIL", f"verification failed after write: {after}")
    return False


def remove_custom_conditions(root):
    rel_path = "tsconfig.base.json"
    path = root / rel_path
    try:
        data = json.loads(path.read_text(encoding="utf-8"))
    except Exception as exc:  # noqa: BLE001
        report("M3 tsconfig.base.json customConditions", "FAIL", str(exc))
        return False
    opts = data.get("compilerOptions")
    if not isinstance(opts, dict):
        report("M3 tsconfig.base.json customConditions", "FAIL",
               "no 'compilerOptions' object")
        return False
    if "customConditions" not in opts:
        report("M3 tsconfig.base.json customConditions", "PASS",
               "already applied (customConditions already absent)")
        return True
    if opts["customConditions"] != ["workspace"]:
        report("M3 tsconfig.base.json customConditions", "FAIL",
               f"unexpected value {opts['customConditions']!r}; refusing to guess")
        return False
    text = path.read_text(encoding="utf-8")
    anchor = '    "types": [],\n    "customConditions": ["workspace"]\n'
    if text.count(anchor) != 1:
        report("M3 tsconfig.base.json customConditions", "FAIL",
               f"anchor found {text.count(anchor)} times (expected exactly 1)")
        return False
    path.write_text(text.replace(anchor, '    "types": []\n', 1),
                    encoding="utf-8")
    try:
        check = json.loads(path.read_text(encoding="utf-8"))
    except Exception as exc:  # noqa: BLE001
        report("M3 tsconfig.base.json customConditions", "FAIL", str(exc))
        return False
    if "customConditions" not in check.get("compilerOptions", {}):
        report("M3 tsconfig.base.json customConditions", "PASS",
               "removed dead customConditions ['workspace']")
        return True
    report("M3 tsconfig.base.json customConditions", "FAIL",
           "verification failed after write")
    return False


def optional_build_check(root):
    tsc = root / "node_modules" / ".bin" / "tsc"
    if not tsc.is_file():
        report("build check: tsc --build --dry", "UNVERIFIED",
               "node_modules/.bin/tsc not found (run `pnpm install` then "
               "`pnpm run typecheck` manually)")
        return
    r = run([str(tsc), "--build", "--dry"], root)
    out = (r.stdout + r.stderr).strip()
    if "lib/range-engine/tsconfig.json" in out:
        report("build check: tsc --build --dry", "PASS",
               "range-engine is now in the build graph")
    else:
        report("build check: tsc --build --dry", "FAIL",
               "range-engine still missing from build graph:\n" + out)


def main():
    root = find_repo_root()
    print(f"Repo root: {root}")
    if not check_preconditions(root):
        print("ABORTED: no files were changed.")
        sys.exit(1)

    ok = True
    ok &= add_reference(root, "tsconfig.json", "./lib/api-zod",
                        "./lib/range-engine",
                        "M1 root tsconfig.json reference")
    ok &= add_reference(root, "artifacts/api-server/tsconfig.json",
                        "../../lib/api-zod", "../../lib/range-engine",
                        "M2 api-server tsconfig.json reference")
    ok &= remove_custom_conditions(root)
    optional_build_check(root)

    print("\n--- summary ---")
    for name, status, detail in RESULTS:
        print(f"{status:10} {name}")
    if not ok:
        print("RESULT: FAIL -- see above; review the files, do not commit.")
        sys.exit(1)
    print("RESULT: PASS -- review with `git diff`, then commit/push to main.")
    sys.exit(0)


if __name__ == "__main__":
    main()
