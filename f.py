#!/usr/bin/env python3
"""
Range-engine round 12 patch — run in Termux:  python3 f.py

Fixes (all proven on HEAD ba04e6d, sandbox-traced 2026-11-10):
  D-2026-11-10-01  D-05's corrupt-inbox fix was server-side only:
                   GET /v1/hybrid/inbox returns parseError:true with
                   total 0 (proven live: corrupt file -> HTTP 200,
                   parseError true, total 0), but HybridPage's
                   InboxData had no parseError field, so loadInbox
                   rendered total 0 as "Inbox is empty". The page now
                   carries parseError, shows a red corrupt-inbox
                   banner, and hides the empty message while corrupt.
                   Import/export keep surfacing the server 500
                   (proven live: both HTTP 500 with the clear error).
  D-2026-11-10-02  Post-midnight tipoffs misclassified as LIVE the
                   evening before: phaseFromClock subtracted two
                   minutes-since-midnight values, so a 01:00 KO seen
                   at 23:50 read as -1370 min -> LIVE / 270 s poll,
                   and the ticker force-refreshed research every
                   270 s (~13 provider calls/hour on a game that had
                   not tipped). Runtime probe on unpatched code:
                   3/6 cases wrong. The fix is DATE-AWARE, not a
                   blind +1440 wrap: minutesToTipoff() takes the
                   fixture date + today's date (tomorrow 01:00 at
                   23:50 today is +70 min -> IDLE, zero calls; a
                   SAME-day 01:00 game at 23:50 tipped 22h50 ago and
                   must stay LIVE, which a blind wrap would have
                   broken). Also fixed in the same pass: a 00:00 KO
                   read as "no tipoff" (tipoffMs 0 is falsy -> IDLE).
                   Applied to tipOffMinutes, the ticker's three
                   nextCountdownSec call sites, the tip label, the
                   history earlyRead creation, the early-entry
                   revalidation watch, and LiveMatrixHub's EARLY
                   READ badge (which uses each entry's own date).

NOT in this patch (still open, no code fix exists for them):
  - referee strictness null (thin banked crew history: data, not code)
  - L2 unverified (tonight's 6 NBA games 01:30-05:00 WAT are the window)
  - "404s not cached": fetchResearchDataCached only saves on success
    and the ticker force-refreshes, so a 404 cycle costs a call — but
    that is transient-failure behaviour, and caching a 404 for a
    not-yet-tipped game would risk staling the tipoff transition.
    The phase fix removes the misclassification that caused the burn.

Discipline: preconditions (repo, branch, HEAD, clean tree) are checked
before any write; every replacement must match exactly once; any FAIL
aborts immediately with a nonzero exit and no further writes.
"""
import subprocess
import sys
from pathlib import Path

EXPECTED_HEAD = "ba04e6d28bdc31ed5120105d4b20e7cf1fca68d9"
failures = []
passes = []


def record(ok, label, detail=""):
    line = ("[PASS] " if ok else "[FAIL] ") + label + ((" -- " + detail) if detail else "")
    print(line)
    (passes if ok else failures).append(label)
    if not ok:
        print("ABORT: a check failed; no further changes will be made.")
        print("Summary so far: %d PASS, %d FAIL" % (len(passes), len(failures)))
        sys.exit(1)


def run(cmd):
    return subprocess.run(cmd, shell=True, capture_output=True, text=True)


def replace_exact(path, old, new, label):
    p = Path(path)
    if not p.is_file():
        record(False, label, "file missing: " + path)
    text = p.read_text(encoding="utf-8")
    count = text.count(old)
    if count != 1:
        record(False, label, "target found %d times (expected exactly 1) in %s" % (count, path))
    updated = text.replace(old, new, 1)
    p.write_text(updated, encoding="utf-8")
    back = p.read_text(encoding="utf-8")
    # Insert-style replacements legitimately keep `old` inside `new`
    # (e.g. a table added above the line it anchors on): expect exactly
    # as many `old` occurrences afterwards as `new` itself carries.
    expected_old_after = new.count(old)
    if new not in back or back.count(old) != expected_old_after:
        record(False, label, "post-write verification failed in " + path)
    record(True, label)


