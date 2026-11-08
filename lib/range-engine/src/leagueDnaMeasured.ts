// ─────────────────────────────────────────────────────────────────────────────
// MEASURED LEAGUE DNA — derived ONLY from finished games in the local warehouse.
// Source: artifacts/api-server/data/store.json (now committed in the repo)
// Regenerate: node artifacts/api-server/tools/league-dna-measure.cjs
// Snapshot: 2026-11-08 · 852 scored games · 35 leagues · 0 API calls
// (852/35 = every scored game / every league in the store. The table below
// lists only the 21 leagues with n >= 4 — 653 games. Excluded from the table:
// leagues with n < 4 (14 games) and the four hand-profile leagues the tool
// also measures but whose hand-written profiles keep serving (NBA 131,
// Germany BBL 38, Euroleague 10, Liga ACB 6 — 185 games). 653 + 14 + 185 = 852.
// Refreshed 2026-11-08 from the tracked hybrid inbox (tool re-run on the
// 852-game warehouse): WNBA updated 247 -> 250 games, and six families
// promoted to measured profiles — NBA Summer League, NBA Preseason,
// AdmiralBet ABA, Stoiximan GBL, Turkish Super League, FIBA Europe Cup.
// The old 2026-08-01 header said 570/17 while its table summed to 568/15:
// that was the same rule — the store-wide count included 2 single-game
// leagues the table omitted. The Aug-1 store itself can't be rebuilt exactly
// (sync timing isn't recorded), so this snapshot is regenerated from the
// current store instead of patched by hand.)
//
// DERIVATION (constants recovered from the hand-tuned WNBA + TBT profiles):
//   proxyPPG  = round1(avgTotal / 2 * 0.93)   WNBA -> 81 exact, TBT -> 68 exact
//   maxWidth  = clamp(round(0.83 * sdTotal), 16, 24)
//   buffer    = sdTotal >= 25 ? 2.5 : 2.0
//   grind     = avgQuarterTotal < 40          WNBA 43.2 false, TBT 36.5 true
//   (avgQuarterTotal null -> grind false; U18_PAULISTA has no quarter data)
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

export const DNA_SNAPSHOT_AT = "2026-11-08";
export const DNA_SNAPSHOT_GAMES = 653; // games covered by LEAGUE_DNA_MEASURED below (store-wide scored total is 852; see header)
export const SHRINK_K = 1;
export const CAP_DISCOUNT = 0.93; // Derivation factor for MEASURED_PROFILES proxyPPG
// (round1(avgTotal / 2 * CAP_DISCOUNT)); verified against all 13 profiles.
// Kept exported: it documents the derivation, it is not dead weight.
export const STALE_DAYS = 180;

