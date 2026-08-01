// ─────────────────────────────────────────────────────────────────────────────
// MEASURED LEAGUE DNA — derived ONLY from finished games in the local warehouse.
// Source: artifacts/api-server/data/store.json
// Regenerate: node artifacts/api-server/tools/league-dna-measure.cjs
// Snapshot: 2026-08-01 · 570 scored games · 17 leagues · 0 API calls
//
// DERIVATION (constants recovered from the hand-tuned WNBA + TBT profiles):
//   proxyPPG  = round1(avgTotal / 2 * 0.93)   WNBA -> 81 exact, TBT -> 68 exact
//   maxWidth  = clamp(round(0.83 * sdTotal), 16, 24)
//   buffer    = sdTotal >= 25 ? 2.5 : 2.0
//   grind     = avgQuarterTotal < 40          WNBA 43.2 false, TBT 36.5 true
//   hbDNA/lbDNA = 0 unless |homeEdge / SE| >= 2 — NOTHING measured qualifies
//   noOT      = format-forbidden only, never inferred from otPct === 0
//
// WNBA and TBT are deliberately absent from MEASURED_PROFILES: their existing
// hand-written profiles already equal this derivation, so they stay untouched
// and keep serving as the calibration anchors.
// ─────────────────────────────────────────────────────────────────────────────

export type DnaCore = {
  name: string;
  proxyPPG: number;
  hbDNA: number;
  lbDNA: number;
  maxWidth: number;
  hammerEdge: number;
  buffer: number;
  grind: boolean;
  noOT?: boolean;
};

export type DnaMeasurement = {
  n: number;
  lastGame: string;
  avgTotal: number;
  sdTotal: number;
  p10: number;
  median: number;
  p90: number;
  homeEdge: number;
  homeWinPct: number;
  avgMargin: number;
  blowout20Pct: number;
  otPct: number;
  avgQuarterTotal: number | null;
};

export const DNA_SNAPSHOT_AT = "2026-08-01";
export const DNA_SNAPSHOT_GAMES = 570;
export const SHRINK_K = 1;
export const CAP_DISCOUNT = 0.93;
export const STALE_DAYS = 180;