# ---------------- preconditions ----------------
root = Path.cwd()
record((root / "lib/range-engine/src/syncScheduler.ts").is_file()
       and (root / "artifacts/mockup-sandbox/src/components/mockups/range-engine/HybridPage.tsx").is_file(),
       "precondition: repo root", str(root))
branch = run("git rev-parse --abbrev-ref HEAD").stdout.strip()
record(branch == "main", "precondition: branch", branch)
head = run("git rev-parse HEAD").stdout.strip()
record(head == EXPECTED_HEAD, "precondition: HEAD", head[:12])
status = [l for l in run("git status --porcelain").stdout.splitlines() if l.strip()]
dirty = [l for l in status if l.strip() != "?? f.py"]
record(not dirty, "precondition: clean tree (except untracked f.py)", "; ".join(dirty))

# ---------------- D-2026-11-10-02: syncScheduler.ts ----------------
SYNC = "lib/range-engine/src/syncScheduler.ts"
replace_exact(
    SYNC,
    '  if (!tipoffMs) return "IDLE";',
    '  if (tipoffMs == null) return "IDLE";',
    "D-02: computeSyncPhase treats tipoffMs 0 (a 00:00 KO) as a real tipoff, not 'no tipoff'",
)
replace_exact(
    SYNC,
    r'''/** Phase from "HH:MM" wall-clock strings (Rule 1 form fields). */
export function phaseFromClock(koTime: string | null | undefined, currentTime: string | null | undefined): SyncPhase {
  if (!koTime || !currentTime) return "IDLE";
  const [kH, kM] = koTime.split(":").map(Number);
  const [cH, cM] = currentTime.split(":").map(Number);
  if (![kH, kM, cH, cM].every(Number.isFinite)) return "IDLE";
  return computeSyncPhase({ tipoffMs: (kH * 60 + kM) * 60_000, nowMs: (cH * 60 + cM) * 60_000 });
}

/** Seconds until the next allowed poll, or null when polling must not happen. */
export function nextCountdownSec(koTime: string | null | undefined, currentTime: string | null | undefined): number | null {
  const ms = nextPollDelayMs(phaseFromClock(koTime, currentTime));
  return ms === null ? null : Math.round(ms / 1000);
}''',
    r'''/** Parse "HH:MM" wall-clock strings (Rule 1 form fields) to minutes-since-midnight; null when missing/invalid. */
const parseHHMM = (v: string | null | undefined): number | null => {
  if (!v) return null;
  const [h, m] = v.split(":").map(Number);
  return [h, m].every(Number.isFinite) ? h * 60 + m : null;
};

/** Parse a "YYYY-MM-DD" local date to its UTC-midnight epoch ms; null when missing/invalid. Only the day difference is ever used, so no timezone is involved. */
const parseDay = (v: string | null | undefined): number | null => {
  if (!v) return null;
  const ms = Date.parse(v + "T00:00:00Z");
  return Number.isFinite(ms) ? ms : null;
};

/**
 * Minutes from now until kick-off, date-aware.
 *
 * D-2026-11-10-02: the old code subtracted two minutes-since-midnight
 * values, so a 01:00 kick-off seen at 23:50 the evening before read as
 * -1370 min and the game was classified LIVE (270 s poll), burning ~13
 * provider calls/hour on a game that had not tipped. With the fixture
 * date supplied, the day gap is added (tomorrow 01:00 at 23:50 today is
 * +70 min, which computeSyncPhase correctly reads as IDLE — outside the
 * 35-min pre-tipoff window, so the ticker spends nothing). A blind
 * "+1440 when delta < -720" wrap would be wrong here: a SAME-day 01:00
 * game seen at 23:50 tipped 22h50 ago, and wrapping it would resurrect
 * it as a pre-tipoff game. Without dates the old wrap heuristic is
 * kept for backward-compatible callers only.
 */
export function minutesToTipoff(
  koTime: string | null | undefined,
  currentTime: string | null | undefined,
  fixtureDate?: string | null,
  todayDate?: string | null,
): number | null {
  const ko = parseHHMM(koTime);
  const now = parseHHMM(currentTime);
  if (ko == null || now == null) return null;
  const raw = ko - now;
  const f = parseDay(fixtureDate);
  const t = parseDay(todayDate);
  if (f != null && t != null) return raw + Math.round((f - t) / 86_400_000) * 1440;
  return raw < -720 ? raw + 1440 : raw;
}

/** Phase from "HH:MM" wall-clock strings (Rule 1 form fields). Date-aware when the fixture date is supplied: pass the fixture's YYYY-MM-DD date and today's. */
export function phaseFromClock(koTime: string | null | undefined, currentTime: string | null | undefined, fixtureDate?: string | null, todayDate?: string | null): SyncPhase {
  const deltaMin = minutesToTipoff(koTime, currentTime, fixtureDate, todayDate);
  if (deltaMin == null) return "IDLE";
  return computeSyncPhase({ tipoffMs: deltaMin * 60_000, nowMs: 0 });
}

/** Seconds until the next allowed poll, or null when polling must not happen. */
export function nextCountdownSec(koTime: string | null | undefined, currentTime: string | null | undefined, fixtureDate?: string | null, todayDate?: string | null): number | null {
  const ms = nextPollDelayMs(phaseFromClock(koTime, currentTime, fixtureDate, todayDate));
  return ms === null ? null : Math.round(ms / 1000);
}''',
    "D-02: date-aware minutesToTipoff/phaseFromClock/nextCountdownSec",
)

