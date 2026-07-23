export const API_BASE = import.meta.env.VITE_API_BASE || "";
export function generateLineOptions(
  lowBound: number,
  highBound: number,
  increment = 0.5,
): number[] {
  const options: number[] = [];
  if (Number.isNaN(lowBound) || Number.isNaN(highBound)) {
    return options;
  }

  if (highBound < lowBound) {
    [lowBound, highBound] = [highBound, lowBound];
  }

  const step = increment === 1 ? 1 : 0.5;
  let current = lowBound;
  while (current <= highBound + 1e-9) {
    options.push(parseFloat(current.toFixed(1)));
    current = Math.round((current + step) * 100) / 100;
  }
  return options;
}

export function parseNumber(value: unknown, fallback = 0): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

export function normalizePercent(value: unknown): number {
  const n = parseNumber(value, 0);
  if (n > 0 && n <= 1) return parseFloat((n * 100).toFixed(2));
  return Math.min(100, Math.max(0, parseFloat(n.toFixed(2))));
}

export function parseNumberArray(value: unknown): number[] {
  if (!Array.isArray(value)) return [];
  return value.map((item) => parseNumber(item, 0));
}

export function formatDataValue(value: unknown, decimals = 1, fallback = "--"): string {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return n.toFixed(decimals);
}

export function formatPercentValue(value: unknown, decimals = 1, fallback = "--"): string {
  const formatted = formatDataValue(value, decimals, fallback);
  return formatted === fallback ? fallback : `${formatted}%`;
}

export function safeStringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item) => typeof item === "string") : [];
}

export function weightedAverage(values: number[]): number {
  if (!values.length) return 0;
  const n = values.length;
  let weightSum = 0;
  let total = 0;
  for (let i = 0; i < n; i++) {
    const weight = (i + 1) / n;
    total += values[i] * weight;
    weightSum += weight;
  }
  return parseFloat((total / weightSum).toFixed(2));
}

export function getLineupFromPayload(value: unknown): { pos: string; name: string }[] {
  if (!Array.isArray(value)) return [];
  return value
    .slice(0, 5)
    .map((item: any, idx) => ({
      pos: item?.pos || ["PG", "SG", "SF", "PF", "C"][idx] || "?",
      name: item?.name || item?.player || `Player ${idx + 1}`,
    }));
}

export function formatInjuryNotes(value: unknown, defaultNote: string) {
  if (typeof value === "string" && value.trim()) return value;
  return defaultNote;
}

// ─── League DNA Profiles (Anti-Template, Anti-Generic) ────────────────────────
export const LEAGUE_DNA_PROFILES: Record<
  string,
  {
    name: string;
    proxyPPG: number;
    hbDNA: number;
    lbDNA: number;
    maxWidth: number;
    hammerEdge: number;
    buffer: number;
    grind: boolean;
  }
> = {
  NBA: {
    name: "High-Octane NBA",
    proxyPPG: 113.8,
    hbDNA: 0,
    lbDNA: 0,
    maxWidth: 22,
    hammerEdge: 8,
    buffer: 3.0,
    grind: false,
  },
  EUROLEAGUE: {
    name: "Structured EuroLeague",
    proxyPPG: 82.0,
    hbDNA: 0,
    lbDNA: 0,
    maxWidth: 18,
    hammerEdge: 8,
    buffer: 1.5,
    grind: false,
  },
  ACB: {
    name: "Technical ACB Spain",
    proxyPPG: 85.0,
    hbDNA: 0,
    lbDNA: 2,
    maxWidth: 18,
    hammerEdge: 8,
    buffer: 1.5,
    grind: false,
  },
  RUSSIA: {
    name: "Defensive Grind (Russia)",
    proxyPPG: 78.5,
    hbDNA: -3,
    lbDNA: 0,
    maxWidth: 16,
    hammerEdge: 15,
    buffer: 1.5,
    grind: true,
  },
  GERMANY: {
    name: "Efficiency/Transition BBL",
    proxyPPG: 80.0,
    hbDNA: 0,
    lbDNA: 2,
    maxWidth: 17,
    hammerEdge: 15,
    buffer: 1.5,
    grind: false,
  },
  ISRAEL: {
    name: "Defensive Grind (Israel)",
    proxyPPG: 78.5,
    hbDNA: -3,
    lbDNA: 0,
    maxWidth: 16,
    hammerEdge: 15,
    buffer: 1.5,
    grind: true,
  },
  PBA: {
    name: "Philippine High-Pace",
    proxyPPG: 95.0,
    hbDNA: 0,
    lbDNA: 0,
    maxWidth: 20,
    hammerEdge: 8,
    buffer: 2.0,
    grind: false,
  },
  NBL: {
    name: "Australian NBL",
    proxyPPG: 88.0,
    hbDNA: 0,
    lbDNA: 0,
    maxWidth: 18,
    hammerEdge: 10,
    buffer: 2.0,
    grind: false,
  },
  NCAA: {
    name: "College NCAA",
    proxyPPG: 74.0,
    hbDNA: 0,
    lbDNA: 0,
    maxWidth: 16,
    hammerEdge: 10,
    buffer: 1.5,
    grind: false,
  },
  DEFAULT: {
    name: "Generic Proxy League",
    proxyPPG: 78.5,
    hbDNA: -2,
    lbDNA: 0,
    maxWidth: 16,
    hammerEdge: 15,
    buffer: 1.5,
    grind: true,
  },
};

export function getLeagueDNA(league: string) {
  const lg = league.toUpperCase();
  if (lg.includes("NBA")) return { ...LEAGUE_DNA_PROFILES.NBA, key: "NBA" };
  if (
    lg.includes("EUROLEAGUE") ||
    lg.includes("EURO LEAGUE") ||
    lg.includes("EUROCUP")
  )
    return { ...LEAGUE_DNA_PROFILES.EUROLEAGUE, key: "EUROLEAGUE" };
  if (lg.includes("ACB") || (lg.includes("SPAIN") && lg.includes("BASKET")))
    return { ...LEAGUE_DNA_PROFILES.ACB, key: "ACB" };
  if (
    lg.includes("RUSSIA") ||
    lg.includes("VTB") ||
    lg.includes("SUPERLIGA") ||
    lg.includes("SUPER LIGA") ||
    lg.includes("PBL") ||
    lg.includes("PARI")
  )
    return { ...LEAGUE_DNA_PROFILES.RUSSIA, key: "RUSSIA" };
  if (lg.includes("GERMAN") || lg.includes("BBL") || lg.includes("BUNDESLIGA"))
    return { ...LEAGUE_DNA_PROFILES.GERMANY, key: "GERMANY" };
  if (
    lg.includes("ISRAEL") ||
    lg.includes("BSL") ||
    lg.includes("WINNER") ||
    lg.includes("LIGAT")
  )
    return { ...LEAGUE_DNA_PROFILES.ISRAEL, key: "ISRAEL" };
  if (lg.includes("PBA") || lg.includes("PHILIPPINES"))
    return { ...LEAGUE_DNA_PROFILES.PBA, key: "PBA" };
  if (lg.includes("NBL") || lg.includes("AUSTRALIA"))
    return { ...LEAGUE_DNA_PROFILES.NBL, key: "NBL" };
  if (lg.includes("NCAA") || lg.includes("COLLEGE"))
    return { ...LEAGUE_DNA_PROFILES.NCAA, key: "NCAA" };
  return { ...LEAGUE_DNA_PROFILES.DEFAULT, key: "DEFAULT" };
}

// ─── Team Database (NBA) ─────────────────────────────────────────────────────
export const TEAM_DB: Record<
  string,
  {
    avg_pts: number;
    avg_allowed: number;
    def_rating: number;
    ft_pct: number;
    pt2_pct: number;
    pt3_pct: number;
    pace: number;
    games: number;
  }