export const LEAGUE_DNA_MEASURED: Record<string, DnaMeasurement> = {
  WNBA:              { n: 250, lastGame: "2026-11-01", avgTotal: 173.4, sdTotal: 21.6, p10: 146.9, median: 172,   p90: 202.1, homeEdge:   2.2, homeWinPct: 55.6, avgMargin: 11.5, blowout20Pct: 17.6, otPct: 3.6,  avgQuarterTotal: 43.1 },
  BIG_V:             { n:  83, lastGame: "2026-08-02", avgTotal: 182.6, sdTotal: 18.4, p10: 160,   median: 182,   p90: 209.2, homeEdge:   0.8, homeWinPct: 44.6, avgMargin: 12.6, blowout20Pct: 16.9, otPct: 3.6,  avgQuarterTotal: 45.5 },
  LDA:               { n:  63, lastGame: "2026-07-31", avgTotal: 155.8, sdTotal: 18.9, p10: 134.2, median: 154,   p90: 177.8, homeEdge:   3.3, homeWinPct: 52.4, avgMargin: 12.5, blowout20Pct: 15.9, otPct: 7.9,  avgQuarterTotal: 38.3 },
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
  // DTA measured 2026-11-09 from the same tracked 852-game inbox
  // (12 scored DTA games; previously the family fell through to the
  // DEFAULT proxy). Derivation identical to the tool's: proxyPPG =
  // avgTotal/2 x 0.93, maxWidth = clamp(round(0.83 x sd), 16, 24),
  // grind = avgQuarterTotal < 40.
  DTA:               { n:  12, lastGame: "2025-10-19", avgTotal: 153.4, sdTotal: 23.7, p10: 124.9, median: 152,   p90: 179.7, homeEdge:  -0.1, homeWinPct: 58.3, avgMargin: 18.1, blowout20Pct: 41.7, otPct: 0,    avgQuarterTotal: 38.4 },
  U18_PAULISTA:      { n:   4, lastGame: "2026-07-29", avgTotal: 140.5, sdTotal: 17.5, p10: 126,   median: 137.5, p90: 157.4, homeEdge: -11.0, homeWinPct: 25.0, avgMargin: 20.5, blowout20Pct: 50.0, otPct: 0,    avgQuarterTotal: null },
  NBA_SUMMER:        { n:  13, lastGame: "2026-07-19", avgTotal: 176.8, sdTotal: 13.0, p10: 161.2, median: 180,   p90: 191,   homeEdge:   0.4, homeWinPct: 46.2, avgMargin: 11.6, blowout20Pct: 23.1, otPct: 15.4, avgQuarterTotal: 43.8 },
  NBA_PRESEASON:     { n:   9, lastGame: "2026-10-17", avgTotal: 225.8, sdTotal: 18.5, p10: 203.6, median: 227,   p90: 246,   homeEdge:   2.4, homeWinPct: 44.4, avgMargin: 17.3, blowout20Pct: 44.4, otPct: 11.1, avgQuarterTotal: 56.0 },
  ABA:               { n:   6, lastGame: "2026-11-08", avgTotal: 155.8, sdTotal: 19.1, p10: 137,   median: 152.5, p90: 178,   homeEdge:  -2.5, homeWinPct: 33.3, avgMargin:  8.5, blowout20Pct:  0,   otPct: 0,    avgQuarterTotal: 39.0 },
  GBL:               { n:   6, lastGame: "2026-11-08", avgTotal: 160.5, sdTotal:  2.9, p10: 158,   median: 159.5, p90: 164,   homeEdge:   3.8, homeWinPct: 50.0, avgMargin: 16.2, blowout20Pct: 33.3, otPct: 0,    avgQuarterTotal: 40.1 },
  TURKISH_SL:        { n:   5, lastGame: "2026-11-08", avgTotal: 169.6, sdTotal: 18.7, p10: 151,   median: 176,   p90: 181.8, homeEdge:  -2.4, homeWinPct: 40.0, avgMargin: 11.6, blowout20Pct:  0,   otPct: 20.0, avgQuarterTotal: 42.3 },
  FIBA_EUROPE_CUP:   { n:   5, lastGame: "2026-11-02", avgTotal: 161.2, sdTotal: 19.7, p10: 144,   median: 160,   p90: 180.4, homeEdge:  20.4, homeWinPct: 100.0, avgMargin: 20.4, blowout20Pct: 40.0, otPct: 0,    avgQuarterTotal: 40.3 },
};

export const MEASURED_PROFILES: Record<string, DnaCore> = {
  BIG_V:             { name: "Big V (Australia state league)",     proxyPPG:  84.9, hbDNA: 0, lbDNA: 0, maxWidth: 16, hammerEdge: 8, buffer: 2.0, grind: false },
  LDA:               { name: "LDA (measured grind)",               proxyPPG:  72.4, hbDNA: 0, lbDNA: 0, maxWidth: 16, hammerEdge: 8, buffer: 2.0, grind: true  },
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
  DTA:               { name: "Uruguay DTA (measured, aged sample)", proxyPPG:  71.3, hbDNA: 0, lbDNA: 0, maxWidth: 20, hammerEdge: 8, buffer: 2.0, grind: true  },
  U18_PAULISTA:      { name: "U18 Paulista (thin sample)",         proxyPPG:  65.3, hbDNA: 0, lbDNA: 0, maxWidth: 16, hammerEdge: 8, buffer: 2.0, grind: false },
  NBA_SUMMER:        { name: "NBA Summer League (measured)",       proxyPPG:  82.2, hbDNA: 0, lbDNA: 0, maxWidth: 16, hammerEdge: 8, buffer: 2.0, grind: false },
  NBA_PRESEASON:     { name: "NBA Preseason (measured)",           proxyPPG: 105.0, hbDNA: 0, lbDNA: 0, maxWidth: 16, hammerEdge: 8, buffer: 2.0, grind: false },
  ABA:               { name: "AdmiralBet ABA League (thin sample)", proxyPPG:  72.4, hbDNA: 0, lbDNA: 0, maxWidth: 16, hammerEdge: 8, buffer: 2.0, grind: true  },
  GBL:               { name: "Stoiximan GBL (thin sample)",        proxyPPG:  74.6, hbDNA: 0, lbDNA: 0, maxWidth: 16, hammerEdge: 8, buffer: 2.0, grind: false },
  TURKISH_SL:        { name: "Turkish Super League (thin sample)", proxyPPG:  78.9, hbDNA: 0, lbDNA: 0, maxWidth: 16, hammerEdge: 8, buffer: 2.0, grind: false },
  FIBA_EUROPE_CUP:   { name: "FIBA Europe Cup (thin sample)",      proxyPPG:  75.0, hbDNA: 0, lbDNA: 0, maxWidth: 16, hammerEdge: 8, buffer: 2.0, grind: false },
};