# ---------------- D-2026-11-10-02: RangeEngine.tsx ----------------
UI = "artifacts/mockup-sandbox/src/components/mockups/range-engine/RangeEngine.tsx"
replace_exact(
    UI,
    'import { nextCountdownSec } from "@workspace/range-engine";',
    'import { minutesToTipoff, nextCountdownSec } from "@workspace/range-engine";',
    "D-02: RangeEngine imports minutesToTipoff",
)
replace_exact(
    UI,
    r'''  const currentMinutes = currentTime
    .split(":")
    .map(Number)
    .reduce((sum, part, i) => sum + part * (i === 0 ? 60 : 1), 0);
  const koMinutes = koTime
    .split(":")
    .map(Number)
    .reduce((sum, part, i) => sum + part * (i === 0 ? 60 : 1), 0);
  const tipOffMinutes = Number.isFinite(currentMinutes)
    ? koMinutes - currentMinutes
    : null;''',
    r'''  // Date-aware: `date` is the fixture's local date, `today` is the
  // local date now. The old minutes-since-midnight subtraction read a
  // tomorrow 01:00 kick-off at 23:50 today as -1370 min, so the
  // EARLY READ badge, minutes_to_tipoff and the revalidation watch
  // were all wrong for post-midnight tipoffs (D-2026-11-10-02).
  const tipOffMinutes = minutesToTipoff(koTime, currentTime, date, today);''',
    "D-02: tipOffMinutes is date-aware",
)
replace_exact(
    UI,
    r'''      if (!homeTeam || !awayTeam || !league) {
        // Nothing to reanalyse
        setRefreshCountdown(nextCountdownSec(koTime, currentTime) ?? 60);
        return;
      }''',
    r'''      if (!homeTeam || !awayTeam || !league) {
        // Nothing to reanalyse
        setRefreshCountdown(nextCountdownSec(koTime, currentTime, date, today) ?? 60);
        return;
      }''',
    "D-02: ticker no-teams reset is date-aware",
)
replace_exact(
    UI,
    r'''          // Restart 60s countdown
          setRefreshCountdown(nextCountdownSec(koTime, currentTime) ?? 60);''',
    r'''          // Restart 60s countdown
          setRefreshCountdown(nextCountdownSec(koTime, currentTime, date, today) ?? 60);''',
    "D-02: ticker restart countdown is date-aware",
)
replace_exact(
    UI,
    "      const delaySec = nextCountdownSec(koTime, currentTime);",
    "      const delaySec = nextCountdownSec(koTime, currentTime, date, today);",
    "D-02: ticker poll decision is date-aware",
)
replace_exact(
    UI,
    r'''  useEffect(() => {
    if (!history.length || !currentTime) return;
    const now = currentTime.split(":").map(Number);
    const nowMinutes = now[0] * 60 + now[1];
    history.forEach((entry) => {
      if (
        !entry.earlyRead ||
        entry.outcome !== "PENDING" ||
        entry.revalidationRequested
      ) {
        return;
      }
      const [kH, kM] = entry.koTime.split(":").map(Number);
      const minutesToTipoff = kH * 60 + kM - nowMinutes;
      if (minutesToTipoff <= 15 && minutesToTipoff >= 0) {
        revalidateEarlyEntry(entry);
      }
    });
  }, [history, currentTime]);''',
    r'''  useEffect(() => {
    if (!history.length || !currentTime) return;
    history.forEach((entry) => {
      if (
        !entry.earlyRead ||
        entry.outcome !== "PENDING" ||
        entry.revalidationRequested
      ) {
        return;
      }
      // Date-aware against the ENTRY's own fixture date: a tomorrow
      // 01:00 game at 23:50 today is 70 min out (no revalidation
      // yet), not -1370 min (which never satisfied this window at
      // all — and at 00:45 it is 15 min out, which does).
      const minsToTipoff = minutesToTipoff(entry.koTime, currentTime, entry.date, today);
      if (minsToTipoff != null && minsToTipoff <= 15 && minsToTipoff >= 0) {
        revalidateEarlyEntry(entry);
      }
    });
  }, [history, currentTime]);''',
    "D-02: early-entry revalidation watch is date-aware",
)
replace_exact(
    UI,
    r'''  useEffect(() => {
    if (!koTime || !currentTime) return;
    const [kH, kM] = koTime.split(":").map(Number);
    const [cH, cM] = currentTime.split(":").map(Number);
    const diff = kH * 60 + kM - (cH * 60 + cM);
    if (diff > 0) {''',
    r'''  useEffect(() => {
    if (!koTime || !currentTime) return;
    const diff = minutesToTipoff(koTime, currentTime, date, today);
    if (diff == null) return;
    if (diff > 0) {''',
    "D-02: tip label is date-aware",
)
replace_exact(
    UI,
    r'''    } else {
      setTipOff(`In progress (${Math.abs(diff)} min elapsed)`);
    }
  }, [koTime, currentTime]);''',
    r'''    } else {
      setTipOff(`In progress (${Math.abs(diff)} min elapsed)`);
    }
  }, [koTime, currentTime, date]);''',
    "D-02: tip label recomputes when the fixture date changes",
)
replace_exact(
    UI,
    r'''          const [kH, kM] = koTime.split(":").map(Number);
          const [cH, cM] = currentTime.split(":").map(Number);
          const minutesToTipoff = kH * 60 + kM - (cH * 60 + cM);
          const earlyRead = minutesToTipoff > 45;''',
    r'''          const minsToTipoff = minutesToTipoff(koTime, currentTime, date, today);
          const earlyRead = minsToTipoff != null && minsToTipoff > 45;''',
    "D-02: history earlyRead is date-aware",
)