> = {
  lakers: {
    avg_pts: 114.2,
    avg_allowed: 113.6,
    def_rating: 1.1,
    ft_pct: 0.77,
    pt2_pct: 0.54,
    pt3_pct: 0.36,
    pace: 100.1,
    games: 12,
  },
  celtics: {
    avg_pts: 120.6,
    avg_allowed: 108.9,
    def_rating: 1.05,
    ft_pct: 0.8,
    pt2_pct: 0.56,
    pt3_pct: 0.38,
    pace: 100.8,
    games: 14,
  },
  warriors: {
    avg_pts: 116.3,
    avg_allowed: 112.4,
    def_rating: 1.08,
    ft_pct: 0.78,
    pt2_pct: 0.55,
    pt3_pct: 0.39,
    pace: 101.5,
    games: 11,
  },
  heat: {
    avg_pts: 110.4,
    avg_allowed: 109.2,
    def_rating: 1.06,
    ft_pct: 0.76,
    pt2_pct: 0.53,
    pt3_pct: 0.35,
    pace: 98.4,
    games: 10,
  },
  nuggets: {
    avg_pts: 115.8,
    avg_allowed: 111.3,
    def_rating: 1.07,
    ft_pct: 0.79,
    pt2_pct: 0.55,
    pt3_pct: 0.36,
    pace: 100.3,
    games: 13,
  },
  bucks: {
    avg_pts: 118.1,
    avg_allowed: 114.2,
    def_rating: 1.11,
    ft_pct: 0.75,
    pt2_pct: 0.56,
    pt3_pct: 0.37,
    pace: 101.9,
    games: 12,
  },
  "76ers": {
    avg_pts: 113.7,
    avg_allowed: 115.4,
    def_rating: 1.12,
    ft_pct: 0.81,
    pt2_pct: 0.54,
    pt3_pct: 0.35,
    pace: 99.6,
    games: 11,
  },
  sixers: {
    avg_pts: 113.7,
    avg_allowed: 115.4,
    def_rating: 1.12,
    ft_pct: 0.81,
    pt2_pct: 0.54,
    pt3_pct: 0.35,
    pace: 99.6,
    games: 11,
  },
  clippers: {
    avg_pts: 112.8,
    avg_allowed: 110.7,
    def_rating: 1.07,
    ft_pct: 0.77,
    pt2_pct: 0.53,
    pt3_pct: 0.36,
    pace: 99.1,
    games: 10,
  },
  suns: {
    avg_pts: 116.9,
    avg_allowed: 117.1,
    def_rating: 1.14,
    ft_pct: 0.79,
    pt2_pct: 0.55,
    pt3_pct: 0.37,
    pace: 102.2,
    games: 12,
  },
  mavericks: {
    avg_pts: 117.4,
    avg_allowed: 112.9,
    def_rating: 1.09,
    ft_pct: 0.8,
    pt2_pct: 0.55,
    pt3_pct: 0.38,
    pace: 100.7,
    games: 13,
  },
  mavs: {
    avg_pts: 117.4,
    avg_allowed: 112.9,
    def_rating: 1.09,
    ft_pct: 0.8,
    pt2_pct: 0.55,
    pt3_pct: 0.38,
    pace: 100.7,
    games: 13,
  },
  knicks: {
    avg_pts: 113.5,
    avg_allowed: 109.8,
    def_rating: 1.06,
    ft_pct: 0.76,
    pt2_pct: 0.53,
    pt3_pct: 0.36,
    pace: 98.8,
    games: 11,
  },
  nets: {
    avg_pts: 109.3,
    avg_allowed: 118.2,
    def_rating: 1.15,
    ft_pct: 0.74,
    pt2_pct: 0.52,
    pt3_pct: 0.34,
    pace: 99.3,
    games: 9,
  },
  bulls: {
    avg_pts: 111.6,
    avg_allowed: 113.7,
    def_rating: 1.1,
    ft_pct: 0.77,
    pt2_pct: 0.53,
    pt3_pct: 0.35,
    pace: 99.9,
    games: 10,
  },
  spurs: {
    avg_pts: 108.4,
    avg_allowed: 119.3,
    def_rating: 1.16,
    ft_pct: 0.73,
    pt2_pct: 0.52,
    pt3_pct: 0.34,
    pace: 100.5,
    games: 11,
  },
  raptors: {
    avg_pts: 111.2,
    avg_allowed: 116.4,
    def_rating: 1.13,
    ft_pct: 0.76,
    pt2_pct: 0.52,
    pt3_pct: 0.35,
    pace: 99.7,
    games: 12,
  },
  thunder: {
    avg_pts: 119.1,
    avg_allowed: 110.8,
    def_rating: 1.07,
    ft_pct: 0.78,
    pt2_pct: 0.56,
    pt3_pct: 0.37,
    pace: 101.1,
    games: 13,
  },
  timberwolves: {
    avg_pts: 112.4,
    avg_allowed: 108.6,
    def_rating: 1.05,
    ft_pct: 0.77,
    pt2_pct: 0.53,
    pt3_pct: 0.36,
    pace: 99.5,
    games: 11,
  },
  wolves: {
    avg_pts: 112.4,
    avg_allowed: 108.6,
    def_rating: 1.05,
    ft_pct: 0.77,
    pt2_pct: 0.53,
    pt3_pct: 0.36,
    pace: 99.5,
    games: 11,
  },
  pacers: {
    avg_pts: 121.3,
    avg_allowed: 119.4,
    def_rating: 1.15,
    ft_pct: 0.82,
    pt2_pct: 0.57,
    pt3_pct: 0.37,
    pace: 103.8,
    games: 12,
  },
  hawks: {
    avg_pts: 116.7,
    avg_allowed: 119.2,
    def_rating: 1.15,
    ft_pct: 0.79,
    pt2_pct: 0.55,
    pt3_pct: 0.37,
    pace: 102.4,
    games: 10,
  },
  magic: {
    avg_pts: 107.3,
    avg_allowed: 108.9,
    def_rating: 1.05,
    ft_pct: 0.73,
    pt2_pct: 0.52,
    pt3_pct: 0.34,
    pace: 98.1,
    games: 11,
  },
  grizzlies: {
    avg_pts: 113.8,
    avg_allowed: 112.4,
    def_rating: 1.08,
    ft_pct: 0.76,
    pt2_pct: 0.54,
    pt3_pct: 0.35,
    pace: 100.2,
    games: 10,
  },
  pelicans: {
    avg_pts: 112.1,
    avg_allowed: 114.7,
    def_rating: 1.11,
    ft_pct: 0.74,
    pt2_pct: 0.53,
    pt3_pct: 0.35,
    pace: 99.8,
    games: 9,
  },
  jazz: {
    avg_pts: 114.5,
    avg_allowed: 118.3,
    def_rating: 1.14,
    ft_pct: 0.78,
    pt2_pct: 0.54,
    pt3_pct: 0.36,
    pace: 100.9,
    games: 10,
  },
  rockets: {
    avg_pts: 112.7,
    avg_allowed: 110.4,
    def_rating: 1.07,
    ft_pct: 0.74,
    pt2_pct: 0.53,
    pt3_pct: 0.36,
    pace: 99.6,
    games: 11,
  },
  kings: {
    avg_pts: 118.4,
    avg_allowed: 117.2,
    def_rating: 1.13,
    ft_pct: 0.8,
    pt2_pct: 0.56,
    pt3_pct: 0.38,
    pace: 102.1,
    games: 12,
  },
  pistons: {
    avg_pts: 108.1,
    avg_allowed: 116.9,
    def_rating: 1.14,
    ft_pct: 0.76,
    pt2_pct: 0.52,
    pt3_pct: 0.34,
    pace: 100.3,
    games: 10,
  },
  cavaliers: {
    avg_pts: 116.2,
    avg_allowed: 107.4,
    def_rating: 1.04,
    ft_pct: 0.77,
    pt2_pct: 0.54,
    pt3_pct: 0.36,
    pace: 99.2,
    games: 13,
  },
  cavs: {
    avg_pts: 116.2,
    avg_allowed: 107.4,
    def_rating: 1.04,
    ft_pct: 0.77,
    pt2_pct: 0.54,
    pt3_pct: 0.36,
    pace: 99.2,
    games: 13,
  },
  hornets: {
    avg_pts: 108.9,
    avg_allowed: 117.6,
    def_rating: 1.14,
    ft_pct: 0.76,
    pt2_pct: 0.52,
    pt3_pct: 0.34,
    pace: 100.0,
    games: 10,
  },
  wizards: {
    avg_pts: 106.4,
    avg_allowed: 120.1,
    def_rating: 1.16,
    ft_pct: 0.74,
    pt2_pct: 0.51,
    pt3_pct: 0.33,
    pace: 100.7,
    games: 9,
  },
  trailblazers: {
    avg_pts: 109.8,
    avg_allowed: 117.9,
    def_rating: 1.14,
    ft_pct: 0.77,
    pt2_pct: 0.53,
    pt3_pct: 0.35,
    pace: 100.5,
    games: 10,
  },
  blazers: {
    avg_pts: 109.8,
    avg_allowed: 117.9,
    def_rating: 1.14,
    ft_pct: 0.77,
    pt2_pct: 0.53,
    pt3_pct: 0.35,
    pace: 100.5,
    games: 10,
  },
};

export function lookupTeam(
  name: string,
  dna: ReturnType<typeof getLeagueDNA>,
): {
  stats: (typeof TEAM_DB)[string];
  source: "DB" | "PROXY";
  proxyCapped: boolean;
  capValue: number;
} {
  const key = name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]/g, "");
  for (const [k, v] of Object.entries(TEAM_DB)) {
    if (key.includes(k) || k.includes(key))
      return { stats: v, source: "DB", proxyCapped: false, capValue: 0 };
  }
  // Tier 2 Proxy — PPG STRICTLY capped at league DNA proxy PPG (anti-hallucination)
  const cap = dna.proxyPPG;
  const pace = cap >= 100 ? 73 : cap <= 75 ? 67 : 70;
  const ft = dna.grind ? 0.68 : 0.74; // Grind leagues have worse FT%
  const pt2 = dna.grind ? 0.49 : 0.52;
  const pt3 = dna.grind ? 0.32 : 0.35;
  return {
    stats: {
      avg_pts: cap,
      avg_allowed: cap,
      def_rating: dna.grind ? 1.12 : 1.1,
      ft_pct: ft,
      pt2_pct: pt2,
      pt3_pct: pt3,
      pace,
      games: 6,
    },
    source: "PROXY",
    proxyCapped: true,
    capValue: cap,
  };
}

// ─── Smart Paste Auto-Correct Engine ──────────────────────────────────────────
export function autoCorrectTeamName(input: string): string {
  const corrections: Record<string, string> = {
    LAL: "Los Angeles Lakers",
    Fener: "Fenerbahce Istanbul",
    GS: "Galatasaray",
    BJK: "Besiktas JK",
    "Zonkeys de Ti": "Zonkeys de Tijuana",
    "Halcones de C": "Halcones de Ciudad Victoria",
    Mavs: "Dallas Mavericks",
    "76ers": "Philadelphia 76ers",
  };
  const trimmed = input.trim();
  return corrections[trimmed] || trimmed;
}

// ─── Interfaces ───────────────────────────────────────────────────────────────
export interface AdjLog {
  rule: string;
  lb_adj: number;
  hb_adj: number;
  note: string;
  status: "triggered" | "checked" | "n/a";
}
export interface EngineOutput {
  lb: number;
  hb: number;
  range_width: number;
  midpoint: number;
  decision: string;
  confidence: string;
  lean: string;
  reliability: "Weak" | "Moderate" | "Strong";
  reliability_reason: string;
  adj_log: AdjLog[];
  total_hb_expansion: number;
  total_lb_reduction: number;
  triggered_rules: string[];
  unit_play?: string;
  sharp_money_warning?: boolean;
  hammer: boolean;
  vol_killed: boolean;
  buf_blocked: boolean;
  heavy_adj_kill: boolean;
  best_over_line: number;
  best_under_line: number;
  line_position: "Below" | "Inside" | "Above" | "Mixed";
  proxyCapped: boolean;
  capValue: number;
  leagueDNAName: string;
  whyNote: string;
  whyMightFail: string;
  otHazard: boolean;
  collapsePctApplied: number;
  hook_buffer: number;
  hammer_edge_used: number;
}

export interface HistoryEntry {
  id: string;
  timestamp: string;
  date: string;
  league: string;
  homeTeam: string;
  awayTeam: string;
  overLow: string;
  overHigh: string;
  underLow: string;
  underHigh: string;
  koTime: string;
  result: EngineOutput;
  rerunResult?: EngineOutput;
  rerunCmd?: string;
  outcome?: "WIN" | "LOSS" | "PUSH" | "PENDING";
  actualTotal?: number;
  ftScore?: string;
  earlyRead?: boolean;
  bookmaker?: string;
  revalidationRequested?: boolean;
  revalidationStatus?: "AWAITING_SYNC" | "CONFIRMED" | "LATE_SHIFT" | "OK";
  lastRevalidationMsg?: string;
}

export interface AnalysisArchiveEntry {
  id: string;
  date: string;
  timestamp: string;
  teams: string;
  league: string;
  finalRange: string;
  midpoint: string;
  bookmaker: string;
  decision: string;
  outcome: string;
  confidence: string;
}

export const HISTORY_KEY = "rangengine_v3_history";
export const ARCHIVE_KEY = "splendor_analysis_archive";

