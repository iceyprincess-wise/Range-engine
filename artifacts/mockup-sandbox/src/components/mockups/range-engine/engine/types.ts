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
  homeQuarters?: any;
  awayQuarters?: any;
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