# ---------------- D-2026-11-10-02: LiveMatrixHub.tsx ----------------
HUB = "artifacts/mockup-sandbox/src/components/mockups/range-engine/LiveMatrixHub.tsx"
replace_exact(
    HUB,
    'import React, { useState } from "react";',
    'import React, { useState } from "react";\nimport { minutesToTipoff } from "@workspace/range-engine";',
    "D-02: LiveMatrixHub imports minutesToTipoff",
)
replace_exact(
    HUB,
    r'''  const getTipoffMinutes = (koTime: string) => {
    const [kH, kM] = koTime.split(":").map(Number);
    const [cH, cM] = new Date()
      .toTimeString()
      .slice(0, 5)
      .split(":")
      .map(Number);
    return kH * 60 + kM - (cH * 60 + cM);
  };''',
    r'''  // Date-aware: history entries carry their fixture `date`, so a
  // tomorrow 01:00 game at 23:50 today reads as +70 min (EARLY READ
  // stays on) instead of -1370 min (badge wrongly dropped).
  const getTipoffMinutes = (koTime: string, fixtureDate?: string) => {
    const now = new Date();
    const current = String(now.getHours()).padStart(2, "0") + ":" + String(now.getMinutes()).padStart(2, "0");
    const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
    const mins = minutesToTipoff(koTime, current, fixtureDate, today);
    return mins ?? NaN;
  };''',
    "D-02: LiveMatrixHub getTipoffMinutes is date-aware",
)
replace_exact(
    HUB,
    "    const minutes = game.koTime ? getTipoffMinutes(game.koTime) : Infinity;",
    "    const minutes = game.koTime ? getTipoffMinutes(game.koTime, game.date) : Infinity;",
    "D-02: EARLY READ badge uses the entry's fixture date",
)