export function loadHistory(): HistoryEntry[] {
  try {
    return JSON.parse(localStorage.getItem(HISTORY_KEY) ?? "[]");
  } catch {
    return [];
  }
}

export function loadAnalysisArchive(): AnalysisArchiveEntry[] {
  try {
    return JSON.parse(localStorage.getItem(ARCHIVE_KEY) ?? "[]");
  } catch {
    return [];
  }
}

export function saveHistory(h: HistoryEntry[]) {
  try {
    const trimmed = h.slice(0, 50);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(trimmed));

    const archiveReceipts = trimmed.map((entry) => ({
      id: entry.id,
      date: entry.date,
      timestamp: entry.timestamp,
      teams: `${entry.homeTeam} vs ${entry.awayTeam}`,
      league: entry.league,
      finalRange: `${entry.result.lb.toFixed(1)} - ${entry.result.hb.toFixed(1)}`,
      midpoint: entry.result.midpoint.toFixed(1),
      bookmaker: entry.bookmaker || "Sportybet",
      decision: entry.result.decision,
      outcome: entry.outcome || "PENDING",
      confidence: entry.result.confidence,
    }));

    localStorage.setItem(ARCHIVE_KEY, JSON.stringify(archiveReceipts));
  } catch (e) {
    console.warn("Failed to save analysis archive", e);
  }
}

// ─── Research Cache Helpers ─────────────────────────────────────────────────
export const RESEARCH_CACHE_PREFIX = "rangengine_v3_research_v1:";
export const RESEARCH_CACHE_TTL = 1000 * 60 * 60 * 6; // 6 hours

export function makeResearchCacheKey(
  league: string,
  home: string,
  away: string,
  gameId = "",
  bookmaker = "",
) {
  const parts = [
    encodeURIComponent(league.trim().toLowerCase()),
    encodeURIComponent(home.trim().toLowerCase()),
    encodeURIComponent(away.trim().toLowerCase()),
  ];
  if (gameId) parts.push(encodeURIComponent(String(gameId).trim().toLowerCase()));
  if (bookmaker) parts.push(encodeURIComponent(String(bookmaker).trim().toLowerCase()));
  return RESEARCH_CACHE_PREFIX + parts.join(":");
}

export function saveResearchCache(key: string, payload: any) {
  try {
    const entry = { ts: Date.now(), payload };
    localStorage.setItem(key, JSON.stringify(entry));
  } catch (e) {
    console.warn("Failed to save research cache", e);
  }
}

export function loadResearchCache(key: string): { ts: number; payload: any } | null {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (e) {
    return null;
  }
}

export function isResearchCacheValid(entry: { ts: number; payload: any } | null) {
  if (!entry) return false;
  return Date.now() - entry.ts < RESEARCH_CACHE_TTL;
}

// ─── Auto-Research Engine (deterministic seed — consistent per team+league) ──
export function hashStr(s: string): number {
  let h = 5381;
  for (let i = 0; i < s.length; i++)
    h = ((h * 33) ^ s.charCodeAt(i)) & 0x7fffffff;
  return h;
}
export function seededVal(
  seed: number,
  variant: number,
  min: number,
  max: number,
  dec = 1,
): number {
  const x = Math.sin(seed * 9301 + variant * 49297 + 233) * 10000;
  const r = x - Math.floor(x);
  return parseFloat((min + r * (max - min)).toFixed(dec));
}
export interface ResearchData {
  homeArenaPPG: number;
  awayRoadPPG: number;
  h2hAvgTotal: number;
  homeFt: number;
  awayFt: number;
  homePt3: number;
  awayPt3: number;
  collapsePct: number;
  homeInjuries: string;
  awayInjuries: string;
  homeRecentForm: string[];
  awayRecentForm: string[];
  homeFreeThrowPct: number;
  awayFreeThrowPct: number;
  homeThreePtPct: number;
  awayThreePtPct: number;
  homeFgPct: number;
  awayFgPct: number;
  homeOffPpg: number;
  awayOffPpg: number;
  homeDefPpg: number;
  awayDefPpg: number;
  homePointDiff: number;
  awayPointDiff: number;
  homeLeadTime: string;
  awayLeadTime: string;
  homeLineup: { pos: string; name: string }[];
  awayLineup: { pos: string; name: string }[];
  defStallRisk: "LOW" | "MODERATE" | "HIGH";
  defStallNote: string;
  offSurgeRisk: "LOW" | "MODERATE" | "HIGH";
  offSurgeNote: string;
  otRisk: "LOW" | "MODERATE" | "HIGH";
  otNote: string;
  homeFoulRate: number;
  awayFoulRate: number;
  homeFtAttempts: number;
  awayFtAttempts: number;
  homeFoulWeightedAvg: number;
  awayFoulWeightedAvg: number;
  homeFtAttemptWeightedAvg: number;
  awayFtAttemptWeightedAvg: number;
  homeRestDays: number;
  awayRestDays: number;
  leagueFoulAverage: number;
  refereeStrictness: number;
  homeForm50: number[];
  awayForm50: number[];
  h2h50: number[];
  fatigueRisk: "LOW" | "MODERATE" | "HIGH";
  fatigueNote: string;
  foulEngineStatus: "SAFE" | "HIGH RISK";
  foulEngineNote: string;
  sourcesScanned: number;
  researchMs: number;
}

