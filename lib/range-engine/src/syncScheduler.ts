export type SyncPhase = "IDLE" | "PRE_TIPOFF" | "LIVE" | "DECISION" | "FINAL";

export function computeSyncPhase(opts: {
  tipoffMs: number | null;
  nowMs: number;
  matchStatus?: string;      // "NS" | "LIVE" | "FT"
  quarter?: number | null;
  clockRemainingSec?: number | null;
}): SyncPhase {
  const { tipoffMs, nowMs, matchStatus, quarter, clockRemainingSec } = opts;
  if (matchStatus === "FT") return "FINAL";
  if (tipoffMs == null) return "IDLE";
  const delta = tipoffMs - nowMs;
  if (delta > 35 * 60_000) return "IDLE";        // too early: research cache covers it
  if (delta > 0) return "PRE_TIPOFF";            // T-35 .. tipoff
  if (quarter === 2 && (clockRemainingSec ?? 9999) <= 150) return "DECISION";
  if (quarter === 4) return "DECISION";
  return "LIVE";
}

/** null = do not poll at all */
export function nextPollDelayMs(phase: SyncPhase): number | null {
  switch (phase) {
    case "IDLE":       return null;
    case "PRE_TIPOFF": return 10 * 60_000;  // ~3 checks before tipoff
    case "LIVE":       return 270_000;      // 4.5 min
    case "DECISION":   return 90_000;       // end of Q2 / all of Q4
    case "FINAL":      return null;
  }
}

/** Parse "HH:MM" wall-clock strings (Rule 1 form fields) to minutes-since-midnight; null when missing/invalid. */
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
}
