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
  if (!tipoffMs) return "IDLE";
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

/** Phase from "HH:MM" wall-clock strings (Rule 1 form fields). */
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
}