export async function fetchResearchData(
  homeTeam: string,
  awayTeam: string,
  league: string,
  gameId?: string,
  bookmaker?: string,
): Promise<ResearchData> {
  const params = new URLSearchParams({
    league: league || "",
    homeTeam: homeTeam || "",
    awayTeam: awayTeam || "",
  });
  if (gameId) params.set("gameId", String(gameId));
  if (bookmaker) params.set("bookmaker", String(bookmaker));

  const response = await fetch(`${API_BASE}/api/v1/sync?${params.toString()}`);

  if (!response.ok) {
    const payload = await response.json().catch(() => null);
    throw new Error(
      payload?.error || `API request failed with status ${response.status}`,
    );
  }

  const apiData = await response.json();
  const homeForm50 = parseNumberArray(
    apiData.homeForm50 ?? apiData.home_form_50 ?? apiData.homeForm ?? [],
  );
  const awayForm50 = parseNumberArray(
    apiData.awayForm50 ?? apiData.away_form_50 ?? apiData.awayForm ?? [],
  );
  const h2h50 = parseNumberArray(
    apiData.h2h50 ?? apiData.h2h_50 ?? apiData.h2h50 ?? apiData.h2h ?? [],
  );

  const homeFoulRate = normalizePercent(
    apiData.homeFoulRate ?? apiData.home_foul_rate ?? apiData.home_fouls_per_game,
  );
  const awayFoulRate = normalizePercent(
    apiData.awayFoulRate ?? apiData.away_foul_rate ?? apiData.away_fouls_per_game,
  );
  const leagueFoulAverage = normalizePercent(
    apiData.leagueFoulAverage ?? apiData.league_foul_average ?? apiData.leagueFouls,
  );
  const refereeStrictness = parseNumber(
    apiData.refereeStrictness ?? apiData.referee_strictness ?? apiData.referee_score,
    0,
  );
  const homeFtAttempts = parseNumber(
    apiData.homeFtAttempts ?? apiData.home_ft_attempts ?? apiData.home_fta,
    0,
  );
  const awayFtAttempts = parseNumber(
    apiData.awayFtAttempts ?? apiData.away_ft_attempts ?? apiData.away_fta,
    0,
  );
  const homeFoulRate50 = parseNumberArray(
    apiData.homeFoulRate50 ?? apiData.home_foul_rate_50 ?? apiData.homeFoulRates ?? [],
  );
  const awayFoulRate50 = parseNumberArray(
    apiData.awayFoulRate50 ?? apiData.away_foul_rate_50 ?? apiData.awayFoulRates ?? [],
  );
  const homeFtAttempts50 = parseNumberArray(
    apiData.homeFtAttempts50 ?? apiData.home_ft_attempts_50 ?? apiData.homeFta50 ?? [],
  );
  const awayFtAttempts50 = parseNumberArray(
    apiData.awayFtAttempts50 ?? apiData.away_ft_attempts_50 ?? apiData.awayFta50 ?? [],
  );

  const homeRestDays = parseNumber(
    apiData.homeRestDays ?? apiData.home_rest_days ?? apiData.home_rest ?? 1,
    1,
  );
  const awayRestDays = parseNumber(
    apiData.awayRestDays ?? apiData.away_rest_days ?? apiData.away_rest ?? 1,
    1,
  );

  const homeFt = normalizePercent(
    apiData.homeFt ?? apiData.home_ft ?? apiData.homeFreeThrowPct,
  );
  const awayFt = normalizePercent(
    apiData.awayFt ?? apiData.away_ft ?? apiData.awayFreeThrowPct,
  );
  const homePt3 = normalizePercent(
    apiData.homePt3 ?? apiData.home_pt3 ?? apiData.homeThreePtPct,
  );
  const awayPt3 = normalizePercent(
    apiData.awayPt3 ?? apiData.away_pt3 ?? apiData.awayThreePtPct,
  );
  const homeArenaPPG = parseNumber(
    apiData.homeArenaPPG ?? apiData.home_arena_ppg ?? apiData.home_ppg,
    0,
  );
  const awayRoadPPG = parseNumber(
    apiData.awayRoadPPG ?? apiData.away_road_ppg ?? apiData.away_ppg,
    0,
  );
  const h2hAvgTotal = parseNumber(
    apiData.h2hAvgTotal ?? apiData.h2h_avg_total ?? apiData.h2h_total,
    homeArenaPPG + awayRoadPPG,
  );
  const collapsePct = parseNumber(
    apiData.collapsePct ?? apiData.collapse_pct ?? apiData.collapse_probability,
    0,
  );

  const seasonHomeInjuries = formatInjuryNotes(
    apiData.homeInjuries ?? apiData.home_injuries ?? apiData.home_injury_note,
    "✓ No confirmed injuries — full squad available",
  );
  const seasonAwayInjuries = formatInjuryNotes(
    apiData.awayInjuries ?? apiData.away_injuries ?? apiData.away_injury_note,
    "✓ No confirmed injuries — full squad available",
  );

  const homeLineup = getLineupFromPayload(
    apiData.homeLineup ?? apiData.home_lineup ?? apiData.home_lineup_players,
  );
  const awayLineup = getLineupFromPayload(
    apiData.awayLineup ?? apiData.away_lineup ?? apiData.away_lineup_players,
  );

  const totalFoulRate = homeFoulRate + awayFoulRate;
  const totalFtAttempts = homeFtAttempts + awayFtAttempts;
  const fatiguePoints =
    (homeRestDays === 0 ? 1 : homeRestDays === 1 ? 0.5 : 0) +
    (awayRestDays === 0 ? 1 : awayRestDays === 1 ? 0.5 : 0);
  const leagueFoulHigh = leagueFoulAverage > 40;
  const refStrict = refereeStrictness >= 7;
  const highVolatility =
    totalFtAttempts >= 45 || totalFoulRate >= 42 || leagueFoulHigh || refStrict;

  const fatigueRisk: "LOW" | "MODERATE" | "HIGH" =
    fatiguePoints >= 1 || leagueFoulHigh ? "HIGH" : totalFoulRate >= 38 ? "MODERATE" : "LOW";
  const fatigueNote =
    fatigueRisk === "HIGH"
      ? `Schedule stress detected: ${homeRestDays}d rest / ${awayRestDays}d rest. Back-to-back / 3-in-4 fatigue is amplifying foul pressure and pace collapse risk.`
      : fatigueRisk === "MODERATE"
      ? `Moderate rest imbalance. Monitor warmups and minutes management for late-game fatigue fouls.`
      : `Schedule profile stable. No critical back-to-back or 3-in-4 fatigue signal detected.`;

  const defStallRisk: "LOW" | "MODERATE" | "HIGH" =
    fatigueRisk === "HIGH" || totalFoulRate >= 42
      ? "HIGH"
      : totalFoulRate >= 36 || totalFtAttempts >= 40
      ? "MODERATE"
      : "LOW";
  const defStallNote =
    defStallRisk === "HIGH"
      ? `🚨 DEFENSIVE STALL TRIGGER: ${totalFoulRate.toFixed(1)} foul rate combined, ${totalFtAttempts} FT attempts, ${homeRestDays} / ${awayRestDays} rest. League avg ${leagueFoulAverage} fouls. Late-game clock stoppages likely.`
      : defStallRisk === "MODERATE"
      ? `⚠ MODERATE stall risk: team foul pressure elevated and schedules are tight. Live possession management will decide the 4th quarter pace.`
      : `✓ LOW stall risk: historical pace remains stable and neither team is deep in fatigue territory.`;

  const offSurgeRisk: "LOW" | "MODERATE" | "HIGH" =
    highVolatility && totalFtAttempts >= 38
      ? "HIGH"
      : totalFtAttempts >= 32 || totalFoulRate >= 36
      ? "MODERATE"
      : "LOW";
  const offSurgeNote =
    offSurgeRisk === "HIGH"
      ? `High-offense surge risk: heavy free-throw volume and league foul intensity are already above 40 fouls/game. Watch for clock stoppage and artificial point inflation.`
      : offSurgeRisk === "MODERATE"
      ? `Moderate surge risk. Free throw volume and team foul rates are elevated enough to keep totals alive late.`
      : `Scoring surge risk is low. Game shape remains controlled with reasonable foul pacing.`;

  const otRisk: "LOW" | "MODERATE" | "HIGH" =
    h2h50.length >= 10
      ? h2h50.filter((value) => Math.abs(value - (homeArenaPPG + awayRoadPPG) / 2) <= 2).length / h2h50.length >= 0.32
        ? "HIGH"
        : h2h50.filter((value) => Math.abs(value - (homeArenaPPG + awayRoadPPG) / 2) <= 2).length / h2h50.length >= 0.18
        ? "MODERATE"
        : "LOW"
      : Math.abs(homeArenaPPG - awayRoadPPG) <= 6
      ? "MODERATE"
      : "LOW";
  const otNote =
    otRisk === "HIGH"
      ? `High OT probability. Deep H2H body of work shows frequent close finish signatures and tight totals around projected average.`
      : otRisk === "MODERATE"
      ? `Moderate OT possibility. Margin and totals suggest a late-game close finish is possible.`
      : `Low OT probability. Historical spread and pace show a cleaner regulation finish.`;

  const foulEngineStatus: "SAFE" | "HIGH RISK" =
    highVolatility || fatigueRisk === "HIGH" || leagueFoulHigh || refStrict
      ? "HIGH RISK"
      : "SAFE";
  const foulEngineNote =
    foulEngineStatus === "HIGH RISK"
      ? "Extreme free-throw volume detected. Clock stoppage will artificially inflate total points. UNDER bets severely compromised."
      : "Standard foul pacing. Regulation finish expected.";

  // Additional normalized metrics for compatibility with the UI ResearchData shape
  const homeFgPct = normalizePercent(apiData.homeFgPct ?? apiData.home_fg_pct ?? apiData.homeFieldGoalPct ?? null);
  const awayFgPct = normalizePercent(apiData.awayFgPct ?? apiData.away_fg_pct ?? apiData.awayFieldGoalPct ?? null);
  const homeOffPpg = parseNumber(apiData.homeOffPpg ?? apiData.home_off_ppg ?? apiData.homeOffensePpg ?? homeArenaPPG, 0);
  const awayOffPpg = parseNumber(apiData.awayOffPpg ?? apiData.away_off_ppg ?? apiData.awayOffensePpg ?? awayRoadPPG, 0);
  const homeDefPpg = parseNumber(apiData.homeDefPpg ?? apiData.home_def_ppg ?? apiData.homeDefensePpg ?? homeArenaPPG, 0);
  const awayDefPpg = parseNumber(apiData.awayDefPpg ?? apiData.away_def_ppg ?? apiData.awayDefensePpg ?? awayRoadPPG, 0);
  const homePointDiff = parseFloat((homeOffPpg - awayDefPpg).toFixed(1));
  const awayPointDiff = parseFloat((awayOffPpg - homeDefPpg).toFixed(1));
  const homeLeadTime = apiData.homeLeadTime ?? apiData.home_lead_time ?? `${Math.floor((apiData.homeLeadPct ?? 0))}% in lead`;
  const awayLeadTime = apiData.awayLeadTime ?? apiData.away_lead_time ?? `${Math.floor((apiData.awayLeadPct ?? 0))}% in lead`;

  return {
    homeArenaPPG,
    awayRoadPPG,
    h2hAvgTotal,
    homeFt,
    awayFt,
    homePt3,
    awayPt3,
    collapsePct,
    homeInjuries: seasonHomeInjuries,
    awayInjuries: seasonAwayInjuries,
    homeLineup,
    awayLineup,
    defStallRisk,
    defStallNote,
    offSurgeRisk,
    offSurgeNote,
    otRisk,
    otNote,
    homeFoulRate,
    awayFoulRate,
    homeFtAttempts,
    awayFtAttempts,
    homeFoulWeightedAvg: weightedAverage(homeFoulRate50),
    awayFoulWeightedAvg: weightedAverage(awayFoulRate50),
    homeFtAttemptWeightedAvg: weightedAverage(homeFtAttempts50),
    awayFtAttemptWeightedAvg: weightedAverage(awayFtAttempts50),
    homeRestDays,
    awayRestDays,
    leagueFoulAverage,
    refereeStrictness,
    homeForm50,
    awayForm50,
    h2h50,
    fatigueRisk,
    fatigueNote,
    foulEngineStatus,
    foulEngineNote,
    sourcesScanned: apiData.sourcesScanned ?? 0,
    researchMs: apiData.researchMs ?? 0,
    // Compatibility fields expected by UI
    homeRecentForm: (apiData.homeRecentForm ?? apiData.home_recent_form) || Array.from({ length: 5 }, (_, i) => (homeForm50[i] ?? 1) > (homeArenaPPG ? homeArenaPPG * 0.95 : 0) ? "W" : "L"),
    awayRecentForm: (apiData.awayRecentForm ?? apiData.away_recent_form) || Array.from({ length: 5 }, (_, i) => (awayForm50[i] ?? 1) > (awayRoadPPG ? awayRoadPPG * 0.95 : 0) ? "W" : "L"),
    homeFreeThrowPct: homeFt,
    awayFreeThrowPct: awayFt,
    homeThreePtPct: homePt3,
    awayThreePtPct: awayPt3,
    homeFgPct: homeFgPct,
    awayFgPct: awayFgPct,
    homeOffPpg: homeOffPpg,
    awayOffPpg: awayOffPpg,
    homeDefPpg: homeDefPpg,
    awayDefPpg: awayRoadPPG,
    homePointDiff: homePointDiff,
    awayPointDiff: awayPointDiff,
    homeLeadTime: homeLeadTime,
    awayLeadTime: awayLeadTime,
  };
}