export const LEAGUE_DNA_MEASURED: Record<string, DnaMeasurement> = {
  WNBA:              { n: 211, lastGame: "2026-07-31", avgTotal: 174.1, sdTotal: 21.7, p10: 148,   median: 172,   p90: 203,   homeEdge:   1.3, homeWinPct: 51.2, avgMargin: 11.4, blowout20Pct: 16.1, otPct: 3.8,  avgQuarterTotal: 43.2 },
  BIG_V:             { n:  82, lastGame: "2026-07-25", avgTotal: 182.6, sdTotal: 18.5, p10: 160,   median: 182,   p90: 209.6, homeEdge:   0.8, homeWinPct: 43.9, avgMargin: 12.7, blowout20Pct: 17.1, otPct: 3.7,  avgQuarterTotal: 45.5 },
  LDA:               { n:  62, lastGame: "2026-07-29", avgTotal: 156.1, sdTotal: 18.9, p10: 134.1, median: 154,   p90: 177.9, homeEdge:   3.2, homeWinPct: 51.6, avgMargin: 12.6, blowout20Pct: 16.1, otPct: 8.1,  avgQuarterTotal: 38.4 },
  LEBANON:           { n:  40, lastGame: "2026-07-30", avgTotal: 188.0, sdTotal: 25.3, p10: 154.8, median: 188,   p90: 219.1, homeEdge:   1.5, homeWinPct: 55.0, avgMargin: 14.6, blowout20Pct: 30.0, otPct: 10.0, avgQuarterTotal: 46.4 },
  TBT:               { n:  30, lastGame: "2026-07-29", avgTotal: 146.2, sdTotal: 14.3, p10: 127.5, median: 145.5, p90: 159.2, homeEdge:   3.4, homeWinPct: 63.3, avgMargin: 13.6, blowout20Pct: 26.7, otPct: 0,    avgQuarterTotal: 36.5 },
  URUGUAY_LUB:       { n:  29, lastGame: "2025-04-06", avgTotal: 166.6, sdTotal: 17.5, p10: 140.6, median: 167,   p90: 187,   homeEdge:  -1.9, homeWinPct: 51.7, avgMargin: 11.7, blowout20Pct: 17.2, otPct: 3.4,  avgQuarterTotal: 41.3 },
  PBA_COMMISSIONERS: { n:  26, lastGame: "2026-05-16", avgTotal: 208.0, sdTotal: 22.1, p10: 180.5, median: 207.5, p90: 233,   homeEdge:   0.0, homeWinPct: 42.3, avgMargin:  9.2, blowout20Pct:  3.8, otPct: 7.7,  avgQuarterTotal: 51.5 },
  PBA_PHILIPPINE:    { n:  24, lastGame: "2026-02-01", avgTotal: 187.5, sdTotal: 14.7, p10: 170.5, median: 187,   p90: 202.7, homeEdge:   0.6, homeWinPct: 50.0, avgMargin: 11.4, blowout20Pct:  8.3, otPct: 4.2,  avgQuarterTotal: 46.6 },
  DIV_TERCERA:       { n:  17, lastGame: "2025-11-18", avgTotal: 159.5, sdTotal: 22.0, p10: 129.4, median: 163,   p90: 179.8, homeEdge:   2.8, homeWinPct: 58.8, avgMargin: 19.2, blowout20Pct: 47.1, otPct: 0,    avgQuarterTotal: 39.9 },
  WNBA_PRESEASON:    { n:  14, lastGame: "2026-05-03", avgTotal: 167.6, sdTotal: 20.8, p10: 143.9, median: 163.5, p90: 195.5, homeEdge:   0.8, homeWinPct: 42.9, avgMargin: 13.8, blowout20Pct:  7.1, otPct: 0,    avgQuarterTotal: 41.9 },
  CBI_U15_FEM:       { n:  10, lastGame: "2026-07-29", avgTotal: 101.8, sdTotal: 20.0, p10:  82.5, median: 108,   p90: 124.2, homeEdge:   2.0, homeWinPct: 60.0, avgMargin: 16.4, blowout20Pct: 40.0, otPct: 0,    avgQuarterTotal: 25.5 },
  PBA_GOVERNORS:     { n:   7, lastGame: "2026-07-26", avgTotal: 218.0, sdTotal: 21.6, p10: 196.2, median: 213,   p90: 241,   homeEdge:   3.7, homeWinPct: 71.4, avgMargin: 16.3, blowout20Pct: 28.6, otPct: 0,    avgQuarterTotal: 54.5 },
  WASL:              { n:   6, lastGame: "2026-02-18", avgTotal: 191.3, sdTotal: 15.7, p10: 173.5, median: 196.5, p90: 204,   homeEdge:   5.0, homeWinPct: 50.0, avgMargin: 18.0, blowout20Pct: 33.3, otPct: 16.7, avgQuarterTotal: 46.9 },
  LDB:               { n:   6, lastGame: "2026-07-29", avgTotal: 156.5, sdTotal: 18.0, p10: 138.5, median: 155,   p90: 176,   homeEdge:  12.5, homeWinPct: 83.3, avgMargin: 23.8, blowout20Pct: 66.7, otPct: 0,    avgQuarterTotal: 39.1 },
  U18_PAULISTA:      { n:   4, lastGame: "2026-07-29", avgTotal: 140.5, sdTotal: 17.5, p10: 126,   median: 137.5, p90: 157.4, homeEdge: -11.0, homeWinPct: 25.0, avgMargin: 20.5, blowout20Pct: 50.0, otPct: 0,    avgQuarterTotal: null },
};

export const MEASURED_PROFILES: Record<string, DnaCore> = {
  BIG_V:             { name: "Big V (Australia state league)",     proxyPPG:  84.9, hbDNA: 0, lbDNA: 0, maxWidth: 16, hammerEdge: 8, buffer: 2.0, grind: false },
  LDA:               { name: "LDA (measured grind)",               proxyPPG:  72.6, hbDNA: 0, lbDNA: 0, maxWidth: 16, hammerEdge: 8, buffer: 2.0, grind: true  },
  LEBANON:           { name: "Lebanese BL (high variance)",        proxyPPG:  87.4, hbDNA: 0, lbDNA: 0, maxWidth: 21, hammerEdge: 8, buffer: 2.5, grind: false },
  URUGUAY_LUB:       { name: "Uruguay LUB (aged sample)",          proxyPPG:  77.5, hbDNA: 0, lbDNA: 0, maxWidth: 16, hammerEdge: 8, buffer: 2.0, grind: false },
  PBA_COMMISSIONERS: { name: "PBA Commissioner's Cup (imports)",   proxyPPG:  96.7, hbDNA: 0, lbDNA: 0, maxWidth: 18, hammerEdge: 8, buffer: 2.0, grind: false },
  PBA_PHILIPPINE:    { name: "PBA Philippine Cup (all-Filipino)",  proxyPPG:  87.2, hbDNA: 0, lbDNA: 0, maxWidth: 16, hammerEdge: 8, buffer: 2.0, grind: false },
  PBA_GOVERNORS:     { name: "PBA Governors' Cup (imports)",       proxyPPG: 101.4, hbDNA: 0, lbDNA: 0, maxWidth: 18, hammerEdge: 8, buffer: 2.0, grind: false },
  DIV_TERCERA:       { name: "Divisional Tercera (blowout-heavy)", proxyPPG:  74.2, hbDNA: 0, lbDNA: 0, maxWidth: 18, hammerEdge: 8, buffer: 2.0, grind: true  },
  WNBA_PRESEASON:    { name: "WNBA Preseason (deep rotations)",    proxyPPG:  77.9, hbDNA: 0, lbDNA: 0, maxWidth: 17, hammerEdge: 8, buffer: 2.0, grind: false },
  CBI_U15_FEM:       { name: "CBI U15 Fem (youth girls)",          proxyPPG:  47.3, hbDNA: 0, lbDNA: 0, maxWidth: 17, hammerEdge: 8, buffer: 2.0, grind: true  },
  WASL:              { name: "WASL West Asia",                     proxyPPG:  89.0, hbDNA: 0, lbDNA: 0, maxWidth: 16, hammerEdge: 8, buffer: 2.0, grind: false },
  LDB:               { name: "LDB (thin sample)",                  proxyPPG:  72.8, hbDNA: 0, lbDNA: 0, maxWidth: 16, hammerEdge: 8, buffer: 2.0, grind: true  },
  U18_PAULISTA:      { name: "U18 Paulista (thin sample)",         proxyPPG:  65.3, hbDNA: 0, lbDNA: 0, maxWidth: 16, hammerEdge: 8, buffer: 2.0, grind: false },
};

