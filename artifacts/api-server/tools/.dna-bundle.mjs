// ../../lib/range-engine/src/leagueDnaMeasured.ts
var DNA_SNAPSHOT_AT = "2026-08-01";
var SHRINK_K = 1;
var STALE_DAYS = 180;
var LEAGUE_DNA_MEASURED = {
  WNBA: { n: 211, lastGame: "2026-07-31", avgTotal: 174.1, sdTotal: 21.7, p10: 148, median: 172, p90: 203, homeEdge: 1.3, homeWinPct: 51.2, avgMargin: 11.4, blowout20Pct: 16.1, otPct: 3.8, avgQuarterTotal: 43.2 },
  BIG_V: { n: 82, lastGame: "2026-07-25", avgTotal: 182.6, sdTotal: 18.5, p10: 160, median: 182, p90: 209.6, homeEdge: 0.8, homeWinPct: 43.9, avgMargin: 12.7, blowout20Pct: 17.1, otPct: 3.7, avgQuarterTotal: 45.5 },
  LDA: { n: 62, lastGame: "2026-07-29", avgTotal: 156.1, sdTotal: 18.9, p10: 134.1, median: 154, p90: 177.9, homeEdge: 3.2, homeWinPct: 51.6, avgMargin: 12.6, blowout20Pct: 16.1, otPct: 8.1, avgQuarterTotal: 38.4 },
  LEBANON: { n: 40, lastGame: "2026-07-30", avgTotal: 188, sdTotal: 25.3, p10: 154.8, median: 188, p90: 219.1, homeEdge: 1.5, homeWinPct: 55, avgMargin: 14.6, blowout20Pct: 30, otPct: 10, avgQuarterTotal: 46.4 },
  TBT: { n: 30, lastGame: "2026-07-29", avgTotal: 146.2, sdTotal: 14.3, p10: 127.5, median: 145.5, p90: 159.2, homeEdge: 3.4, homeWinPct: 63.3, avgMargin: 13.6, blowout20Pct: 26.7, otPct: 0, avgQuarterTotal: 36.5 },
  URUGUAY_LUB: { n: 29, lastGame: "2025-04-06", avgTotal: 166.6, sdTotal: 17.5, p10: 140.6, median: 167, p90: 187, homeEdge: -1.9, homeWinPct: 51.7, avgMargin: 11.7, blowout20Pct: 17.2, otPct: 3.4, avgQuarterTotal: 41.3 },
  PBA_COMMISSIONERS: { n: 26, lastGame: "2026-05-16", avgTotal: 208, sdTotal: 22.1, p10: 180.5, median: 207.5, p90: 233, homeEdge: 0, homeWinPct: 42.3, avgMargin: 9.2, blowout20Pct: 3.8, otPct: 7.7, avgQuarterTotal: 51.5 },
  PBA_PHILIPPINE: { n: 24, lastGame: "2026-02-01", avgTotal: 187.5, sdTotal: 14.7, p10: 170.5, median: 187, p90: 202.7, homeEdge: 0.6, homeWinPct: 50, avgMargin: 11.4, blowout20Pct: 8.3, otPct: 4.2, avgQuarterTotal: 46.6 },
  DIV_TERCERA: { n: 17, lastGame: "2025-11-18", avgTotal: 159.5, sdTotal: 22, p10: 129.4, median: 163, p90: 179.8, homeEdge: 2.8, homeWinPct: 58.8, avgMargin: 19.2, blowout20Pct: 47.1, otPct: 0, avgQuarterTotal: 39.9 },
  WNBA_PRESEASON: { n: 14, lastGame: "2026-05-03", avgTotal: 167.6, sdTotal: 20.8, p10: 143.9, median: 163.5, p90: 195.5, homeEdge: 0.8, homeWinPct: 42.9, avgMargin: 13.8, blowout20Pct: 7.1, otPct: 0, avgQuarterTotal: 41.9 },
  CBI_U15_FEM: { n: 10, lastGame: "2026-07-29", avgTotal: 101.8, sdTotal: 20, p10: 82.5, median: 108, p90: 124.2, homeEdge: 2, homeWinPct: 60, avgMargin: 16.4, blowout20Pct: 40, otPct: 0, avgQuarterTotal: 25.5 },
  PBA_GOVERNORS: { n: 7, lastGame: "2026-07-26", avgTotal: 218, sdTotal: 21.6, p10: 196.2, median: 213, p90: 241, homeEdge: 3.7, homeWinPct: 71.4, avgMargin: 16.3, blowout20Pct: 28.6, otPct: 0, avgQuarterTotal: 54.5 },
  WASL: { n: 6, lastGame: "2026-02-18", avgTotal: 191.3, sdTotal: 15.7, p10: 173.5, median: 196.5, p90: 204, homeEdge: 5, homeWinPct: 50, avgMargin: 18, blowout20Pct: 33.3, otPct: 16.7, avgQuarterTotal: 46.9 },
  LDB: { n: 6, lastGame: "2026-07-29", avgTotal: 156.5, sdTotal: 18, p10: 138.5, median: 155, p90: 176, homeEdge: 12.5, homeWinPct: 83.3, avgMargin: 23.8, blowout20Pct: 66.7, otPct: 0, avgQuarterTotal: 39.1 },
  U18_PAULISTA: { n: 4, lastGame: "2026-07-29", avgTotal: 140.5, sdTotal: 17.5, p10: 126, median: 137.5, p90: 157.4, homeEdge: -11, homeWinPct: 25, avgMargin: 20.5, blowout20Pct: 50, otPct: 0, avgQuarterTotal: null }
};
var MEASURED_PROFILES = {
  BIG_V: { name: "Big V (Australia state league)", proxyPPG: 84.9, hbDNA: 0, lbDNA: 0, maxWidth: 16, hammerEdge: 8, buffer: 2, grind: false },
  LDA: { name: "LDA (measured grind)", proxyPPG: 72.6, hbDNA: 0, lbDNA: 0, maxWidth: 16, hammerEdge: 8, buffer: 2, grind: true },
  LEBANON: { name: "Lebanese BL (high variance)", proxyPPG: 87.4, hbDNA: 0, lbDNA: 0, maxWidth: 21, hammerEdge: 8, buffer: 2.5, grind: false },
  URUGUAY_LUB: { name: "Uruguay LUB (aged sample)", proxyPPG: 77.5, hbDNA: 0, lbDNA: 0, maxWidth: 16, hammerEdge: 8, buffer: 2, grind: false },
  PBA_COMMISSIONERS: { name: "PBA Commissioner's Cup (imports)", proxyPPG: 96.7, hbDNA: 0, lbDNA: 0, maxWidth: 18, hammerEdge: 8, buffer: 2, grind: false },
  PBA_PHILIPPINE: { name: "PBA Philippine Cup (all-Filipino)", proxyPPG: 87.2, hbDNA: 0, lbDNA: 0, maxWidth: 16, hammerEdge: 8, buffer: 2, grind: false },
  PBA_GOVERNORS: { name: "PBA Governors' Cup (imports)", proxyPPG: 101.4, hbDNA: 0, lbDNA: 0, maxWidth: 18, hammerEdge: 8, buffer: 2, grind: false },
  DIV_TERCERA: { name: "Divisional Tercera (blowout-heavy)", proxyPPG: 74.2, hbDNA: 0, lbDNA: 0, maxWidth: 18, hammerEdge: 8, buffer: 2, grind: true },
  WNBA_PRESEASON: { name: "WNBA Preseason (deep rotations)", proxyPPG: 77.9, hbDNA: 0, lbDNA: 0, maxWidth: 17, hammerEdge: 8, buffer: 2, grind: false },
  CBI_U15_FEM: { name: "CBI U15 Fem (youth girls)", proxyPPG: 47.3, hbDNA: 0, lbDNA: 0, maxWidth: 17, hammerEdge: 8, buffer: 2, grind: true },
  WASL: { name: "WASL West Asia", proxyPPG: 89, hbDNA: 0, lbDNA: 0, maxWidth: 16, hammerEdge: 8, buffer: 2, grind: false },
  LDB: { name: "LDB (thin sample)", proxyPPG: 72.8, hbDNA: 0, lbDNA: 0, maxWidth: 16, hammerEdge: 8, buffer: 2, grind: true },
  U18_PAULISTA: { name: "U18 Paulista (thin sample)", proxyPPG: 65.3, hbDNA: 0, lbDNA: 0, maxWidth: 16, hammerEdge: 8, buffer: 2, grind: false }
};
function resolveMeasuredKey(leagueUpper) {
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
var dnaWeight = (n) => Math.round(n / (n + SHRINK_K) * 1e3) / 1e3;
function isStale(lastGame, asOf = DNA_SNAPSHOT_AT) {
  const days = (Date.parse(asOf) - Date.parse(lastGame)) / 864e5;
  return days > STALE_DAYS;
}
var mix = (a, b, w) => Math.round((a * w + b * (1 - w)) * 10) / 10;
function blendDna(measured, fallback, n, stale = false) {
  const w = dnaWeight(n);
  const u = 1 - w;
  return {
    name: measured.name,
    proxyPPG: mix(measured.proxyPPG, fallback.proxyPPG, w),
    hbDNA: 0,
    lbDNA: 0,
    maxWidth: Math.min(24, Math.round(measured.maxWidth + 6 * u)),
    hammerEdge: Math.round(measured.hammerEdge + 7 * u),
    buffer: Math.round((measured.buffer + 1 * u + (stale ? 0.5 : 0)) * 10) / 10,
    grind: measured.grind,
    noOT: measured.noOT
  };
}

// ../../lib/range-engine/src/leagueDna.ts
var LEAGUE_DNA_PROFILES = {
  WNBA: {
    name: "WNBA (women's pro)",
    proxyPPG: 81,
    hbDNA: 0,
    lbDNA: 0,
    maxWidth: 18,
    hammerEdge: 8,
    buffer: 2,
    grind: false
  },
  TBT: {
    name: "TBT Elam Ending (36-min)",
    proxyPPG: 68,
    hbDNA: 0,
    lbDNA: 0,
    maxWidth: 16,
    hammerEdge: 8,
    buffer: 2,
    grind: true,
    noOT: true
  },
  NBA: {
    name: "High-Octane NBA",
    proxyPPG: 113.8,
    hbDNA: 0,
    lbDNA: 0,
    maxWidth: 22,
    hammerEdge: 8,
    buffer: 3,
    grind: false
  },
  EUROLEAGUE: {
    name: "Structured EuroLeague",
    proxyPPG: 82,
    hbDNA: 0,
    lbDNA: 0,
    maxWidth: 18,
    hammerEdge: 8,
    buffer: 1.5,
    grind: false
  },
  ACB: {
    name: "Technical ACB Spain",
    proxyPPG: 85,
    hbDNA: 0,
    lbDNA: 2,
    maxWidth: 18,
    hammerEdge: 8,
    buffer: 1.5,
    grind: false
  },
  RUSSIA: {
    name: "Defensive Grind (Russia)",
    proxyPPG: 78.5,
    hbDNA: -3,
    lbDNA: 0,
    maxWidth: 16,
    hammerEdge: 15,
    buffer: 1.5,
    grind: true
  },
  GERMANY: {
    name: "Efficiency/Transition BBL",
    proxyPPG: 80,
    hbDNA: 0,
    lbDNA: 2,
    maxWidth: 17,
    hammerEdge: 15,
    buffer: 1.5,
    grind: false
  },
  ISRAEL: {
    name: "Defensive Grind (Israel)",
    proxyPPG: 78.5,
    hbDNA: -3,
    lbDNA: 0,
    maxWidth: 16,
    hammerEdge: 15,
    buffer: 1.5,
    grind: true
  },
  PBA: {
    name: "Philippine High-Pace",
    proxyPPG: 95,
    hbDNA: 0,
    lbDNA: 0,
    maxWidth: 24,
    hammerEdge: 8,
    buffer: 2,
    grind: false
  },
  NBL: {
    name: "Australian NBL",
    proxyPPG: 88,
    hbDNA: 0,
    lbDNA: 0,
    maxWidth: 24,
    hammerEdge: 10,
    buffer: 2,
    grind: false
  },
  NCAA: {
    name: "College NCAA",
    proxyPPG: 74,
    hbDNA: 0,
    lbDNA: 0,
    maxWidth: 16,
    hammerEdge: 10,
    buffer: 1.5,
    grind: false
  },
  DEFAULT: {
    name: "Generic Proxy League",
    proxyPPG: 78.5,
    hbDNA: -2,
    lbDNA: 0,
    maxWidth: 22,
    hammerEdge: 15,
    buffer: 1.5,
    grind: true
  }
};
function getLeagueDNA(league) {
  const lg = league.toUpperCase();
  const mk = resolveMeasuredKey(lg);
  if (mk && MEASURED_PROFILES[mk] && LEAGUE_DNA_MEASURED[mk]) {
    const meas = LEAGUE_DNA_MEASURED[mk];
    const stale = isStale(meas.lastGame);
    return {
      ...blendDna(MEASURED_PROFILES[mk], LEAGUE_DNA_PROFILES.DEFAULT, meas.n, stale),
      key: mk,
      measured: true,
      sample: meas.n,
      weight: dnaWeight(meas.n),
      stale,
      lastGame: meas.lastGame
    };
  }
  if (lg.includes("TBT") || lg.includes("BASKETBALL TOURNAMENT"))
    return { ...LEAGUE_DNA_PROFILES.TBT, key: "TBT" };
  if (lg.includes("WNBA"))
    return { ...LEAGUE_DNA_PROFILES.WNBA, key: "WNBA" };
  if (lg.includes("NBA")) return { ...LEAGUE_DNA_PROFILES.NBA, key: "NBA" };
  if (lg.includes("EUROLEAGUE") || lg.includes("EURO LEAGUE") || lg.includes("EUROCUP"))
    return { ...LEAGUE_DNA_PROFILES.EUROLEAGUE, key: "EUROLEAGUE" };
  if (lg.includes("ACB") || lg.includes("SPAIN") && lg.includes("BASKET"))
    return { ...LEAGUE_DNA_PROFILES.ACB, key: "ACB" };
  if (lg.includes("RUSSIA") || lg.includes("VTB") || lg.includes("SUPERLIGA") || lg.includes("SUPER LIGA") || lg.includes("PBL") || lg.includes("PARI"))
    return { ...LEAGUE_DNA_PROFILES.RUSSIA, key: "RUSSIA" };
  if (lg.includes("GERMAN") || lg.includes("BBL") || lg.includes("BUNDESLIGA"))
    return { ...LEAGUE_DNA_PROFILES.GERMANY, key: "GERMANY" };
  if (lg.includes("ISRAEL") || lg.includes("BSL") || lg.includes("WINNER") || lg.includes("LIGAT"))
    return { ...LEAGUE_DNA_PROFILES.ISRAEL, key: "ISRAEL" };
  if (lg.includes("PBA") || lg.includes("PHILIPPINES"))
    return { ...LEAGUE_DNA_PROFILES.PBA, key: "PBA" };
  if (lg.includes("NBL") || lg.includes("AUSTRALIA"))
    return { ...LEAGUE_DNA_PROFILES.NBL, key: "NBL" };
  if (lg.includes("NCAA") || lg.includes("COLLEGE"))
    return { ...LEAGUE_DNA_PROFILES.NCAA, key: "NCAA" };
  return { ...LEAGUE_DNA_PROFILES.DEFAULT, key: "DEFAULT" };
}
export {
  LEAGUE_DNA_PROFILES,
  getLeagueDNA
};