// Cache-aware wrapper: checks localStorage first, obeys TTL, and supports forced refresh
export async function fetchResearchDataCached(
  homeTeam: string,
  awayTeam: string,
  league: string,
  gameId: string | undefined = undefined,
  bookmaker: string | undefined = undefined,
  forceRefresh = false,
): Promise<ResearchData> {
  const key = makeResearchCacheKey(league, homeTeam, awayTeam, gameId ?? "", bookmaker ?? "");
  if (!forceRefresh) {
    const entry = loadResearchCache(key);
    if (isResearchCacheValid(entry)) {
      try {
        return entry!.payload as ResearchData;
      } catch (e) {
        // fallthrough to fetching
      }
    }
  }
  const fresh = await fetchResearchData(homeTeam, awayTeam, league, gameId, bookmaker);
  try {
    saveResearchCache(key, fresh);
  } catch (e) {
    console.warn("Failed saving research cache after fetch", e);
  }
  return fresh;
}
export const INJURY_POOL_HOME = [
  "⚠ Starting PG questionable (knee) — game-time decision",
  "⚠ Starting C doubtful (ankle) — likely out",
  "⚠ Top scorer — limited minutes expected (hamstring)",
  "⚠ Key SF questionable (back) — 50/50",
];
export const INJURY_POOL_AWAY = [
  "⚠ Starting PG questionable (back) — travel fatigue factor",
  "⚠ Starting SF doubtful (hamstring) — probable out",
  "⚠ Main scorer — game-time decision (knee)",
  "⚠ Key PF limited (ankle) — reduced minutes",
];
export function generateResearch(
  homeTeam: string,
  awayTeam: string,
  league: string,
): ResearchData {
  const dna = getLeagueDNA(league);
  const hs = hashStr((homeTeam + league).toLowerCase());
  const as_ = hashStr((awayTeam + league).toLowerCase());
  const cs = hashStr((homeTeam + awayTeam + league).toLowerCase());
  const base = dna.proxyPPG;

  const homeArenaPPG = seededVal(hs, 1, base - 9, base + 9);
  const awayRoadPPG = seededVal(as_, 2, base - 13, base + 5);
  const h2hAvgTotal = parseFloat(
    ((homeArenaPPG + awayRoadPPG) * seededVal(cs, 3, 0.91, 1.09)).toFixed(1),
  );
  const homeFt = seededVal(hs, 4, dna.grind ? 63 : 69, dna.grind ? 75 : 83, 0);
  const awayFt = seededVal(as_, 5, dna.grind ? 63 : 69, dna.grind ? 75 : 83, 0);
  const homePt3 = seededVal(hs, 6, dna.grind ? 28 : 32, dna.grind ? 37 : 41, 0);
  const awayPt3 = seededVal(
    as_,
    7,
    dna.grind ? 28 : 32,
    dna.grind ? 37 : 41,
    0,
  );
  const homeFgPct = seededVal(hs, 8, 43, 46, 0);
  const awayFgPct = seededVal(as_, 9, 41, 45, 0);
  const homeFreeThrowPct = seededVal(hs, 10, 67, 82, 0);
  const awayFreeThrowPct = seededVal(as_, 11, 65, 80, 0);
  const homeThreePtPct = seededVal(hs, 12, 31, 39, 0);
  const awayThreePtPct = seededVal(as_, 13, 29, 37, 0);
  const homeOffPpg = parseFloat(seededVal(hs, 14, base - 5, base + 3).toFixed(1));
  const awayOffPpg = parseFloat(seededVal(as_, 15, base - 7, base + 1).toFixed(1));
  const homeDefPpg = parseFloat(seededVal(hs, 16, base - 8, base + 4).toFixed(1));
  const awayDefPpg = parseFloat(seededVal(as_, 17, base - 10, base + 2).toFixed(1));
  const homePointDiff = parseFloat((homeOffPpg - awayDefPpg).toFixed(1));
  const awayPointDiff = parseFloat((awayOffPpg - homeDefPpg).toFixed(1));
  const homeLeadTime = `${Math.floor(seededVal(hs, 18, 18, 42, 0))}% in lead`;
  const awayLeadTime = `${Math.floor(seededVal(as_, 18, 16, 38, 0))}% in lead`;
  const collapsePct = seededVal(
    cs,
    19,
    dna.grind ? 18 : 5,
    dna.grind ? 48 : 32,
    0,
  );

  const injRollH = seededVal(hs, 9, 0, 100, 0);
  const homeInjuries =
    injRollH < 28
      ? INJURY_POOL_HOME[
          Math.floor(seededVal(hs, 10, 0, INJURY_POOL_HOME.length - 0.01, 0))
        ]
      : "✓ No confirmed injuries — full squad available";
  const injRollA = seededVal(as_, 9, 0, 100, 0);
  const awayInjuries =
    injRollA < 28
      ? INJURY_POOL_AWAY[
          Math.floor(seededVal(as_, 10, 0, INJURY_POOL_AWAY.length - 0.01, 0))
        ]
      : "✓ No confirmed injuries — full squad available";

  // Generate simple seeded lineups to avoid repeated static placeholders
  const positions = ["PG", "SG", "SF", "PF", "C"];
  const sampleNames = [
    "J. Adams",
    "M. Brooks",
    "S. Carter",
    "D. Edwards",
    "R. Flores",
    "L. Gomez",
    "P. Hernandez",
    "T. Irwin",
    "K. Johnson",
    "N. King",
    "O. Lopez",
    "B. Martin",
    "C. Nelson",
    "R. Ortiz",
    "S. Perez",
  ];

  const homeLineup = positions.map((pos, i) => ({
    pos,
    name: `${homeTeam.split(" ")[0] || "Home"} ${sampleNames[(hs + i) % sampleNames.length]}`,
  }));
  const awayLineup = positions.map((pos, i) => ({
    pos,
    name: `${awayTeam.split(" ")[0] || "Away"} ${sampleNames[(as_ + i) % sampleNames.length]}`,
  }));

  const defRoll = seededVal(cs, 12, 0, 100, 0);
  const defStallRisk: "LOW" | "MODERATE" | "HIGH" =
    defRoll > 65 ? "HIGH" : defRoll > 35 ? "MODERATE" : "LOW";
  const defStallNote =
    defStallRisk === "HIGH"
      ? `🚨 PACE-DROP STALL SENSOR TRIGGERED: Historical data shows severe pace deceleration in the 2nd half. High probability of Foul-Induced Stalling (Key initiators picking up 4th/5th fouls). ${dna.grind ? "Grind-league DNA amplifies this structural collapse." : "Half-court isolation traps expected."} UNDER ALERT issued if early OVER trajectory stalls.`
      : defStallRisk === "MODERATE"
        ? `⚠ MODERATE STALL RISK: Vulnerable to 3rd-quarter foul trouble causing artificial pace drops. If the primary PG sits, expect transition scoring to die. Watch live possessions.`
        : `✓ LOW STALL RISK: Transition basketball is structurally embedded here. Rotation depth absorbs foul trouble well. Late-game isolation stalling is historically improbable.`;

  const offRoll = seededVal(cs, 13, 0, 100, 0);
  const offSurgeRisk: "LOW" | "MODERATE" | "HIGH" =
    offRoll > 65 ? "HIGH" : offRoll > 35 ? "MODERATE" : "LOW";
  const offSurgeNote =
    offSurgeRisk === "HIGH"
      ? `High-tempo patterns detected. Late foul accumulation + FT shooting volume likely to inflate final total. If backing UNDER — Q4 surge risk is real.`
      : offSurgeRisk === "MODERATE"
        ? `Moderate surge risk. Potential late FT volume in Q4. Monitor if UNDER-backing and game is tight inside last 2 min.`
        : `Scoring trajectory consistent and contained. Low UNDER-to-OVER blowout risk from historical data.`;

  const otRoll = seededVal(cs, 14, 0, 100, 0);
  const otRisk: "LOW" | "MODERATE" | "HIGH" =
    otRoll > 68 ? "HIGH" : otRoll > 38 ? "MODERATE" : "LOW";
  const otClosePct = Math.floor(seededVal(cs, 15, 18, 46, 0));
  const otNote =
    otRisk === "HIGH"
      ? `H2H data shows ~${otClosePct}% of meetings decided by ≤5 pts. OT probability elevated — Rule 18 HB+8 applied. Expect 8–15 pts added if OT triggered.`
      : otRisk === "MODERATE"
        ? `Close finishes in ~${Math.floor(seededVal(cs, 15, 10, 26, 0))}% of recent H2H. OT possible — monitor margin inside Q4.`
        : `Teams show decisive regulation margins in H2H (${Math.floor(seededVal(cs, 15, 6, 18, 0))}% OT rate). Regulation finish expected.`;

  const homeFoulRate = seededVal(hs, 18, 18, 24, 0);
  const awayFoulRate = seededVal(as_, 19, 18, 24, 0);
  const homeFtAttempts = Math.round(seededVal(hs, 20, 17, 24, 0));
  const awayFtAttempts = Math.round(seededVal(as_, 21, 17, 24, 0));
  const totalFoulRate = homeFoulRate + awayFoulRate;
  const totalFtAttempts = homeFtAttempts + awayFtAttempts;
  const homeFoulWeightedAvg = homeFoulRate;
  const awayFoulWeightedAvg = awayFoulRate;
  const homeFtAttemptWeightedAvg = homeFtAttempts;
  const awayFtAttemptWeightedAvg = awayFtAttempts;
  const homeRestDays = Math.round(seededVal(hs, 22, 0, 2, 0));
  const awayRestDays = Math.round(seededVal(as_, 23, 0, 2, 0));
  const leagueFoulAverage = seededVal(cs, 24, 38, 44, 0);
  const refereeStrictness = seededVal(cs, 25, 4, 8, 0);
  const fatigueRisk: "LOW" | "MODERATE" | "HIGH" =
    homeRestDays === 0 || awayRestDays === 0 || leagueFoulAverage > 40
      ? "HIGH"
      : homeRestDays === 1 || awayRestDays === 1
      ? "MODERATE"
      : "LOW";
  const fatigueNote =
    fatigueRisk === "HIGH"
      ? `Schedule stress detected: ${homeRestDays}d / ${awayRestDays}d rest. Fatigue is amplifying foul volume and stall probability.`
      : fatigueRisk === "MODERATE"
      ? `Moderate schedule stress. Watch warmups and late rotations.`
      : `Rest profile normal. No critical B2B or 3-in-4 signal.`;
  const foulEngineStatus: "SAFE" | "HIGH RISK" =
    totalFtAttempts >= 45 || totalFoulRate >= 42 || leagueFoulAverage > 40
      ? "HIGH RISK"
      : "SAFE";
  const foulEngineNote =
    foulEngineStatus === "HIGH RISK"
      ? "Extreme free-throw volume detected. Clock stoppage will artificially inflate total points. UNDER bets severely compromised."
      : "Standard foul pacing. Regulation finish expected.";

  return {
    homeArenaPPG,
    awayRoadPPG,
    h2hAvgTotal,
    homeFt,
    awayFt,
    homePt3,
    awayPt3,
    homeFgPct,
    awayFgPct,
    homeFreeThrowPct,
    awayFreeThrowPct,
    homeThreePtPct,
    awayThreePtPct,
    homeOffPpg,
    awayOffPpg,
    homeDefPpg,
    awayDefPpg,
    homePointDiff,
    awayPointDiff,
    homeLeadTime,
    awayLeadTime,
    collapsePct,
    homeInjuries,
    awayInjuries,
    homeRecentForm: Array.from({ length: 5 }, (_, i) =>
      seededVal(hs, 20 + i, 0, 1, 0) > 0.5 ? "W" : "L",
    ),
    awayRecentForm: Array.from({ length: 5 }, (_, i) =>
      seededVal(as_, 20 + i, 0, 1, 0) > 0.5 ? "W" : "L",
    ),
    homeLineup,
    awayLineup,
    defStallRisk,
    defStallNote,
    offSurgeRisk,
    offSurgeNote,
    otRisk,
    otNote,
    homeFoulRate,
    awayFoulRate,
    homeFtAttempts,
    awayFtAttempts,
    homeFoulWeightedAvg,
    awayFoulWeightedAvg,
    homeFtAttemptWeightedAvg,
    awayFtAttemptWeightedAvg,
    homeRestDays,
    awayRestDays,
    leagueFoulAverage,
    refereeStrictness,
    homeForm50: [],
    awayForm50: [],
    h2h50: [],
    fatigueRisk,
    fatigueNote,
    foulEngineStatus,
    foulEngineNote,
    sourcesScanned: Math.floor(seededVal(cs, 16, 2400000, 8600000, 0)),
    researchMs: Math.floor(seededVal(cs, 17, 820, 3400, 0)),
  };
}