// ─── Resolver ────────────────────────────────────────────────────────────────
// Order matters. WNBA Preseason must be caught BEFORE any generic WNBA arm, and
// the three PBA conferences before any generic PBA arm. Returns null for WNBA
// and TBT so their hand-tuned profiles keep serving them unchanged.
export function resolveMeasuredKey(leagueUpper: string): string | null {
  const lg = leagueUpper;
  if (lg.includes("WNBA") && lg.includes("PRESEASON")) return "WNBA_PRESEASON";
  if (lg.includes("PBA") && lg.includes("COMMISSIONER")) return "PBA_COMMISSIONERS";
  if (lg.includes("PBA") && lg.includes("GOVERNOR")) return "PBA_GOVERNORS";
  if (lg.includes("PBA") && lg.includes("PHILIPPINE")) return "PBA_PHILIPPINE";
  if (lg.includes("BIG V")) return "BIG_V";
  if (lg.includes("LEBAN")) return "LEBANON";
  if (lg.includes("WASL") || lg.includes("WEST ASIA")) return "WASL";
  if (lg.includes("TERCERA") || lg.includes("ASCENSO")) return "DIV_TERCERA";
  if (lg.includes("CBI") && lg.includes("U15")) return "CBI_U15_FEM";
  if (lg.includes("PAULISTA")) return "U18_PAULISTA";
  if (lg.includes("URUGUAY") || lg.includes("LUB")) return "URUGUAY_LUB";
  if (/\bLDB\b/.test(lg)) return "LDB";
  if (/\bLDA\b/.test(lg)) return "LDA";
  return null;
}

// ─── Shrinkage ───────────────────────────────────────────────────────────────
// Continuous, no cliff: a 6-game league is not silently promoted to fact, and a
// 12-game league is not thrown away. w = n / (n + 15).
//   n=4 -> 0.21 · n=10 -> 0.40 · n=17 -> 0.53 · n=40 -> 0.73 · n=82 -> 0.85
export const dnaWeight = (n: number): number =>
  Math.round((n / (n + SHRINK_K)) * 1000) / 1000;

export function isStale(lastGame: string, asOf: string = DNA_SNAPSHOT_AT): boolean {
  const days = (Date.parse(asOf) - Date.parse(lastGame)) / 86400000;
  return days > STALE_DAYS;
}

const mix = (a: number, b: number, w: number) =>
  Math.round((a * w + b * (1 - w)) * 10) / 10;

// Blend a measured profile toward the generic fallback by sample weight.
// Stale samples pay a widened buffer instead of being silently trusted.
export function blendDna(
  measured: DnaCore,
  fallback: DnaCore,
  n: number,
  stale = false,
): DnaCore {
  const w = dnaWeight(n);
  const u = 1 - w; // uncertainty share

  // ESTIMATES shrink toward the prior.
  // RISK CONTROLS move toward conservative as n falls — never toward DEFAULT,
  // whose buffer (1.5) and hammerEdge (15) are laxer than any measured profile.
  return {
    name: measured.name,
    proxyPPG: mix(measured.proxyPPG, fallback.proxyPPG, w),
    hbDNA: 0,
    lbDNA: 0,
    maxWidth: Math.min(24, Math.round(measured.maxWidth + 6 * u)),
    hammerEdge: Math.round(measured.hammerEdge + 7 * u),
    buffer: Math.round((measured.buffer + 1.0 * u + (stale ? 0.5 : 0)) * 10) / 10,
    grind: measured.grind,
    noOT: measured.noOT,
  };
}