// ─── Resolver ────────────────────────────────────────────────────────────────
// Order matters. WNBA Preseason must be caught BEFORE any generic WNBA arm, and
// the three PBA conferences before any generic PBA arm. Returns null for WNBA
// and TBT so their hand-tuned profiles keep serving them unchanged.
export function resolveMeasuredKey(leagueUpper: string): string | null {
  const lg = leagueUpper;
  if (lg.includes("WNBA") && lg.includes("PRESEASON")) return "WNBA_PRESEASON";
  // After the WNBA arm on purpose: "WNBA" contains "NBA", so the NBA
  // variants must never be reachable from a WNBA string.
  if (lg.includes("NBA") && lg.includes("SUMMER")) return "NBA_SUMMER";
  if (lg.includes("NBA") && lg.includes("PRESEASON")) return "NBA_PRESEASON";
  if (lg.includes("PBA") && lg.includes("COMMISSIONER")) return "PBA_COMMISSIONERS";
  if (lg.includes("PBA") && lg.includes("GOVERNOR")) return "PBA_GOVERNORS";
  if (lg.includes("PBA") && lg.includes("PHILIPPINE")) return "PBA_PHILIPPINE";
  if (lg.includes("BIG V")) return "BIG_V";
  if (lg.includes("LEBAN")) return "LEBANON";
  if (lg.includes("WASL") || lg.includes("WEST ASIA")) return "WASL";
  // TERCERA first: "Divisional Tercera de Ascenso" contains both
  // tokens and IS the Tercera profile. A bare "Liga de Ascenso" is
  // the LDA measurement's own league - the old combined arm routed
  // its 63 warehouse games to the 17-game Tercera profile and left
  // LDA unreachable.
  if (lg.includes("TERCERA")) return "DIV_TERCERA";
  if (lg.includes("ASCENSO") || /\bLDA\b/.test(lg)) return "LDA";
  if (lg.includes("CBI") && lg.includes("U15")) return "CBI_U15_FEM";
  if (lg.includes("PAULISTA")) return "U18_PAULISTA";
  // Word-boundary LUB, and no bare URUGUAY token: the substring
  // matched "CLUB" (Club Friendlies fixtures were served the Uruguay
  // LUB profile), and bare URUGUAY routed every Uruguayan division -
  // DTA fixtures included - to the first division's profile.
  // "Uruguay - LUB" still resolves on the LUB word itself.
  if (/\bLUB\b/.test(lg)) return "URUGUAY_LUB";
  if (/\bLDB\b/.test(lg)) return "LDB";
  if (/\bDTA\b/.test(lg)) return "DTA";
  if (lg.includes("ADMIRALBET") || /\bABA\b/.test(lg)) return "ABA";
  if (lg.includes("STOIXIMAN") || /\bGBL\b/.test(lg)) return "GBL";
  if (lg.includes("TURKISH")) return "TURKISH_SL";
  if (lg.includes("EUROPE CUP")) return "FIBA_EUROPE_CUP";
  return null;
}

// ─── Shrinkage ───────────────────────────────────────────────────────────────
// Continuous, no cliff: a 6-game league is not silently promoted to fact, and a
// 12-game league is not thrown away. w = n / (n + SHRINK_K).
//   n=4 -> 0.80 · n=10 -> 0.91 · n=17 -> 0.94 · n=40 -> 0.98 · n=82 -> 0.99
export const dnaWeight = (n: number): number =>
  Math.round((n / (n + SHRINK_K)) * 1000) / 1000;

// Default asOf is TODAY, not the frozen snapshot date: staleness is a
// property of the calendar, and comparing against 2026-11-07 forever
// would silently stop flagging leagues as they age past 180 days.
export function isStale(lastGame: string, asOf: string = new Date().toISOString().slice(0, 10)): boolean {
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