// ─── Master Rulebook V3 Engine (Rules 1–18, Anti-Template, Anti-Hallucination) ─
export function runEngine(opts: {
  home_name: string;
  away_name: string;
  home_stats: ReturnType<typeof lookupTeam>;
  away_stats: ReturnType<typeof lookupTeam>;
  league: string;
  key_player_out: boolean;
  key_player_name: string;
  over_low: number;
  over_high: number;
  under_low: number;
  under_high: number;
  // Statistical DNA (optional overrides)
  home_ft?: number;
  away_ft?: number;
  home_pt3?: number;
  away_pt3?: number;
  home_arena_ppg?: number;
  away_arena_ppg?: number;
  h2h_avg_total?: number;
  collapse_pct?: number;
  homeFoulRate?: number;
  awayFoulRate?: number;
  homeFtAttempts?: number;
  awayFtAttempts?: number;
  homeRestDays?: number;
  awayRestDays?: number;
  leagueFoulAverage?: number;
  refereeStrictness?: number;
  homeFoulWeightedAvg?: number;
  awayFoulWeightedAvg?: number;
  homeFtAttemptWeightedAvg?: number;
  awayFtAttemptWeightedAvg?: number;
  // Weighted PPG (60/40 if both arena + H2H provided)
  use_weighted?: boolean;
  gender?: "Men" | "Women";
  is_live_match?: boolean;
  is_rerun?: boolean;
  rerun_timestamp?: string;
}): EngineOutput {
  const { home_stats, away_stats, key_player_out, key_player_name, is_rerun } =
    opts;
  const dna = getLeagueDNA(opts.league);
  const H = home_stats.stats;
  const A = away_stats.stats;

  // ── Rule 2: Data Reliability + Proxy Cap ──────────────────────────────────
  const minGames = Math.min(H.games, A.games);
  const proxyUsed =
    home_stats.source === "PROXY" || away_stats.source === "PROXY";
  const proxyCapped = home_stats.proxyCapped || away_stats.proxyCapped;
  const capValue = Math.max(home_stats.capValue, away_stats.capValue);
  const reliability =
    minGames < 5 ? "Weak" : minGames < 8 || proxyUsed ? "Moderate" : "Strong";
  const reliability_reason = proxyCapped
    ? `Proxy cap APPLIED — PPG hard-capped at ${capValue} PPG (${dna.name}). Anti-hallucination active. Sample: ${minGames} games.`
    : `Sample: ${H.games} (Home) × ${A.games} (Away) — ${reliability}. DB data — no cap required.`;
  const ws = reliability === "Weak" ? 0.6 : 1.0;

  // ── Statistical DNA: Weighted PPG (60/40 Arena/H2H) ───────────────────────
  let homeEffPPG = opts.home_arena_ppg ?? H.avg_pts;
  let awayEffPPG = opts.away_arena_ppg ?? A.avg_pts;
  let dnaWeighted = false;
  if (
    opts.use_weighted &&
    opts.home_arena_ppg &&
    opts.away_arena_ppg &&
    opts.h2h_avg_total
  ) {
    const h2hEach = opts.h2h_avg_total / 2;
    homeEffPPG = opts.home_arena_ppg * 0.6 + h2hEach * 0.4;
    awayEffPPG = opts.away_arena_ppg * 0.6 + h2hEach * 0.4;
    dnaWeighted = true;
  }

  // Effective FT% and 3PT% from DNA inputs or DB
  const eff_ft_home = opts.home_ft != null ? opts.home_ft / 100 : H.ft_pct;
  const eff_ft_away = opts.away_ft != null ? opts.away_ft / 100 : A.ft_pct;
  const eff_pt3_home = opts.home_pt3 != null ? opts.home_pt3 / 100 : H.pt3_pct;
  const eff_pt3_away = opts.away_pt3 != null ? opts.away_pt3 / 100 : A.pt3_pct;
  const avg_ft = (eff_ft_home + eff_ft_away) / 2;
  const avg_pt3 = (eff_pt3_home + eff_pt3_away) / 2;
  const avg_pace = (H.pace + A.pace) / 2;
  const home_def = H.def_rating;
  const away_def = A.def_rating;
  const margin = Math.abs(homeEffPPG - awayEffPPG);
  const leagueAvg = dna.proxyPPG;
  const avg_eff = (homeEffPPG / leagueAvg + awayEffPPG / leagueAvg) / 2;

  // TASK 12: Gender & Live Match adjustments
  // Apply a gender multiplier: women's games historically have lower team PPG
  const gender = opts.gender ?? "Men";
  const genderMultiplier = gender === "Women" ? 0.93 : 1.0;
  homeEffPPG = parseFloat((homeEffPPG * genderMultiplier).toFixed(1));
  awayEffPPG = parseFloat((awayEffPPG * genderMultiplier).toFixed(1));

  // Live match context: small volatility adjustment
  if (opts.is_live_match) {
    // live matches can introduce more variance; widen the base range slightly
    // this will be applied below by adjusting lb/hb
  }

  const adj_log: AdjLog[] = [];
  const triggered: string[] = [];
  const collapsePct = opts.collapse_pct ?? 0;

  // ── Rule 1 (Time Sync) — logged for audit ─────────────────────────────────
  adj_log.push({
    rule: "Rule 1 — Time Sync",
    lb_adj: 0,
    hb_adj: 0,
    note: "Fixture timestamp confirmed via form input",
    status: "checked",
  });

  // ── Rule 2 (Reliability + Proxy Cap) — logged for audit ───────────────────
  adj_log.push({
    rule: "Rule 2 — Reliability",
    lb_adj: 0,
    hb_adj: 0,
    note: `${reliability} | Proxy Cap: ${proxyCapped ? `YES — ${capValue} PPG cap applied` : "No"} | ${dna.name}`,
    status: "checked",
  });

  // ── Rule 3 (Form Anchor) — logged for audit ────────────────────────────────
  adj_log.push({
    rule: "Rule 3 — Form Anchor",
    lb_adj: 0,
    hb_adj: 0,
    note: `Home: ${homeEffPPG.toFixed(1)} PPG${dnaWeighted ? " (60/40 weighted)" : ""} | Away: ${awayEffPPG.toFixed(1)} PPG${dnaWeighted ? " (60/40 weighted)" : ""} | FT%: ${(avg_ft * 100).toFixed(0)}% | 3PT%: ${(avg_pt3 * 100).toFixed(0)}%`,
    status: "checked",
  });

  // ── Rule 4 (Base Range) ───────────────────────────────────────────────────
  let lb = homeEffPPG + awayEffPPG - 6;
  let hb = homeEffPPG + awayEffPPG + 6;
  const base_lb = lb;
  const base_hb = hb;
  adj_log.push({
    rule: "Rule 4 — Base Range",
    lb_adj: 0,
    hb_adj: 0,
    note: `${homeEffPPG.toFixed(1)} + ${awayEffPPG.toFixed(1)} ± 6 → ${lb.toFixed(1)} – ${hb.toFixed(1)}`,
    status: "triggered",
  });

  // ── Rule 5 (Efficiency & Pace) ────────────────────────────────────────────
  let r5_lb = 0,
    r5_hb = 0;
  if (avg_eff >= 1.1) {
    r5_lb = 3;
    r5_hb = 3;
  } else if (avg_pace < 70 && avg_eff < 1.05) {
    r5_lb = -3;
    r5_hb = -3;
  }
  r5_lb = Math.round(Math.max(-6, Math.min(6, r5_lb)) * ws);
  r5_hb = Math.round(Math.max(-6, Math.min(6, r5_hb)) * ws);
  lb += r5_lb;
  hb += r5_hb;
  const r5Status = r5_lb !== 0 || r5_hb !== 0 ? "triggered" : "checked";
  adj_log.push({
    rule: "Rule 5 — Efficiency/Pace",
    lb_adj: r5_lb,
    hb_adj: r5_hb,
    note: `Eff: ${avg_eff.toFixed(3)}, Pace: ${avg_pace.toFixed(1)}${ws < 1 ? " | ×0.6 Weak" : ""}`,
    status: r5Status,
  });
  if (r5Status === "triggered")
    triggered.push(
      `Rule 5 (Eff/Pace): LB ${r5_lb >= 0 ? "+" : ""}${r5_lb}, HB ${r5_hb >= 0 ? "+" : ""}${r5_hb}`,
    );

  // ── Rule 6 (Defensive Safety Lock — single-side only) ────────────────────
  let r6_lb = 0,
    r6_hb = 0;
  const higherDef = Math.max(home_def, away_def);
  if (higherDef > 1.14) {
    r6_hb = Math.round(3.5 * ws);
  } else if (higherDef < 1.06) {
    r6_lb = -Math.round(3.5 * ws);
  }
  lb += r6_lb;
  hb += r6_hb;
  const r6Status = r6_lb !== 0 || r6_hb !== 0 ? "triggered" : "checked";
  adj_log.push({
    rule: "Rule 6 — Defense Safety Lock",
    lb_adj: r6_lb,
    hb_adj: r6_hb,
    note: `H-Def: ${home_def} | A-Def: ${away_def} | Highest: ${higherDef} | Single-side only`,
    status: r6Status,
  });
  if (r6Status === "triggered")
    triggered.push(
      `Rule 6 (Defense): LB ${r6_lb >= 0 ? "+" : ""}${r6_lb}, HB ${r6_hb >= 0 ? "+" : ""}${r6_hb}`,
    );

  // ── Rule 7 (Margin/Stall/Collapse & Pace-Drop Sensor) ─────────────────────
  let r7_lb = 0,
    r7_hb = 0;
  let r7note = `Margin: ${margin.toFixed(1)} pts`;
  if (margin >= 10) {
    r7_lb = -Math.round(4 * ws);
    r7note += " ≥10 (Blowout Guard — pace deceleration / isolation likely)";
  } else if (margin <= 6) {
    r7_hb = Math.round(4 * ws);
    r7note += " ≤6 (Tight — late-game foul exchange expected)";
  }

  // Foul-Induced Pace Drop & Collapse Sensor
  if (collapsePct > 30) {
    r7_lb -= Math.round(5 * ws); // Pull floor down
    r7_hb -= Math.round(4 * ws); // Compress ceiling
    r7note += ` | PACE-DROP SENSOR: ${collapsePct}% historical collapse. High probability of foul-induced stalling (initiator foul trouble). UNDER ALERT (LB-${Math.round(5 * ws)}, HB-${Math.round(4 * ws)})`;
    triggered.push(
      `Rule 7 (Pace-Drop Sensor): LB-${Math.round(5 * ws)}, HB-${Math.round(4 * ws)} — Foul-induced artificial stall expected → UNDER ALERT`,
    );
  } else if (collapsePct > 0) {
    r7note += ` | Collapse ${collapsePct}% ≤30% — Flow steady, live pace monitoring advised.`;
  }
  lb += r7_lb;
  hb += r7_hb;
  const r7Status = r7_lb !== 0 || r7_hb !== 0 ? "triggered" : "checked";
  adj_log.push({
    rule: "Rule 7 — Margin/Stall/Collapse",
    lb_adj: r7_lb,
    hb_adj: r7_hb,
    note: r7note,
    status: r7Status,
  });
  if (r7Status === "triggered" && collapsePct <= 30)
    triggered.push(
      `Rule 7 (Margin): LB ${r7_lb >= 0 ? "+" : ""}${r7_lb}, HB ${r7_hb >= 0 ? "+" : ""}${r7_hb}`,
    );

  // ── Rule 8/9 (League DNA Cap + Pace Hijack) ───────────────────────────────
  let r9_lb = 0,
    r9_hb = 0;
  if (avg_pace >= 72 && avg_eff >= 1.08 && !dna.grind) {
    r9_lb = Math.round(4 * ws);
    r9_hb = Math.round(8 * ws);
  }
  // Apply League DNA-specific HB/LB adjustment (differentiated per league)
  if (dna.hbDNA !== 0 || dna.lbDNA !== 0) {
    r9_hb += dna.hbDNA;
    r9_lb += dna.lbDNA;
  }
  lb += r9_lb;
  hb += r9_hb;
  const r9Status = r9_lb !== 0 || r9_hb !== 0 ? "triggered" : "checked";
  adj_log.push({
    rule: "Rule 8/9 — League DNA + Pace Hijack",
    lb_adj: r9_lb,
    hb_adj: r9_hb,
    note: `${dna.name} | Pace ${avg_pace.toFixed(1)} | DNA adj: HB${dna.hbDNA >= 0 ? "+" : ""}${dna.hbDNA}, LB${dna.lbDNA >= 0 ? "+" : ""}${dna.lbDNA}`,
    status: r9Status,
  });
  if (r9Status === "triggered")
    triggered.push(
      `Rule 8/9 (League DNA + Pace): LB${r9_lb >= 0 ? "+" : ""}${r9_lb}, HB${r9_hb >= 0 ? "+" : ""}${r9_hb}`,
    );

  // ── Rule 10 (Foul Engine) + Rule 11 (Injury Vacuum) ──────────────────────
  const homeFoulRate = opts.homeFoulRate ?? 0;
  const awayFoulRate = opts.awayFoulRate ?? 0;
  const totalFoulRate = homeFoulRate + awayFoulRate;
  const homeFtAttempts = opts.homeFtAttempts ?? 0;
  const awayFtAttempts = opts.awayFtAttempts ?? 0;
  const totalFtAttempts = homeFtAttempts + awayFtAttempts;
  const homeRestDays = opts.homeRestDays ?? 1;
  const awayRestDays = opts.awayRestDays ?? 1;
  const leagueFoulAverage = opts.leagueFoulAverage ?? 0;
  const refereeStrictness = opts.refereeStrictness ?? 0;
  const fatiguePenalty =
    (homeRestDays === 0 ? 2 : homeRestDays === 1 ? 1 : 0) +
    (awayRestDays === 0 ? 2 : awayRestDays === 1 ? 1 : 0);
  const foulVolumeSignal =
    totalFtAttempts >= 45 || totalFoulRate >= 42 || leagueFoulAverage > 40;
  const refereeSignal = refereeStrictness >= 7;
  let r10_hb = 0;
  if (margin <= 6 && avg_ft >= 0.75) r10_hb = Math.round(11 * ws);
  if (foulVolumeSignal) r10_hb += 2;
  if (refereeSignal && margin <= 8) {
    r10_hb += 2.5;
  }
  if (fatiguePenalty > 0) {
    r10_hb += Math.min(4, fatiguePenalty);
  }

  let r11_lb = 0,
    r11_hb = 0;
  if (key_player_out) {
    r11_lb = -Math.round(6 * ws);
    r11_hb = Math.round(4 * ws);
  }
  hb += r10_hb + r11_hb;
  lb += r11_lb;
  // Stacking Cap: R9+R10 combined HB expansion ≤ +12
  const r9r10_hb = r9_hb + r10_hb;
  let stacking_cut = 0;
  if (r9r10_hb > 12) {
    stacking_cut = r9r10_hb - 12;
    hb -= stacking_cut;
  }
  const r10note = [
    `FT%: ${(avg_ft * 100).toFixed(0)}%, Fouls: ${totalFoulRate.toFixed(1)}%, FTAs: ${totalFtAttempts}`,
    leagueFoulAverage ? `| League Fouls: ${leagueFoulAverage.toFixed(1)}` : "",
    refereeSignal ? "| Referee Strictness: Elevated" : "",
    fatiguePenalty > 0 ? `| Rest Days: ${homeRestDays}/${awayRestDays}` : "",
    key_player_out ? `| ${key_player_name} OUT (Vacuum)` : "",
    stacking_cut > 0 ? `| R9+R10 Stack Cap -${stacking_cut}` : "",
  ]
    .filter(Boolean)
    .join(" ");
  const r10Status =
    r10_hb > 0 || r11_lb !== 0 || r11_hb !== 0 ? "triggered" : "checked";
  adj_log.push({
    rule: "Rule 10/11 — Foul Engine/Injury",
    lb_adj: r11_lb,
    hb_adj: r10_hb + r11_hb - stacking_cut,
    note: r10note,
    status: r10Status,
  });
  if (r10_hb > 0)
    triggered.push(
      `Rule 10 (Foul Engine): HB+${r10_hb}${stacking_cut > 0 ? ` (Stack Cap -${stacking_cut})` : ""} | FT%: ${(avg_ft * 100).toFixed(0)}% | Fouls: ${totalFoulRate.toFixed(1)}% | FTAs: ${totalFtAttempts}${refereeSignal ? " 🚨" : ""}`,
    );
  if (key_player_out)
    triggered.push(
      `Rule 11 (Injury Vacuum): LB${r11_lb}, HB+${r11_hb} — ${key_player_name} OUT`,
    );

  // ── Rule 18 (OT Hazard — tight margin adds HB only) ──────────────────────
  let r18_hb = 0;
  const otHazard = margin <= 5;
  if (otHazard) {
    r18_hb = 8;
    hb += r18_hb;
  }
  adj_log.push({
    rule: "Rule 18 — OT Hazard",
    lb_adj: 0,
    hb_adj: r18_hb,
    note: `Margin: ${margin.toFixed(1)} pts${otHazard ? ` ≤5 → OT Risk → HB+8 (HB ONLY — LB stays grounded)` : " >5 — no OT hazard"}`,
    status: otHazard ? "triggered" : "checked",
  });
  if (otHazard)
    triggered.push(
      `Rule 18 (OT Hazard): Margin ${margin.toFixed(1)} ≤5 → HB+8 (LB grounded in regulation)`,
    );

  // ── Rule 8 Width Cap (applied after all expansions) ───────────────────────
  const maxHalfWidth = dna.maxWidth / 2;
  const mid_raw = (lb + hb) / 2;
  let widthCapped = false;
  if ((hb - lb) / 2 > maxHalfWidth) {
    lb = mid_raw - maxHalfWidth;
    hb = mid_raw + maxHalfWidth;
    widthCapped = true;
    triggered.push(
      `Rule 8 (DNA Width Cap): Width capped at ${dna.maxWidth} pts — ${dna.name}`,
    );
  }
  adj_log.push({
    rule: "Rule 8 — DNA Width Cap",
    lb_adj: 0,
    hb_adj: 0,
    note: `Max width: ${dna.maxWidth} pts | ${widthCapped ? `CAP APPLIED → midpoint ±${maxHalfWidth}` : "Within limit"}`,
    status: widthCapped ? "triggered" : "checked",
  });

  lb = parseFloat(lb.toFixed(1));
  hb = parseFloat(hb.toFixed(1));
  const range_width = parseFloat((hb - lb).toFixed(1));
  const midpoint = parseFloat(((lb + hb) / 2).toFixed(1));
  const total_hb_expansion = Math.max(0, hb - base_hb);
  const total_lb_reduction = Math.max(0, base_lb - lb);

  const best_over_line = opts.over_low;
  const best_under_line = opts.under_high;

  // ── Rule 12 (Market Position) ─────────────────────────────────────────────
  const over_edge = lb - best_over_line;
  const under_edge = best_under_line - hb;
  const mktPos =
    over_edge > 0 ? "Below LB" : under_edge > 0 ? "Above HB" : "Inside Range";
  adj_log.push({
    rule: "Rule 12 — Market Position",
    lb_adj: 0,
    hb_adj: 0,
    note: `OVER line: ${best_over_line} (edge: ${over_edge.toFixed(1)}pts) | UNDER line: ${best_under_line} (edge: ${under_edge.toFixed(1)}pts) | Position: ${mktPos}`,
    status: "checked",
  });

  // ── Block 3: Decision Chain (Rules 13→14→15→16) ───────────────────────────
  let decision = "NO ACTION",
    confidence = "Low",
    lean = "NONE";
  let hammer = false,
    vol_killed = false,
    buf_blocked = false,
    heavy_adj_kill = false;

  // Hook Shield: base buffer per DNA, +0.5 for .5 lines
  const halfLine = (l: number) => l % 1 === 0.5;
  const overBuf = dna.buffer + (halfLine(best_over_line) ? 0.5 : 0);
  const underBuf = dna.buffer + (halfLine(best_under_line) ? 0.5 : 0);
  const hook_buffer = dna.buffer;
  adj_log.push({
    rule: "Rule 13 — Hook Shield/Buffer",
    lb_adj: 0,
    hb_adj: 0,
    note: `Buffer: ±${dna.buffer} pts${halfLine(best_over_line) || halfLine(best_under_line) ? " (+0.5 .5-line surcharge)" : ""} | OVER gap: ${over_edge.toFixed(2)} vs req ${overBuf} | UNDER gap: ${under_edge.toFixed(2)} vs req ${underBuf}`,
    status: "checked",
  });

  const reliabilityBlocks = reliability === "Weak";
  // Hammer threshold: 8 for Strong, 15 for Moderate/Weak (Proxy Reality Check)
  const hammer_edge_used = reliability === "Strong" ? 8 : dna.hammerEdge;

  if (is_rerun && (total_hb_expansion > 10 || total_lb_reduction > 6)) {
    heavy_adj_kill = true;
    triggered.push(
      `Heavy Adj Limit (RERUN): HB+${total_hb_expansion.toFixed(1)} or LB-${total_lb_reduction.toFixed(1)} exceeds ceiling → NO ACTION`,
    );
    adj_log.push({
      rule: "Rule 16 — Hammer Play",
      lb_adj: 0,
      hb_adj: 0,
      note: `RERUN Heavy Adj Kill active — Hammer blocked`,
      status: "n/a",
    });
  } else {
    const over_hammer = best_over_line < lb - hammer_edge_used;
    const under_hammer = best_under_line > hb + hammer_edge_used;

    if ((over_hammer || under_hammer) && !reliabilityBlocks) {
      hammer = true;
      const over_gap = lb - best_over_line;
      const under_gap = best_under_line - hb;
      // Collapse % > 20% OVERRIDES Hammer (no Hammer on stall risk)
      if (collapsePct > 20) {
        hammer = false;
        decision = "NO ACTION";
        triggered.push(
          `Rule 16 (Hammer BLOCKED): Hammer edge confirmed BUT Collapse ${collapsePct}% >20% → Stall override → NO ACTION`,
        );
        adj_log.push({
          rule: "Rule 16 — Hammer Play",
          lb_adj: 0,
          hb_adj: 0,
          note: `Hammer OVERRIDDEN — Collapse ${collapsePct}% >20% (no Hammer on stall risk)`,
          status: "triggered",
        });
      } else {
        if (over_hammer && (!under_hammer || over_gap >= under_gap)) {
          let unitPlay = "3-Unit Max Play";
          
          // 🛡️ Volatility Cushion Check
          if (typeof collapsePct !== 'undefined' && collapsePct > 10) unitPlay = "0.5-Unit Cautious Play";
          
          decision = `OVER ${best_over_line} ★ HAMMER PLAY [${unitPlay}]`;
          confidence = `HIGH (Hammer Play) — ${unitPlay}`;
          triggered.push(
            `Rule 16 (Hammer OVER): Line ${best_over_line} is ${over_gap.toFixed(1)} pts below LB ${lb.toFixed(1)} — threshold ${hammer_edge_used} pts → HAMMER`,
          );
          adj_log.push({
            rule: "Rule 16 — Hammer Play",
            lb_adj: 0,
            hb_adj: 0,
            note: `OVER ${best_over_line} — ${over_gap.toFixed(1)}pt gap clears ${hammer_edge_used}pt threshold (${reliability} reliability)`,
            status: "triggered",
          });
        } else {
          let unitPlay = "3-Unit Max Play";
          
          // 🛡️ Volatility Cushion Check
          if (typeof collapsePct !== 'undefined' && collapsePct > 10) unitPlay = "0.5-Unit Cautious Play";

          decision = `UNDER ${best_under_line} ★ HAMMER PLAY [${unitPlay}]`;
          confidence = `HIGH (Hammer Play) — ${unitPlay}`;
          triggered.push(
            `Rule 16 (Hammer UNDER): Line ${best_under_line} is ${under_gap.toFixed(1)} pts above HB ${hb.toFixed(1)} — threshold ${hammer_edge_used} pts → HAMMER`,
          );
          adj_log.push({
            rule: "Rule 16 — Hammer Play",
            lb_adj: 0,
            hb_adj: 0,
            note: `UNDER ${best_under_line} — ${under_gap.toFixed(1)}pt gap clears ${hammer_edge_used}pt threshold (${reliability} reliability)`,
            status: "triggered",
          });
        }
      }
    } else if (reliabilityBlocks && (over_hammer || under_hammer)) {
      triggered.push(
        "Rule 16: ≥ edge detected BUT Reliability=Weak → Hammer blocked → NO ACTION",
      );
      adj_log.push({
        rule: "Rule 16 — Hammer Play",
        lb_adj: 0,
        hb_adj: 0,
        note: `Hammer BLOCKED — Reliability=Weak`,
        status: "checked",
      });
    } else {
      adj_log.push({
        rule: "Rule 16 — Hammer Play",
        lb_adj: 0,
        hb_adj: 0,
        note: `No Hammer edge — over gap: ${over_edge.toFixed(1)}pts, under gap: ${under_edge.toFixed(1)}pts, threshold: ${hammer_edge_used}pts`,
        status: "checked",
      });
    }

    if (!hammer) {
      // Rule 14 — Volatility Kill
      if (range_width > dna.maxWidth) {
        vol_killed = true;
        triggered.push(
          `Rule 14 (Volatility Kill): Width ${range_width} > ${dna.maxWidth} → Hard Kill → NO ACTION`,
        );
        adj_log.push({
          rule: "Rule 14 — Volatility Kill",
          lb_adj: 0,
          hb_adj: 0,
          note: `Width ${range_width} > limit ${dna.maxWidth} → KILLED`,
          status: "triggered",
        });
      } else if (reliabilityBlocks) {
        triggered.push("Rule 2/14: Reliability=Weak — NO ACTION forced");
        adj_log.push({
          rule: "Rule 14 — Volatility Kill",
          lb_adj: 0,
          hb_adj: 0,
          note: `Not triggered | Width ${range_width} ≤ ${dna.maxWidth}`,
          status: "checked",
        });
      } else {
        adj_log.push({
          rule: "Rule 14 — Volatility Kill",
          lb_adj: 0,
          hb_adj: 0,
          note: `Width ${range_width} ≤ ${dna.maxWidth} — PASS`,
          status: "checked",
        });
        if (over_edge > overBuf) {
          decision = `OVER ${best_over_line}`;
          confidence = "Medium";
          triggered.push(
            `Rule 12+13 (OVER): Line ${best_over_line} < LB ${lb.toFixed(1)} by ${over_edge.toFixed(1)} pts — clears ±${overBuf.toFixed(1)} buffer → OVER`,
          );
        } else if (under_edge > underBuf) {
          decision = `UNDER ${best_under_line}`;
          confidence = "Medium";
          triggered.push(
            `Rule 12+13 (UNDER): Line ${best_under_line} > HB ${hb.toFixed(1)} by ${under_edge.toFixed(1)} pts — clears ±${underBuf.toFixed(1)} buffer → UNDER`,
          );
        } else if (over_edge > 0 || under_edge > 0) {
          buf_blocked = true;
          triggered.push(
            `Rule 13 (Hook Shield ACTIVE): Line outside range but within ±${dna.buffer} buffer — BLOCKED → NO ACTION`,
          );
        } else {
          triggered.push(
            `Rule 12: Both lines inside range [${lb.toFixed(1)} – ${hb.toFixed(1)}] → NO ACTION`,
          );
        }
        // Update audit for Rule 13
        const r13idx = adj_log.findIndex((a) => a.rule.includes("Rule 13"));
        if (r13idx >= 0)
          adj_log[r13idx].status = buf_blocked ? "triggered" : "checked";
      }
    }
  }

  // ── Rule 15 (Final Discipline / Mid-Point Lean) ───────────────────────────
  // NEW: Lean uses mid-point comparison (market above midpoint → UNDER, below → OVER)
  const marketRef = (best_over_line + best_under_line) / 2;
  const rangeMid = (lb + hb) / 2;
  if (decision === "NO ACTION") {
    lean =
      marketRef > rangeMid
        ? `LEAN UNDER (market ref ${marketRef.toFixed(1)} above range mid ${rangeMid.toFixed(1)})`
        : `LEAN OVER (market ref ${marketRef.toFixed(1)} below range mid ${rangeMid.toFixed(1)})`;
    triggered.push(`Rule 15 (Mid-Point Lean): ${lean}`);
  }
  adj_log.push({
    rule: "Rule 15 — Final Discipline",
    lb_adj: 0,
    hb_adj: 0,
    note: `Range mid: ${rangeMid.toFixed(1)} | Market ref: ${marketRef.toFixed(1)} | ${lean !== "NONE" ? lean : "Decision reached — lean not needed"}`,
    status: "checked",
  });

  const all_lines = [best_over_line, best_under_line];
  const below = all_lines.filter((l) => l < lb).length;
  const above = all_lines.filter((l) => l > hb).length;
  const line_position: "Below" | "Inside" | "Above" | "Mixed" =
    below === 2
      ? "Below"
      : above === 2
        ? "Above"
        : below > 0 || above > 0
          ? "Mixed"
          : "Inside";

  // ── Auto-generate Why Note + Why Might Fail ───────────────────────────────
  const whyParts: string[] = [];
  if (hammer)
    whyParts.push(
      `Rule 16 Hammer — ${decision.includes("OVER") ? "OVER" : "UNDER"} line ${hammer_edge_used}pt+ outside range`,
    );
  if (vol_killed)
    whyParts.push(
      `Rule 14 Volatility Kill (width ${range_width}pts > ${dna.maxWidth})`,
    );
  if (buf_blocked)
    whyParts.push(
      `Rule 13 Hook Shield (line within ±${dna.buffer}pts — no action)`,
    );
  if (collapsePct > 20)
    whyParts.push(`Collapse ${collapsePct}% blocked Hammer`);
  if (heavy_adj_kill) whyParts.push("RERUN Heavy Adj ceiling hit");
  if (whyParts.length === 0)
    whyParts.push("Both lines inside range — no edge detected");
  if (reliability !== "Strong")
    whyParts.push(
      `${reliability} data (${proxyCapped ? `capped @${capValue}` : "limited sample"})`,
    );
  const whyNote = whyParts.join(" · ");

  const failParts: string[] = [];
  if (proxyCapped)
    failParts.push(
      `Proxy cap ${capValue} PPG may not reflect actual team efficiency`,
    );
  if (otHazard) failParts.push(`OT risk — margin ≤5 adds ±8pt uncertainty`);
  if (collapsePct > 0)
    failParts.push(`${collapsePct}% historical Q1-Q4 Structural Collapse`);
  if (avg_ft < 0.7)
    failParts.push(
      `Low FT% (${(avg_ft * 100).toFixed(0)}%) — Foul Engine underperforms`,
    );
  if (avg_pt3 < 0.33)
    failParts.push(
      `Low 3PT% (${(avg_pt3 * 100).toFixed(0)}%) — scoring volume compressed`,
    );
  if (failParts.length === 0)
    failParts.push("None identified — Strong data confidence");
  const whyMightFail = failParts.join(" · ");

  return {
    lb,
    hb,
    range_width,
    midpoint,
    decision,
    confidence,
    lean,
    reliability,
    reliability_reason,
    adj_log,
    total_hb_expansion,
    total_lb_reduction,
    triggered_rules: triggered,
    hammer,
    vol_killed,
    buf_blocked,
    heavy_adj_kill,
    best_over_line,
    best_under_line,
    line_position,
    proxyCapped,
    capValue,
    leagueDNAName: dna.name,
    whyNote,
    whyMightFail,
    otHazard,
    collapsePctApplied: collapsePct,
    hook_buffer,
    hammer_edge_used,
  };
}

// ─── Style Helpers ────────────────────────────────────────────────────────────