# ---------------- D-2026-11-10-01: HybridPage.tsx ----------------
HYB = "artifacts/mockup-sandbox/src/components/mockups/range-engine/HybridPage.tsx"
replace_exact(
    HYB,
    r'''type InboxData = {
  updatedAt: string | null; total: number; newCount: number; invalidCount: number;
  alreadyExistCount: number; games: InboxGame[];
};''',
    r'''type InboxData = {
  updatedAt: string | null; total: number; newCount: number; invalidCount: number;
  alreadyExistCount: number; games: InboxGame[]; parseError?: boolean;
};''',
    "D-01: InboxData carries parseError",
)
replace_exact(
    HYB,
    r'''          {inbox.total === 0 && (
            <p className="text-zinc-500 text-xs mt-2">Inbox is empty — export this store to fill it, or pull from the other server.</p>
          )}''',
    r'''          {inbox.parseError === true && (
            <p className="text-[11px] text-red-400 mb-2 border border-red-800 bg-red-950/40 rounded px-2 py-1.5">Inbox file is corrupt — the server reads it as empty. Fix or remove hybrid-inbox.json on the server, then reload this page. Export and Send are refused until then.</p>
          )}
          {inbox.total === 0 && !inbox.parseError && (
            <p className="text-zinc-500 text-xs mt-2">Inbox is empty — export this store to fill it, or pull from the other server.</p>
          )}''',
    "D-01: corrupt inbox shows a red banner, hides the empty message",
)

# ---------------- summary ----------------
print("")
print("PATCH APPLIED: %d checks PASS, %d FAIL" % (len(passes), len(failures)))
diff = run("git diff --stat").stdout.strip()
print(diff)
print("")
print("Next:")
print("git diff")
print("rm f.py")
print("git add lib/range-engine/src/syncScheduler.ts artifacts/mockup-sandbox/src/components/mockups/range-engine/RangeEngine.tsx artifacts/mockup-sandbox/src/components/mockups/range-engine/LiveMatrixHub.tsx artifacts/mockup-sandbox/src/components/mockups/range-engine/HybridPage.tsx")
print('git commit -m "Range-engine: date-aware tipoff phase (post-midnight KOs no longer LIVE), corrupt inbox banner on Hybrid page"')
print("git push origin main")
sys.exit(0 if not failures else 1)
