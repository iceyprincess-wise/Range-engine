#!/usr/bin/env python3
"""Range-engine round 7 follow-up — M20: prematch shooting enrichment per side.

HEAD: 08fae32 "Matter" (branch main).
Applies the fix Ed approved ("do whats best") for the live prematch run
2026-11-07 18:17 WAT, where the away side's shooting block came back all
null while home showed FT 80.8% / 3PT 35.6% / FG 49.2%.

  M20 prematch.ts: enrichStats was called ONCE with the home+away games
      concatenated and a SHARED cap of 3. Home games come first in that
      list, so all 3 enrichment slots went to home games and the away
      side never got any stats -> teamShooting(away) returned
      statGames 0 and every percentage null. Fix: enrich up to 3 games
      PER SIDE (two calls, max 6 fetches). The quota guard inside
      enrichStats (skip when remaining < 10) still applies to each call,
      and stats are cached in the warehouse (store.stats persists), so
      the extra fetches are paid once per game, not once per prematch.

Precondition: clean tree on main at 08fae32 (stop the api-server first,
or `git restore artifacts/api-server/data/quota.json` if the running
server rewrote it — the live data files are still tracked at this HEAD;
see the untrack steps in the chat, which run AFTER this patch is
committed). WarehousePage is not touched by this patch.
"""
import os
import subprocess
import sys

EXPECTED_HEAD = "0a0fc4d7033001b6edb223912951f8e73c3813c7"

results = []


def record(name, ok, detail=""):
    results.append((name, ok, detail))
    print(f"[{'PASS' if ok else 'FAIL'}] {name} -- {detail}")


def sh(args):
    return subprocess.run(args, capture_output=True, text=True)


def read(rel):
    with open(rel, "r", encoding="utf-8") as f:
        return f.read()


def write(rel, text):
    with open(rel, "w", encoding="utf-8") as f:
        f.write(text)


def replace_exact(rel, old, new, name):
    text = read(rel)
    n = text.count(old)
    if n == 0:
        record(name, False, f"target not found in {rel}")
    if n > 1:
        record(name, False, f"target ambiguous in {rel} ({n} matches)")
    write(rel, text.replace(old, new, 1))
    record(name, True, rel)


def assert_present(rel, patterns, name):
    text = read(rel)
    missing = [p for p in patterns if p not in text]
    record(name, not missing, rel if not missing else f"missing in {rel}: {missing}")


def assert_absent(rel, patterns, name):
    text = read(rel)
    found = [p for p in patterns if p in text]
    record(name, not found, rel if not found else f"still present in {rel}: {found}")


def preconditions():
    r = sh(["git", "rev-parse", "--show-toplevel"])
    root = r.stdout.strip()
    if not r.returncode == 0 or not root:
        record("precondition: repo root", False, "not a git repo")
    os.chdir(root)
    record("precondition: repo root", True, root)
    r = sh(["git", "branch", "--show-current"])
    record("precondition: branch", r.stdout.strip() == "main", r.stdout.strip())
    r = sh(["git", "rev-parse", "HEAD"])
    record("precondition: HEAD", r.stdout.strip() == EXPECTED_HEAD, r.stdout.strip())
    r = sh(["git", "status", "--porcelain"])
    dirty = [l for l in r.stdout.splitlines() if not l.endswith(" f.py") and "?? f.py" not in l]
    record("precondition: working tree clean (except untracked f.py)", not dirty, "; ".join(dirty) or "clean")
    targets = ["artifacts/api-server/src/routes/prematch.ts"]
    missing = [t for t in targets if not os.path.exists(t)]
    record("precondition: all target files present", not missing, f"{len(targets)} files" if not missing else f"missing: {missing}")
    record("precondition: WarehousePage untouched by this patch", True, "not in target list")


def m20_enrich_per_side():
    replace_exact(
        "artifacts/api-server/src/routes/prematch.ts",
        """    await enrichStats([...homeGames, ...awayGames], 3);""",
        """    // Per-side enrichment: the old single call capped the SHARED list
    // at 3, and home games come first, so all 3 slots went to home games
    // and the away side never got any stats (proven live 2026-11-07:
    // home shooting statGames 3, away statGames 0, every away percentage
    // null). Enrich up to 3 games PER SIDE instead (max 6 fetches, still
    // guarded by the quota check inside enrichStats). Stats are cached in
    // the warehouse, so the extra fetches are paid once per game, not
    // once per prematch. A home-side fetch failure no longer blocks the
    // away side either (each call breaks independently).
    await enrichStats(homeGames, 3);
    await enrichStats(awayGames, 3);""",
        "M20 prematch enriches stats per side (3 home + 3 away)",
    )


def checks():
    assert_present(
        "artifacts/api-server/src/routes/prematch.ts",
        ["await enrichStats(homeGames, 3);", "await enrichStats(awayGames, 3);",
         "Per-side enrichment"],
        "verify prematch per-side enrich calls",
    )
    assert_absent(
        "artifacts/api-server/src/routes/prematch.ts",
        ["await enrichStats([...homeGames, ...awayGames], 3);"],
        "verify old shared-cap enrich call gone",
    )


def main():
    preconditions()
    m20_enrich_per_side()
    checks()
    failed = [r for r in results if not r[1]]
    print(f"\n{len(results) - len(failed)}/{len(results)} checks passed.")
    if failed:
        print("FAILED — patch NOT fully applied; review the failures above.")
        sys.exit(1)
    print("ALL CHECKS PASSED")
    print("Next: git diff (review) && git add -A && git commit -m \"Range-engine: prematch enriches shooting stats per side\" && git push")
    print("Then (separate commit): untrack the live data files — see chat for the exact commands.")


if __name__ == "__main__":
    main()
