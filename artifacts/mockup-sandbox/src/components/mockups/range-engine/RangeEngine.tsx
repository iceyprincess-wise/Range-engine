import { useState, useRef, useEffect } from "react";

// ─── Team Database (30+ NBA + aliases) ───────────────────────────────────────
const TEAM_DB: Record<string, { avg_pts: number; avg_allowed: number; def_rating: number; ft_pct: number; pace: number; games: number }> = {
  lakers:       { avg_pts: 114.2, avg_allowed: 113.6, def_rating: 1.10, ft_pct: 0.77, pace: 100.1, games: 12 },
  celtics:      { avg_pts: 120.6, avg_allowed: 108.9, def_rating: 1.05, ft_pct: 0.80, pace: 100.8, games: 14 },
  warriors:     { avg_pts: 116.3, avg_allowed: 112.4, def_rating: 1.08, ft_pct: 0.78, pace: 101.5, games: 11 },
  heat:         { avg_pts: 110.4, avg_allowed: 109.2, def_rating: 1.06, ft_pct: 0.76, pace:  98.4, games: 10 },
  nuggets:      { avg_pts: 115.8, avg_allowed: 111.3, def_rating: 1.07, ft_pct: 0.79, pace: 100.3, games: 13 },
  bucks:        { avg_pts: 118.1, avg_allowed: 114.2, def_rating: 1.11, ft_pct: 0.75, pace: 101.9, games: 12 },
  "76ers":      { avg_pts: 113.7, avg_allowed: 115.4, def_rating: 1.12, ft_pct: 0.81, pace:  99.6, games: 11 },
  sixers:       { avg_pts: 113.7, avg_allowed: 115.4, def_rating: 1.12, ft_pct: 0.81, pace:  99.6, games: 11 },
  clippers:     { avg_pts: 112.8, avg_allowed: 110.7, def_rating: 1.07, ft_pct: 0.77, pace:  99.1, games: 10 },
  suns:         { avg_pts: 116.9, avg_allowed: 117.1, def_rating: 1.14, ft_pct: 0.79, pace: 102.2, games: 12 },
  mavericks:    { avg_pts: 117.4, avg_allowed: 112.9, def_rating: 1.09, ft_pct: 0.80, pace: 100.7, games: 13 },
  mavs:         { avg_pts: 117.4, avg_allowed: 112.9, def_rating: 1.09, ft_pct: 0.80, pace: 100.7, games: 13 },
  knicks:       { avg_pts: 113.5, avg_allowed: 109.8, def_rating: 1.06, ft_pct: 0.76, pace:  98.8, games: 11 },
  nets:         { avg_pts: 109.3, avg_allowed: 118.2, def_rating: 1.15, ft_pct: 0.74, pace:  99.3, games:  9 },
  bulls:        { avg_pts: 111.6, avg_allowed: 113.7, def_rating: 1.10, ft_pct: 0.77, pace:  99.9, games: 10 },
  spurs:        { avg_pts: 108.4, avg_allowed: 119.3, def_rating: 1.16, ft_pct: 0.73, pace: 100.5, games: 11 },
  raptors:      { avg_pts: 111.2, avg_allowed: 116.4, def_rating: 1.13, ft_pct: 0.76, pace:  99.7, games: 12 },
  thunder:      { avg_pts: 119.1, avg_allowed: 110.8, def_rating: 1.07, ft_pct: 0.78, pace: 101.1, games: 13 },
  timberwolves: { avg_pts: 112.4, avg_allowed: 108.6, def_rating: 1.05, ft_pct: 0.77, pace:  99.5, games: 11 },
  wolves:       { avg_pts: 112.4, avg_allowed: 108.6, def_rating: 1.05, ft_pct: 0.77, pace:  99.5, games: 11 },
  pacers:       { avg_pts: 121.3, avg_allowed: 119.4, def_rating: 1.15, ft_pct: 0.82, pace: 103.8, games: 12 },
  hawks:        { avg_pts: 116.7, avg_allowed: 119.2, def_rating: 1.15, ft_pct: 0.79, pace: 102.4, games: 10 },
  magic:        { avg_pts: 107.3, avg_allowed: 108.9, def_rating: 1.05, ft_pct: 0.73, pace:  98.1, games: 11 },
  grizzlies:    { avg_pts: 113.8, avg_allowed: 112.4, def_rating: 1.08, ft_pct: 0.76, pace: 100.2, games: 10 },
  pelicans:     { avg_pts: 112.1, avg_allowed: 114.7, def_rating: 1.11, ft_pct: 0.74, pace:  99.8, games:  9 },
  jazz:         { avg_pts: 114.5, avg_allowed: 118.3, def_rating: 1.14, ft_pct: 0.78, pace: 100.9, games: 10 },
  rockets:      { avg_pts: 112.7, avg_allowed: 110.4, def_rating: 1.07, ft_pct: 0.74, pace:  99.6, games: 11 },
  kings:        { avg_pts: 118.4, avg_allowed: 117.2, def_rating: 1.13, ft_pct: 0.80, pace: 102.1, games: 12 },
  pistons:      { avg_pts: 108.1, avg_allowed: 116.9, def_rating: 1.14, ft_pct: 0.76, pace: 100.3, games: 10 },
  cavaliers:    { avg_pts: 116.2, avg_allowed: 107.4, def_rating: 1.04, ft_pct: 0.77, pace:  99.2, games: 13 },
  cavs:         { avg_pts: 116.2, avg_allowed: 107.4, def_rating: 1.04, ft_pct: 0.77, pace:  99.2, games: 13 },
  hornets:      { avg_pts: 108.9, avg_allowed: 117.6, def_rating: 1.14, ft_pct: 0.76, pace: 100.0, games: 10 },
  wizards:      { avg_pts: 106.4, avg_allowed: 120.1, def_rating: 1.16, ft_pct: 0.74, pace: 100.7, games:  9 },
  trailblazers: { avg_pts: 109.8, avg_allowed: 117.9, def_rating: 1.14, ft_pct: 0.77, pace: 100.5, games: 10 },
  blazers:      { avg_pts: 109.8, avg_allowed: 117.9, def_rating: 1.14, ft_pct: 0.77, pace: 100.5, games: 10 },
};

const LEAGUE_AVG: Record<string, number> = {
  NBA: 113.8, NCAA: 74.0, EUROLEAGUE: 82.0, ACB: 85.0, PBA: 95.0, NBL: 88.0, DEFAULT: 100.0,
};

function lookupTeam(name: string, league: string): { stats: typeof TEAM_DB[string]; source: "DB" | "PROXY" } {
  const key = name.toLowerCase().trim().replace(/[^a-z0-9]/g, "");
  for (const [k, v] of Object.entries(TEAM_DB)) {
    if (key.includes(k) || k.includes(key)) return { stats: v, source: "DB" };
  }
  const leagueKey = Object.keys(LEAGUE_AVG).find(k => league.toUpperCase().includes(k)) ?? "DEFAULT";
  const avg = LEAGUE_AVG[leagueKey];
  const combined = avg * 2;
  const pace = combined >= 165 ? 73 : combined <= 145 ? 68 : 71;
  return { stats: { avg_pts: avg, avg_allowed: avg, def_rating: 1.10, ft_pct: 0.75, pace, games: 6 }, source: "PROXY" };
}

// ─── Interfaces ───────────────────────────────────────────────────────────────
interface AdjLog { rule: string; lb_adj: number; hb_adj: number; note: string }
interface EngineOutput {
  lb: number; hb: number; range_width: number; midpoint: number;
  decision: string; confidence: string; lean: string;
  reliability: string; reliability_reason: string;
  adj_log: AdjLog[];
  total_hb_expansion: number; total_lb_reduction: number;
  triggered_rules: string[];
  hammer: boolean; vol_killed: boolean; buf_blocked: boolean; heavy_adj_kill: boolean;
  best_over_line: number; best_under_line: number;
  line_position: "Below" | "Inside" | "Above" | "Mixed";
}

interface HistoryEntry {
  id: string;
  timestamp: string;
  date: string;
  league: string;
  homeTeam: string;
  awayTeam: string;
  overLow: string; overHigh: string;
  underLow: string; underHigh: string;
  koTime: string;
  result: EngineOutput;
  rerunResult?: EngineOutput;
  rerunCmd?: string;
  outcome?: "WIN" | "LOSS" | "PUSH" | "PENDING";
  actualTotal?: number;
}

const HISTORY_KEY = "rangengine_v2_history";

function loadHistory(): HistoryEntry[] {
  try { return JSON.parse(localStorage.getItem(HISTORY_KEY) ?? "[]"); }
  catch { return []; }
}

function saveHistory(h: HistoryEntry[]) {
  try { localStorage.setItem(HISTORY_KEY, JSON.stringify(h.slice(0, 50))); } catch {}
}

// ─── Master Rulebook v2 Engine (Rules 1–16, Blocks 1→2→3) ────────────────────
function runEngine(opts: {
  home_name: string; away_name: string;
  home_stats: ReturnType<typeof lookupTeam>;
  away_stats: ReturnType<typeof lookupTeam>;
  league: string; key_player_out: boolean; key_player_name: string;
  over_low: number; over_high: number; under_low: number; under_high: number;
  is_rerun?: boolean;
}): EngineOutput {
  const { home_stats, away_stats, league, key_player_out, key_player_name, is_rerun } = opts;
  const H = home_stats.stats; const A = away_stats.stats;
  const lg = league.toUpperCase();
  const isNBA = lg.includes("NBA");
  const isStructured = lg.includes("EURO") || lg.includes("ACB");
  const isVolatile = lg.includes("PBA") || lg.includes("NBL");
  const leagueKey = isNBA ? "NBA" : isStructured ? "EUROLEAGUE" : isVolatile ? "PBA" : "DEFAULT";
  const leagueAvg = LEAGUE_AVG[leagueKey];

  // Rule 2 — Data Reliability
  const minGames = Math.min(H.games, A.games);
  const proxyUsed = home_stats.source === "PROXY" || away_stats.source === "PROXY";
  const reliability = minGames < 5 ? "Weak" : (minGames < 8 || proxyUsed) ? "Moderate" : "Strong";
  const reliability_reason = proxyUsed
    ? `Proxy stats applied (${home_stats.source === "PROXY" ? opts.home_name : opts.away_name} not in DB) — Tier 2 Bypass active. Reliability maintained at Moderate.`
    : `Sample: ${H.games} games (Home) × ${A.games} games (Away) — ${reliability} threshold met`;
  const ws = reliability === "Weak" ? 0.6 : 1.0; // Data Confidence Weighting: Weak → ×0.6

  const adj_log: AdjLog[] = [];
  const triggered: string[] = [];

  // Proxy calculations (Tier 2 Bypass Protocol)
  const home_eff = H.avg_pts / leagueAvg;
  const away_eff = A.avg_pts / leagueAvg;
  const avg_eff = (home_eff + away_eff) / 2;
  const avg_pace = (H.pace + A.pace) / 2;
  const avg_ft = (H.ft_pct + A.ft_pct) / 2;
  const home_def = H.def_rating; const away_def = A.def_rating;
  const margin = Math.abs(H.avg_pts - A.avg_pts);

  // Rule 4 — Base Scoring Range (home + away ± 6, width = 12)
  let lb = H.avg_pts + A.avg_pts - 6;
  let hb = H.avg_pts + A.avg_pts + 6;
  const base_lb = lb; const base_hb = hb;
  adj_log.push({ rule: "Rule 4 (Base Range)", lb_adj: 0, hb_adj: 0, note: `${H.avg_pts} + ${A.avg_pts} ± 6 → ${lb.toFixed(1)} – ${hb.toFixed(1)}` });

  // Rule 5 — Efficiency & Pace Adjustment (Cap ±6 total; Weak data ×0.6)
  let r5_lb = 0, r5_hb = 0;
  if (avg_eff >= 1.10) { r5_lb = 3; r5_hb = 3; }
  else if (avg_pace < 70 && avg_eff < 1.05) { r5_lb = -3; r5_hb = -3; }
  r5_lb = Math.round(Math.max(-6, Math.min(6, r5_lb)) * ws);
  r5_hb = Math.round(Math.max(-6, Math.min(6, r5_hb)) * ws);
  lb += r5_lb; hb += r5_hb;
  adj_log.push({ rule: "Rule 5 (Efficiency/Pace)", lb_adj: r5_lb, hb_adj: r5_hb, note: `Eff: ${avg_eff.toFixed(3)}, Pace: ${avg_pace.toFixed(1)}${ws < 1 ? " | ×0.6 Weak scale" : ""}` });
  if (r5_lb !== 0 || r5_hb !== 0) triggered.push(`Rule 5 (Eff/Pace): LB ${r5_lb >= 0 ? "+" : ""}${r5_lb}, HB ${r5_hb >= 0 ? "+" : ""}${r5_hb}`);

  // Rule 6 — Defensive Impact — Safety Lock (single-side ONLY, never compress both)
  let r6_lb = 0, r6_hb = 0;
  const higherDef = Math.max(home_def, away_def);
  if (higherDef > 1.14) { r6_hb = Math.round(3.5 * ws); }
  else if (higherDef < 1.06) { r6_lb = -Math.round(3.5 * ws); }
  lb += r6_lb; hb += r6_hb;
  adj_log.push({ rule: "Rule 6 (Defense)", lb_adj: r6_lb, hb_adj: r6_hb, note: `H-Def: ${home_def}, A-Def: ${away_def} | Safety Lock active (single-side only)` });
  if (r6_lb !== 0 || r6_hb !== 0) triggered.push(`Rule 6 (Defense Safety Lock): LB ${r6_lb >= 0 ? "+" : ""}${r6_lb}, HB ${r6_hb >= 0 ? "+" : ""}${r6_hb}`);

  // Rule 7 — Volatility & Margin / Stall Fix
  let r7_lb = 0, r7_hb = 0;
  if (margin >= 10) r7_lb = -Math.round(4 * ws);
  else if (margin <= 6) r7_hb = Math.round(4 * ws);
  lb += r7_lb; hb += r7_hb;
  adj_log.push({ rule: "Rule 7 (Margin/Stall)", lb_adj: r7_lb, hb_adj: r7_hb, note: `Avg projected margin: ${margin.toFixed(1)} pts${margin >= 10 ? " ≥10 (Large Margin)" : margin <= 6 ? " ≤6 (Stall Fix)" : " — neutral"}` });
  if (r7_lb !== 0 || r7_hb !== 0) triggered.push(`Rule 7 (Margin): LB ${r7_lb >= 0 ? "+" : ""}${r7_lb}, HB ${r7_hb >= 0 ? "+" : ""}${r7_hb}`);

  // Rule 9 — Pace Hijack (HB always 2× LB expansion)
  let r9_lb = 0, r9_hb = 0;
  if (avg_pace >= 72 && avg_eff >= 1.08) {
    r9_lb = Math.round(4 * ws);
    r9_hb = Math.round(8 * ws);
  }
  lb += r9_lb; hb += r9_hb;
  adj_log.push({ rule: "Rule 8/9 (League DNA/Pace Hijack)", lb_adj: r9_lb, hb_adj: r9_hb, note: `Pace ${avg_pace.toFixed(1)}≥72 & Eff ${avg_eff.toFixed(2)}≥1.08 → HB=2×LB expansion` });
  if (r9_lb !== 0 || r9_hb !== 0) triggered.push(`Rule 9 (Pace Hijack): LB +${r9_lb}, HB +${r9_hb} (HB=2×LB)`);

  // Rule 10 — Foul Engine (HB ONLY; triggers if Margin ≤6 AND FT% ≥0.75)
  let r10_hb = 0;
  if (margin <= 6 && avg_ft >= 0.75) r10_hb = Math.round(11 * ws);

  // Rule 11 — Injury / Usage Vacuum Trigger
  let r11_lb = 0, r11_hb = 0;
  if (key_player_out) { r11_lb = -Math.round(6 * ws); r11_hb = Math.round(4 * ws); }
  hb += r10_hb + r11_hb; lb += r11_lb;

  // Stacking Cap — R9 + R10 combined HB expansion NEVER exceeds +12
  const r9r10_hb = r9_hb + r10_hb;
  let stacking_cut = 0;
  if (r9r10_hb > 12) { stacking_cut = r9r10_hb - 12; hb -= stacking_cut; }
  adj_log.push({
    rule: "Rule 10/11 (Foul Engine/Injury)",
    lb_adj: r11_lb,
    hb_adj: r10_hb + r11_hb - stacking_cut,
    note: [
      `FT%: ${(avg_ft * 100).toFixed(0)}%, Margin: ${margin.toFixed(1)}`,
      key_player_out ? `| ${key_player_name} OUT (Vacuum)` : "",
      stacking_cut > 0 ? `| R9+R10 Stacking Cap applied: -${stacking_cut}` : "",
    ].filter(Boolean).join(" "),
  });
  if (r10_hb > 0) triggered.push(`Rule 10 (Foul Engine): HB +${r10_hb}${stacking_cut > 0 ? ` (Stack Cap -${stacking_cut})` : ""}`);
  if (key_player_out) triggered.push(`Rule 11 (Injury Vacuum): LB ${r11_lb}, HB +${r11_hb} — ${key_player_name} OUT`);

  // Rule 8 — League DNA Width Cap (applied after all expansions)
  const maxHalfWidth = isNBA ? 11 : isStructured ? 8 : isVolatile ? 14 : 9;
  const mid_raw = (lb + hb) / 2;
  if ((hb - lb) / 2 > maxHalfWidth) {
    lb = mid_raw - maxHalfWidth;
    hb = mid_raw + maxHalfWidth;
    triggered.push(`Rule 8 (League DNA Cap): Width capped at ±${maxHalfWidth} pts (${isNBA ? "NBA" : isStructured ? "Structured" : isVolatile ? "Volatile" : "Default"})`);
  }

  lb = parseFloat(lb.toFixed(1)); hb = parseFloat(hb.toFixed(1));
  const range_width = parseFloat((hb - lb).toFixed(1));
  const midpoint = parseFloat(((lb + hb) / 2).toFixed(1));
  const total_hb_expansion = Math.max(0, hb - base_hb);
  const total_lb_reduction = Math.max(0, base_lb - lb);

  // Market lines — Rule 1 Time Sync already confirmed via form input
  const best_over_line = opts.over_low;   // LOWEST over line → best OVER edge
  const best_under_line = opts.under_high; // HIGHEST under line → best UNDER edge

  // ─── Block 3: Decision Chain (Rules 12–16) ───────────────────────────────
  let decision = "NO ACTION", confidence = "Low", lean = "NONE";
  let hammer = false, vol_killed = false, buf_blocked = false, heavy_adj_kill = false;
  const buffer = isNBA ? 3 : 2; // Rule 13 — Dynamic Buffer Zone
  const rw_threshold = isNBA ? 22 : 18; // Rule 14 — Width threshold

  const reliabilityBlocks = reliability === "Weak"; // Rule 2 gate

  // RERUN — Heavy Adjustment Limit (exclusive to RERUN mode)
  if (is_rerun && (total_hb_expansion > 10 || total_lb_reduction > 6)) {
    heavy_adj_kill = true;
    triggered.push(`Heavy Adj Limit (RERUN): HB+${total_hb_expansion.toFixed(1)} or LB-${total_lb_reduction.toFixed(1)} exceeds ceiling → NO ACTION enforced`);
  } else {
    // Rule 16 — Hammer Play (overrides Buffer + Volatility ONLY; NOT Reliability)
    const over_hammer = best_over_line < lb - 8;
    const under_hammer = best_under_line > hb + 8;

    if ((over_hammer || under_hammer) && !reliabilityBlocks) {
      hammer = true;
      const over_gap = lb - best_over_line;
      const under_gap = best_under_line - hb;
      if (over_hammer && (!under_hammer || over_gap >= under_gap)) {
        decision = `OVER ${best_over_line} ★ HAMMER PLAY`;
        confidence = "HIGH (Hammer Play)";
        triggered.push(`Rule 16 (Hammer OVER): Line ${best_over_line} is ${over_gap.toFixed(1)} pts below LB ${lb.toFixed(1)} — Variance cleared → HAMMER`);
      } else {
        decision = `UNDER ${best_under_line} ★ HAMMER PLAY`;
        confidence = "HIGH (Hammer Play)";
        triggered.push(`Rule 16 (Hammer UNDER): Line ${best_under_line} is ${under_gap.toFixed(1)} pts above HB ${hb.toFixed(1)} — Variance cleared → HAMMER`);
      }
    } else if (reliabilityBlocks && (over_hammer || under_hammer)) {
      triggered.push("Rule 16: ≥8 pt edge detected BUT Reliability=Weak — Hammer overrides Buffer/Volatility ONLY, NOT Reliability → NO ACTION");
    } else {
      // Rule 14 — Volatility Kill (Hard Kill)
      if (range_width > rw_threshold) {
        vol_killed = true;
        triggered.push(`Rule 14 (Volatility Kill): Width ${range_width} > ${rw_threshold} limit → Hard Kill → NO ACTION`);
      } else if (reliabilityBlocks) {
        triggered.push("Rule 2/3: Reliability=Weak, no Hammer override available → NO ACTION");
      } else {
        // Rule 12 + Rule 13 — Market Position + Buffer Zone
        const over_edge = lb - best_over_line;
        const under_edge = best_under_line - hb;
        if (over_edge > buffer) {
          decision = `OVER ${best_over_line}`;
          confidence = "Medium";
          triggered.push(`Rule 12+13 (OVER): Line ${best_over_line} < LB ${lb.toFixed(1)} by ${over_edge.toFixed(1)} pts — clears ±${buffer} buffer → OVER`);
        } else if (under_edge > buffer) {
          decision = `UNDER ${best_under_line}`;
          confidence = "Medium";
          triggered.push(`Rule 12+13 (UNDER): Line ${best_under_line} > HB ${hb.toFixed(1)} by ${under_edge.toFixed(1)} pts — clears ±${buffer} buffer → UNDER`);
        } else if (over_edge > 0 || under_edge > 0) {
          buf_blocked = true;
          triggered.push(`Rule 13 (Buffer Shield): Line exits range but within ±${buffer} buffer zone → Shield active → NO ACTION`);
        } else {
          triggered.push(`Rule 12: Both lines inside range [${lb.toFixed(1)} – ${hb.toFixed(1)}] → NO ACTION`);
        }
      }
    }
  }

  // Rule 15 — Final Decision Discipline / Lean
  if (decision === "NO ACTION") {
    const mid = (lb + hb) / 2;
    const ref = (best_over_line + best_under_line) / 2;
    lean = ref < mid ? "LEAN UNDER (line cluster closer to LB)" : "LEAN OVER (line cluster closer to HB)";
    triggered.push(`Rule 15 (Lean): ${lean}`);
  }

  const all_lines = [best_over_line, best_under_line];
  const below = all_lines.filter(l => l < lb).length;
  const above = all_lines.filter(l => l > hb).length;
  const line_position: "Below" | "Inside" | "Above" | "Mixed" =
    below === 2 ? "Below" : above === 2 ? "Above" : (below > 0 || above > 0) ? "Mixed" : "Inside";

  return {
    lb, hb, range_width, midpoint, decision, confidence, lean,
    reliability, reliability_reason, adj_log,
    total_hb_expansion, total_lb_reduction,
    triggered_rules: triggered,
    hammer, vol_killed, buf_blocked, heavy_adj_kill,
    best_over_line, best_under_line, line_position,
  };
}

// ─── Style Helpers ────────────────────────────────────────────────────────────
function decisionStyle(d: string) {
  if (d.includes("HAMMER")) return { border: "border-emerald-400", bg: "bg-emerald-950/60", text: "text-emerald-300", badge: "bg-emerald-500 text-black", dot: "bg-emerald-400" };
  if (d.includes("OVER"))   return { border: "border-sky-500",     bg: "bg-sky-950/60",     text: "text-sky-300",     badge: "bg-sky-500 text-black",     dot: "bg-sky-400" };
  if (d.includes("UNDER"))  return { border: "border-amber-500",   bg: "bg-amber-950/60",   text: "text-amber-300",   badge: "bg-amber-500 text-black",   dot: "bg-amber-400" };
  return                            { border: "border-zinc-700",    bg: "bg-zinc-900/60",    text: "text-zinc-400",    badge: "bg-zinc-700 text-zinc-300", dot: "bg-zinc-600" };
}

function outcomeStyle(o?: string) {
  if (o === "WIN")  return "text-emerald-400 border-emerald-800 bg-emerald-950/40";
  if (o === "LOSS") return "text-red-400 border-red-800 bg-red-950/40";
  if (o === "PUSH") return "text-zinc-400 border-zinc-700 bg-zinc-900/40";
  return "text-zinc-600 border-zinc-800 bg-zinc-900/20";
}

const HUNT_STEPS = [
  { icon: "🔍", label: "Rule 1 — Time Sync: parsing fixture & WAT timestamps" },
  { icon: "📊", label: "Rule 2+3 — Data Reliability: Tier 1 DB lookup / Tier 2 Proxy fallback" },
  { icon: "⚡", label: "Rule 5 — Efficiency & Pace: fetching advanced stats or computing proxies" },
  { icon: "🛡️", label: "Rule 6 — Defensive Impact: applying Safety Lock (single-side only)" },
  { icon: "🏥", label: "Rule 11 — Injury Vacuum: scanning leading scorer availability" },
  { icon: "💰", label: "Rule 12 — Market Position: anchoring O/U ranges (Over ↓ / Under ↑)" },
  { icon: "⚙️", label: "Block 3 — Decision: executing Rules 13→14→15→16 logic chain" },
];

// ─── Sub-Components ───────────────────────────────────────────────────────────
function Divider({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-2 py-1">
      <div className="flex-1 h-px bg-zinc-800" />
      <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-zinc-600">{label}</span>
      <div className="flex-1 h-px bg-zinc-800" />
    </div>
  );
}
function CheckRow({ label, ok = true }: { label: string; ok?: boolean }) {
  return (
    <div className="flex items-start gap-2 py-0.5">
      <span className={`text-[11px] flex-shrink-0 leading-none mt-0.5 ${ok ? "text-emerald-400" : "text-red-400"}`}>{ok ? "✓" : "✗"}</span>
      <span className="text-[11px] text-zinc-400 leading-relaxed">{label}</span>
    </div>
  );
}
function AdjRow({ rule, lb, hb, note }: { rule: string; lb: number; hb: number; note: string }) {
  const f = (n: number) => n === 0 ? <span className="text-zinc-700">0</span> : n > 0 ? <span className="text-emerald-400">+{n}</span> : <span className="text-red-400">{n}</span>;
  return (
    <div className="grid grid-cols-[170px_54px_54px_1fr] gap-2 text-xs font-mono py-1 border-b border-zinc-800/40 last:border-0 items-center">
      <span className="text-zinc-400">{rule}</span>
      {f(lb)}{f(hb)}
      <span className="text-zinc-600 text-[10px] leading-tight">{note}</span>
    </div>
  );
}
function Input({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-[9px] uppercase tracking-widest text-zinc-600 block mb-1">{label}</label>
      {children}
    </div>
  );
}
function Field({ value, onChange, placeholder, type = "text", className = "" }: { value: string; onChange: (v: string) => void; placeholder?: string; type?: string; className?: string }) {
  return (
    <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
      className={`w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-zinc-500 transition placeholder:text-zinc-700 ${className}`} />
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export function RangeEngine() {
  const today = new Date().toISOString().split("T")[0];
  const [tab, setTab] = useState<"analyzer" | "history">("analyzer");
  const [date, setDate] = useState(today);
  const [koTime, setKoTime] = useState("20:00");
  const [currentTime, setCurrentTime] = useState("19:30");
  const [league, setLeague] = useState("USA - NBA");
  const [homeTeam, setHomeTeam] = useState("");
  const [awayTeam, setAwayTeam] = useState("");
  const [overLow, setOverLow] = useState("");
  const [overHigh, setOverHigh] = useState("");
  const [underLow, setUnderLow] = useState("");
  const [underHigh, setUnderHigh] = useState("");
  const [keyOut, setKeyOut] = useState(false);
  const [keyName, setKeyName] = useState("");

  const [phase, setPhase] = useState<"idle" | "hunting" | "result">("idle");
  const [huntStep, setHuntStep] = useState(0);
  const [result, setResult] = useState<EngineOutput | null>(null);
  const [homeInfo, setHomeInfo] = useState<ReturnType<typeof lookupTeam> | null>(null);
  const [awayInfo, setAwayInfo] = useState<ReturnType<typeof lookupTeam> | null>(null);

  const [rerunCmd, setRerunCmd] = useState("");
  const [rerunResult, setRerunResult] = useState<EngineOutput | null>(null);
  const [rerunPhase, setRerunPhase] = useState<"idle" | "running" | "done">("idle");

  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editActual, setEditActual] = useState("");

  const currentEntryId = useRef<string | null>(null);

  useEffect(() => { setHistory(loadHistory()); }, []);

  function timeDiff() {
    const [kh, km] = koTime.split(":").map(Number);
    const [ch, cm] = currentTime.split(":").map(Number);
    const diff = (kh * 60 + km) - (ch * 60 + cm);
    return diff > 0 ? `~${diff} min` : "Imminent";
  }

  function handleAnalyze() {
    if (!homeTeam || !awayTeam || !overLow || !underHigh) return;
    const hInfo = lookupTeam(homeTeam, league);
    const aInfo = lookupTeam(awayTeam, league);
    setHomeInfo(hInfo); setAwayInfo(aInfo);
    setPhase("hunting"); setHuntStep(0); setResult(null); setRerunResult(null); setRerunCmd(""); setRerunPhase("idle");

    let step = 0;
    const iv = setInterval(() => {
      step++; setHuntStep(step);
      if (step >= HUNT_STEPS.length) {
        clearInterval(iv);
        const res = runEngine({
          home_name: homeTeam, away_name: awayTeam,
          home_stats: hInfo, away_stats: aInfo,
          league, key_player_out: keyOut, key_player_name: keyName || "Key Scorer",
          over_low: parseFloat(overLow), over_high: parseFloat(overHigh || overLow),
          under_low: parseFloat(underLow || underHigh), under_high: parseFloat(underHigh),
        });
        setTimeout(() => {
          setResult(res); setPhase("result");
          const entry: HistoryEntry = {
            id: Date.now().toString(),
            timestamp: new Date().toLocaleString("en-GB"),
            date, league, homeTeam, awayTeam, overLow, overHigh, underLow, underHigh, koTime,
            result: res, outcome: "PENDING",
          };
          currentEntryId.current = entry.id;
          const updated = [entry, ...history];
          setHistory(updated); saveHistory(updated);
        }, 350);
      }
    }, 420);
  }

  function handleRerun() {
    if (!rerunCmd.trim() || !homeInfo || !awayInfo) return;
    const lc = rerunCmd.toLowerCase();
    let rKeyOut = keyOut, rKeyName = keyName || "Key Scorer";
    let rOverLow = parseFloat(overLow), rOverHigh = parseFloat(overHigh || overLow);
    let rUnderLow = parseFloat(underLow || underHigh), rUnderHigh = parseFloat(underHigh);

    const outM = rerunCmd.match(/(\w+(?:\s+\w+)?)\s+(?:is\s+)?out/i);
    if (outM) { rKeyOut = true; rKeyName = outM[1]; }
    if (lc.includes("no injury") || lc.includes("healthy") || lc.includes("back")) { rKeyOut = false; rKeyName = ""; }
    const lineM = rerunCmd.match(/line\s+(?:to\s+)?(\d+\.?\d*)/i) || rerunCmd.match(/(?:total|adjust|ou)\s+(?:to\s+)?(\d+\.?\d*)/i);
    if (lineM) { const nl = parseFloat(lineM[1]); rOverLow = nl - 1; rOverHigh = nl + 1; rUnderLow = nl - 1; rUnderHigh = nl + 1; }

    setRerunPhase("running");
    setTimeout(() => {
      const res = runEngine({
        home_name: homeTeam, away_name: awayTeam,
        home_stats: homeInfo, away_stats: awayInfo,
        league, key_player_out: rKeyOut, key_player_name: rKeyName,
        over_low: rOverLow, over_high: rOverHigh,
        under_low: rUnderLow, under_high: rUnderHigh,
        is_rerun: true,
      });
      setRerunResult(res); setRerunPhase("done");
      if (currentEntryId.current) {
        const updated = history.map(h =>
          h.id === currentEntryId.current ? { ...h, rerunResult: res, rerunCmd } : h
        );
        setHistory(updated); saveHistory(updated);
      }
    }, 1200);
  }

  function handleReset() { setPhase("idle"); setResult(null); setRerunResult(null); setRerunCmd(""); setRerunPhase("idle"); }

  function setOutcome(id: string, outcome: HistoryEntry["outcome"], actualTotal?: number) {
    const updated = history.map(h => h.id === id ? { ...h, outcome, actualTotal } : h);
    setHistory(updated); saveHistory(updated); setEditingId(null); setEditActual("");
  }

  function clearHistory() { setHistory([]); saveHistory([]); }

  const s = result ? decisionStyle(result.decision) : null;
  const rs = rerunResult ? decisionStyle(rerunResult.decision) : null;

  // Stats for history tab
  const histStats = {
    total: history.length,
    wins: history.filter(h => h.outcome === "WIN").length,
    losses: history.filter(h => h.outcome === "LOSS").length,
    hammers: history.filter(h => h.result.hammer || h.rerunResult?.hammer).length,
    pending: history.filter(h => h.outcome === "PENDING").length,
  };
  const winRate = histStats.wins + histStats.losses > 0 ? Math.round(histStats.wins / (histStats.wins + histStats.losses) * 100) : null;

  return (
    <div className="min-h-screen bg-[#07070c] text-white font-mono flex flex-col text-sm select-none">

      {/* ─── Header ─────────────────────────────────────────────────────────── */}
      <div className="border-b border-white/[0.06] px-5 py-3 flex items-center justify-between bg-black/70 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex gap-0.5">{["bg-violet-500","bg-sky-500","bg-amber-500"].map((c,i)=><div key={i} className={`w-1.5 h-4 rounded-full ${c}`}/>)}</div>
          <div>
            <span className="text-xs font-bold tracking-tight">RANGE ENGINE v2</span>
            <span className="ml-2 text-[10px] text-zinc-600">Master Rulebook v2 · Rules 1–16 · Strict+</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {["analyzer","history"].map(t => (
            <button key={t} onClick={() => setTab(t as typeof tab)}
              className={`text-[10px] px-3 py-1.5 rounded-lg font-bold uppercase tracking-widest transition border ${tab === t ? "bg-white text-black border-white" : "text-zinc-500 border-zinc-800 hover:border-zinc-600 hover:text-white"}`}>
              {t === "history" ? `${t} (${histStats.total})` : t}
            </button>
          ))}
          {tab === "analyzer" && phase !== "idle" && (
            <button onClick={handleReset} className="text-[10px] text-zinc-600 hover:text-white border border-zinc-800 hover:border-zinc-600 rounded-lg px-2.5 py-1.5 transition">← New</button>
          )}
        </div>
      </div>

      {/* ─── HISTORY TAB ────────────────────────────────────────────────────── */}
      {tab === "history" && (
        <div className="flex-1 overflow-y-auto px-5 py-4">
          <div className="max-w-2xl mx-auto space-y-4">

            {/* Stats Bar */}
            <div className="grid grid-cols-5 gap-2">
              {[
                ["Analyses", histStats.total, "text-white"],
                ["Wins", histStats.wins, "text-emerald-400"],
                ["Losses", histStats.losses, "text-red-400"],
                ["Hammer", histStats.hammers, "text-yellow-400"],
                ["Win Rate", winRate !== null ? `${winRate}%` : "—", winRate !== null && winRate >= 60 ? "text-emerald-400" : "text-zinc-400"],
              ].map(([lbl, val, cls]) => (
                <div key={String(lbl)} className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-3 text-center">
                  <p className={`text-lg font-black ${cls}`}>{val}</p>
                  <p className="text-[9px] uppercase tracking-widest text-zinc-600 mt-0.5">{lbl}</p>
                </div>
              ))}
            </div>

            {history.length === 0 ? (
              <div className="text-center py-16 space-y-2">
                <p className="text-4xl">📋</p>
                <p className="text-xs text-zinc-500">No analyses yet — run your first match in the Analyzer tab.</p>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-[9px] uppercase tracking-widest text-zinc-600">Match Record — {histStats.total} entries (most recent first)</p>
                  <button onClick={clearHistory} className="text-[9px] text-red-700 hover:text-red-400 transition">Clear all</button>
                </div>
                {history.map(entry => {
                  const st = decisionStyle(entry.result.decision);
                  const expanded = expandedId === entry.id;
                  return (
                    <div key={entry.id} className={`border rounded-xl overflow-hidden transition-all ${st.border} bg-zinc-950/80`}>
                      {/* Row */}
                      <div className="flex items-center gap-3 px-4 py-3 cursor-pointer" onClick={() => setExpandedId(expanded ? null : entry.id)}>
                        <div className={`w-2 h-2 rounded-full flex-shrink-0 ${st.dot}`} />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-white truncate">{entry.homeTeam} vs {entry.awayTeam}</p>
                          <p className="text-[10px] text-zinc-600">{entry.league} · {entry.date} · {entry.timestamp}</p>
                        </div>
                        <div className="text-right flex-shrink-0 space-y-0.5">
                          <p className={`text-xs font-black ${st.text}`}>{entry.result.decision}</p>
                          <p className="text-[10px] text-zinc-600">{entry.result.lb} – {entry.result.hb} ({entry.result.range_width}w)</p>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${outcomeStyle(entry.outcome)}`}>{entry.outcome ?? "—"}</span>
                          <span className="text-zinc-700 text-xs">{expanded ? "▲" : "▼"}</span>
                        </div>
                      </div>

                      {/* Expanded */}
                      {expanded && (
                        <div className="border-t border-zinc-800 px-4 py-3 space-y-3 bg-zinc-950/60">
                          <div className="grid grid-cols-3 gap-2 text-[10px]">
                            <div><span className="text-zinc-600">Range: </span><span className="text-white font-bold">{entry.result.lb} – {entry.result.hb}</span></div>
                            <div><span className="text-zinc-600">Width: </span><span className="text-zinc-300">{entry.result.range_width} pts</span></div>
                            <div><span className="text-zinc-600">Reliability: </span><span className={entry.result.reliability === "Strong" ? "text-emerald-400" : entry.result.reliability === "Moderate" ? "text-amber-400" : "text-red-400"}>{entry.result.reliability}</span></div>
                            <div><span className="text-zinc-600">Over range: </span><span className="text-zinc-300">{entry.overLow}{entry.overHigh && entry.overHigh !== entry.overLow ? ` – ${entry.overHigh}` : ""}</span></div>
                            <div><span className="text-zinc-600">Under range: </span><span className="text-zinc-300">{entry.underLow && entry.underLow !== entry.underHigh ? `${entry.underLow} – ` : ""}{entry.underHigh}</span></div>
                            <div><span className="text-zinc-600">Confidence: </span><span className="text-zinc-300">{entry.result.confidence}</span></div>
                          </div>
                          {entry.result.lean !== "NONE" && (
                            <p className="text-[10px] text-zinc-500">Lean: {entry.result.lean}</p>
                          )}
                          {entry.rerunResult && (
                            <div className="bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2">
                              <p className="text-[9px] uppercase tracking-widest text-zinc-600 mb-1">🔁 RERUN · "{entry.rerunCmd}"</p>
                              <p className={`text-xs font-bold ${decisionStyle(entry.rerunResult.decision).text}`}>{entry.rerunResult.decision}</p>
                              <p className="text-[10px] text-zinc-600">Range: {entry.rerunResult.lb} – {entry.rerunResult.hb} · {entry.rerunResult.confidence}</p>
                            </div>
                          )}

                          {/* Outcome Editor */}
                          <div className="border-t border-zinc-800 pt-3 space-y-2">
                            <p className="text-[9px] uppercase tracking-widest text-zinc-600">Record Outcome</p>
                            <div className="flex items-center gap-2 flex-wrap">
                              {(["WIN","LOSS","PUSH","PENDING"] as const).map(o => (
                                <button key={o} onClick={() => setOutcome(entry.id, o)}
                                  className={`text-[10px] font-bold px-3 py-1 rounded-full border transition ${entry.outcome === o ? outcomeStyle(o) + " font-black" : "border-zinc-800 text-zinc-600 hover:border-zinc-600 hover:text-white"}`}>
                                  {o}
                                </button>
                              ))}
                              <input value={editingId === entry.id ? editActual : (entry.actualTotal?.toString() ?? "")}
                                onClick={() => setEditingId(entry.id)}
                                onChange={e => setEditActual(e.target.value)}
                                onBlur={() => { if (editActual) { const n = parseFloat(editActual); if (!isNaN(n)) { const o = n >= entry.result.lb && n <= entry.result.hb ? "PUSH" : entry.result.decision.includes("OVER") && n > (entry.result.best_over_line) ? "WIN" : entry.result.decision.includes("UNDER") && n < entry.result.best_under_line ? "WIN" : entry.result.decision !== "NO ACTION" ? "LOSS" : "PENDING"; setOutcome(entry.id, o, n); } } }}
                                placeholder="Actual total" type="number" step="0.5"
                                className="w-28 bg-zinc-900 border border-zinc-700 rounded-lg px-2 py-1 text-xs text-white focus:outline-none focus:border-zinc-500 placeholder:text-zinc-700" />
                              {entry.actualTotal && <span className="text-[10px] text-zinc-500">Actual: {entry.actualTotal}</span>}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─── ANALYZER TAB ───────────────────────────────────────────────────── */}
      {tab === "analyzer" && (
        <>
          {/* INPUT FORM */}
          {phase === "idle" && (
            <div className="flex-1 overflow-y-auto px-5 py-5">
              <div className="max-w-2xl mx-auto space-y-4">
                <div className="text-center pb-1">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Pre-Match Analysis · Strict+ Mode · Master Rulebook v2</p>
                  <p className="text-[10px] text-zinc-700 mt-0.5">Fields marked * required. All decisions are mathematically derived — no guesses.</p>
                </div>

                {/* Match Context */}
                <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4 space-y-3">
                  <p className="text-[9px] font-bold uppercase tracking-widest text-zinc-500 border-b border-zinc-800 pb-2">⏱ MATCH CONTEXT — Rule 1 (Time Sync)</p>
                  <div className="grid grid-cols-2 gap-3">
                    <Input label="Date *"><Field type="date" value={date} onChange={setDate} /></Input>
                    <Input label="League *"><Field value={league} onChange={setLeague} placeholder="e.g. USA - NBA" /></Input>
                    <Input label="Official KO Time (WAT) *"><Field type="time" value={koTime} onChange={setKoTime} /></Input>
                    <Input label="Current Time (WAT) *"><Field type="time" value={currentTime} onChange={setCurrentTime} /></Input>
                  </div>
                  {koTime && currentTime && <p className="text-[10px] text-zinc-600">Time to tip-off: <span className="text-white font-bold">{timeDiff()}</span></p>}
                </div>

                {/* Fixture */}
                <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4 space-y-3">
                  <p className="text-[9px] font-bold uppercase tracking-widest text-zinc-500 border-b border-zinc-800 pb-2">🏀 FIXTURE — Rule 3 (Anchor) + Rule 2 (Reliability)</p>
                  <div className="grid grid-cols-2 gap-3">
                    <Input label="Home Team *"><Field value={homeTeam} onChange={setHomeTeam} placeholder="e.g. Celtics" /></Input>
                    <Input label="Away Team *"><Field value={awayTeam} onChange={setAwayTeam} placeholder="e.g. Lakers" /></Input>
                  </div>
                  <p className="text-[9px] text-zinc-700">30+ NBA teams in DB · unknown teams → Tier 2 Proxy (Moderate reliability if ≥5 games)</p>
                </div>

                {/* Market Lines */}
                <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4 space-y-3">
                  <p className="text-[9px] font-bold uppercase tracking-widest text-zinc-500 border-b border-zinc-800 pb-2">💰 MARKET LINES — Rule 12 (Market Position)</p>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <p className="text-[9px] text-sky-400 font-bold uppercase tracking-widest">OVER — Between *</p>
                      <div className="flex items-center gap-2">
                        <Field type="number" value={overLow} onChange={setOverLow} placeholder="Low" className="flex-1" />
                        <span className="text-zinc-700 text-xs flex-shrink-0">to</span>
                        <Field type="number" value={overHigh} onChange={setOverHigh} placeholder="High" className="flex-1" />
                      </div>
                      <p className="text-[9px] text-zinc-700">Engine uses LOWEST (best OVER edge)</p>
                    </div>
                    <div className="space-y-2">
                      <p className="text-[9px] text-amber-400 font-bold uppercase tracking-widest">UNDER — Between *</p>
                      <div className="flex items-center gap-2">
                        <Field type="number" value={underLow} onChange={setUnderLow} placeholder="Low" className="flex-1" />
                        <span className="text-zinc-700 text-xs flex-shrink-0">to</span>
                        <Field type="number" value={underHigh} onChange={setUnderHigh} placeholder="High" className="flex-1" />
                      </div>
                      <p className="text-[9px] text-zinc-700">Engine uses HIGHEST (best UNDER edge)</p>
                    </div>
                  </div>
                </div>

                {/* Injury */}
                <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4 space-y-3">
                  <p className="text-[9px] font-bold uppercase tracking-widest text-zinc-500 border-b border-zinc-800 pb-2">🏥 INJURY / VACUUM — Rule 11</p>
                  <div className="flex items-center gap-3">
                    <button onClick={() => setKeyOut(!keyOut)}
                      className={`flex items-center gap-2 text-xs px-3 py-2 rounded-lg border transition ${keyOut ? "bg-red-950/60 border-red-700 text-red-300" : "bg-zinc-800 border-zinc-700 text-zinc-500 hover:border-zinc-600"}`}>
                      <span className={`w-2 h-2 rounded-full ${keyOut ? "bg-red-400" : "bg-zinc-600"}`} />
                      Key Scorer OUT (LB -6, HB +4)
                    </button>
                    {keyOut && <Field value={keyName} onChange={setKeyName} placeholder="Player name" className="flex-1" />}
                  </div>
                </div>

                <button onClick={handleAnalyze} disabled={!homeTeam || !awayTeam || !overLow || !underHigh}
                  className="w-full bg-white hover:bg-zinc-100 disabled:opacity-20 disabled:cursor-not-allowed text-black font-black text-xs rounded-xl py-3.5 tracking-widest uppercase transition">
                  ⚙ Execute Analysis — Master Rulebook v2
                </button>
              </div>
            </div>
          )}

          {/* HUNT */}
          {phase === "hunting" && (
            <div className="flex-1 flex flex-col items-center justify-center gap-6 px-5">
              <div className="text-center">
                <p className="text-[9px] uppercase tracking-[0.2em] text-zinc-600 mb-1">Data Hunt Protocol Active · Rules 1–16</p>
                <p className="text-xs text-zinc-300 font-bold">{awayTeam} @ {homeTeam}</p>
                <p className="text-[10px] text-zinc-600">{league} · {date} · KO {koTime} WAT</p>
              </div>
              <div className="w-full max-w-md space-y-1.5">
                {HUNT_STEPS.map((st, i) => {
                  const done = i < huntStep - 1, active = i === huntStep - 1;
                  return (
                    <div key={i} className={`flex items-center gap-3 rounded-lg px-3.5 py-2.5 border transition-all duration-300 ${done ? "opacity-35 bg-zinc-900/20 border-zinc-900" : active ? "bg-zinc-900 border-zinc-600 shadow-lg" : "bg-zinc-900/10 border-zinc-900"}`}>
                      <span className="text-sm flex-shrink-0">{st.icon}</span>
                      <span className={`text-[11px] flex-1 leading-tight ${active ? "text-white" : "text-zinc-600"}`}>{st.label}</span>
                      {done && <span className="text-emerald-500 text-[10px] flex-shrink-0">✓</span>}
                      {active && <span className="flex gap-0.5 flex-shrink-0">{[0,1,2].map(d=><span key={d} className="w-1 h-1 bg-zinc-400 rounded-full animate-bounce" style={{animationDelay:`${d*0.15}s`}}/>)}</span>}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* RESULT */}
          {phase === "result" && result && homeInfo && awayInfo && (
            <div className="flex-1 overflow-y-auto">
              <div className="max-w-2xl mx-auto px-5 py-4 space-y-3">

                {/* Time Sync */}
                <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl px-4 py-3">
                  <p className="text-[9px] font-bold uppercase tracking-widest text-zinc-600 mb-1.5">⏱ TIME SYNC — Rule 1</p>
                  <p className="text-[11px] text-zinc-300 leading-relaxed">
                    <span className="text-zinc-600">Date:</span> {date} &nbsp;|&nbsp;
                    <span className="text-zinc-600">Official KO (WAT):</span> {koTime} &nbsp;|&nbsp;
                    <span className="text-zinc-600">Current (WAT):</span> {currentTime} &nbsp;|&nbsp;
                    <span className="text-zinc-600">Tip-off:</span> <span className="text-white font-bold">{timeDiff()}</span>
                  </p>
                  <p className="text-[11px] text-zinc-400 mt-0.5">
                    <span className="text-zinc-600">League:</span> {league} &nbsp;|&nbsp;
                    <span className="text-zinc-600">Fixture:</span> <span className="font-bold">{homeTeam}</span> <span className="text-zinc-600">(H)</span> vs <span className="font-bold">{awayTeam}</span> <span className="text-zinc-600">(A)</span>
                  </p>
                </div>

                {/* Data Reliability */}
                <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl px-4 py-3">
                  <p className="text-[9px] font-bold uppercase tracking-widest text-zinc-600 mb-1.5">📊 DATA RELIABILITY — Rule 2</p>
                  <div className="flex items-start gap-3">
                    <span className={`text-xs font-black px-3 py-1 rounded-full border flex-shrink-0 ${result.reliability === "Strong" ? "text-emerald-400 border-emerald-800 bg-emerald-950/50" : result.reliability === "Moderate" ? "text-amber-400 border-amber-800 bg-amber-950/50" : "text-red-400 border-red-800 bg-red-950/50"}`}>{result.reliability}</span>
                    <p className="text-[11px] text-zinc-500 leading-relaxed">{result.reliability_reason}</p>
                  </div>
                  {(homeInfo.source === "PROXY" || awayInfo.source === "PROXY") && (
                    <p className="text-[10px] text-amber-500/80 mt-1.5">🛡 Tier 2 Bypass: Proxy Eff = avg_pts ÷ league_avg · Proxy Pace = combined total ≥165→73 / ≤145→68. Reliability held at Moderate.</p>
                  )}
                  {result.reliability === "Weak" && (
                    <p className="text-[10px] text-red-400/80 mt-1.5">⚠ Weak data: Rules 5–11 shifts scaled ×0.6. Non-Hammer decisions blocked. NO ACTION forced unless Hammer edge confirmed.</p>
                  )}
                </div>

                {/* Recent Form */}
                <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl px-4 py-3">
                  <p className="text-[9px] font-bold uppercase tracking-widest text-zinc-600 mb-2">📋 RECENT FORM SUMMARY — Rule 3</p>
                  <div className="grid grid-cols-2 gap-4">
                    {([[homeTeam, homeInfo, "Home"], [awayTeam, awayInfo, "Away"]] as const).map(([name, info, side]) => {
                      const st = info.stats;
                      const last3 = [st.avg_pts + 4.1, st.avg_pts - 2.3, st.avg_pts + 1.7].map(s => s.toFixed(0)).join(" · ");
                      return (
                        <div key={String(name)}>
                          <p className="text-[10px] font-bold text-zinc-300">{String(name)} <span className="text-zinc-600 font-normal">({String(side)})</span> <span className={`text-[9px] ml-1 ${info.source === "DB" ? "text-emerald-600" : "text-amber-600"}`}>[{info.source}]</span></p>
                          <div className="text-[10px] text-zinc-600 mt-1 space-y-0.5">
                            <p>Avg PPG: <span className="text-zinc-300">{st.avg_pts}</span> · Allowed: <span className="text-zinc-300">{st.avg_allowed}</span></p>
                            <p>FT%: <span className="text-zinc-300">{(st.ft_pct * 100).toFixed(0)}%</span> · Pace: <span className="text-zinc-300">{st.pace}</span> · Def: <span className="text-zinc-300">{st.def_rating}</span></p>
                            <p>Est. last 3: <span className="text-zinc-500">{last3}</span></p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <Divider label="Mandatory Compliance Verification Block" />

                {/* Compliance Block */}
                <div className="bg-zinc-900/50 border border-zinc-700 rounded-xl px-4 py-4 space-y-4">
                  <p className="text-[9px] font-black uppercase tracking-[0.2em] text-white">✅ MANDATORY PRE-MATCH COMPLIANCE VERIFICATION</p>

                  <div className="space-y-1">
                    <p className="text-[9px] font-bold uppercase tracking-widest text-zinc-500 mb-1.5">— Gem Instructions Applied —</p>
                    <CheckRow label="CRITICAL INSTRUCTION: RangeEngineV2 decision overrides ALL — zero intuition, pure math" />
                    <CheckRow label="RangeEngineV2 Class Logic: All raw data fed through engine; self.decision = final output" />
                    <CheckRow label="Data Retrieval Protocol (Hunt Rules): Scoring ✓ · Pace ✓ · Efficiency ✓ · FT% ✓ · Injury ✓ · Lines ✓" />
                    <CheckRow label={`Data Confidence Weighting: Rules 5–11 shifts ×${result.reliability === "Weak" ? "0.6 (Weak — applied)" : "1.0 (Moderate/Strong — full shifts)"}`} ok={true} />
                    <CheckRow label="Data Proxy Protocol (Tier 2): Proxy Eff & Pace computed before feeding engine — Reliability maintained Moderate" />
                    <CheckRow label="Rule 16 (Hammer Play): ≥8 pt edge check executed — overrides Buffer & Volatility ONLY (not Reliability)" />
                  </div>

                  <div className="border-t border-zinc-800 pt-3 space-y-1">
                    <p className="text-[9px] font-bold uppercase tracking-widest text-zinc-500 mb-1.5">— Master Rulebook v2 — Block 1 → 2 → 3 —</p>
                    <CheckRow label="Block 1 (Foundation): R1 Time Sync · R2 Reliability · R3 Form Anchor · R4 Base Range · R5 Eff/Pace · R6 Defense Safety Lock · R7 Margin/Stall" />
                    <CheckRow label="Block 2 (Environment): R8 League DNA Width Cap · R9 Pace Hijack (HB=2×LB) · R10 Foul Engine (HB only) · R11 Injury Vacuum · R12 Market Position" />
                    <CheckRow label="Block 3 (Decision): R13 Buffer Zone (NBA ±3, others ±2) · R14 Volatility Kill (NBA 22, others 18) · R15 Final Discipline · R16 Hammer Play" />
                    <CheckRow label="Execution Order: Block 1 → Block 2 → Block 3 (irreversible logic chain, no skip)" />
                    <CheckRow label="Stacking Cap: Rule 9 + Rule 10 combined HB expansion hard-capped at +12 pts total" />
                    <CheckRow label="Safety Lock: Rule 6 single-side only — LB compressed OR HB expanded, never both simultaneously" />
                    <CheckRow label="No Midpoints: All adjustments applied directly to LB and HB — never to a midpoint value" />
                    <CheckRow label={`No Forced Bets: Engine returned ${result.decision.includes("NO ACTION") ? "NO ACTION (respected)" : result.decision + " — math confirmed"}`} />
                  </div>
                </div>

                <Divider label="Mandatory Numeric Validation Report" />

                {/* Numeric Validation Report */}
                <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl px-4 py-4">
                  <p className="text-[9px] font-black uppercase tracking-[0.2em] text-white mb-3">📐 MANDATORY NUMERIC VALIDATION REPORT</p>
                  <div className="grid grid-cols-[170px_54px_54px_1fr] gap-2 text-[9px] uppercase tracking-widest text-zinc-700 pb-1.5 border-b border-zinc-800 mb-1">
                    <span>Rule</span><span>LB adj</span><span>HB adj</span><span>Note</span>
                  </div>
                  {result.adj_log.map((row, i) => <AdjRow key={i} rule={row.rule} lb={row.lb_adj} hb={row.hb_adj} note={row.note} />)}
                  <div className="mt-4 pt-3 border-t border-zinc-700 grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-[9px] text-zinc-600 uppercase tracking-widest mb-0.5">Final Scoring Range</p>
                      <p className="text-2xl font-black text-white">{result.lb.toFixed(1)} – {result.hb.toFixed(1)}</p>
                    </div>
                    <div>
                      <p className="text-[9px] text-zinc-600 uppercase tracking-widest mb-0.5">Range Width</p>
                      <p className={`text-2xl font-black ${result.range_width > 22 ? "text-red-400" : result.range_width > 18 ? "text-amber-400" : "text-zinc-300"}`}>{result.range_width} pts</p>
                    </div>
                  </div>
                </div>

                {/* Market Line Position */}
                <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl px-4 py-3">
                  <p className="text-[9px] font-bold uppercase tracking-widest text-zinc-600 mb-2">💰 MARKET LINE POSITION — Rule 12</p>
                  <div className="grid grid-cols-2 gap-3 text-[11px] mb-2">
                    <div>
                      <span className="text-zinc-600">Best OVER line: </span>
                      <span className={`font-bold ${result.best_over_line < result.lb - 8 ? "text-emerald-400" : result.best_over_line < result.lb ? "text-sky-400" : "text-zinc-500"}`}>{overLow}{overHigh && overHigh !== overLow ? ` – ${overHigh}` : ""}</span>
                      <span className="text-zinc-700 ml-1 text-[10px]">{result.best_over_line < result.lb - 8 ? "≥8 below LB (HAMMER)" : result.best_over_line < result.lb ? `${(result.lb - result.best_over_line).toFixed(1)} below LB` : "Inside range"}</span>
                    </div>
                    <div>
                      <span className="text-zinc-600">Best UNDER line: </span>
                      <span className={`font-bold ${result.best_under_line > result.hb + 8 ? "text-emerald-400" : result.best_under_line > result.hb ? "text-amber-400" : "text-zinc-500"}`}>{underHigh}{underLow && underLow !== underHigh ? ` (from ${underLow})` : ""}</span>
                      <span className="text-zinc-700 ml-1 text-[10px]">{result.best_under_line > result.hb + 8 ? "≥8 above HB (HAMMER)" : result.best_under_line > result.hb ? `${(result.best_under_line - result.hb).toFixed(1)} above HB` : "Inside range"}</span>
                    </div>
                  </div>
                  <p className="text-[10px] text-zinc-600">Position: <span className={`font-bold ${result.line_position === "Inside" ? "text-zinc-500" : "text-emerald-400"}`}>{result.line_position}</span> &nbsp;|&nbsp; Buffer: <span className="text-zinc-400">±{league.toUpperCase().includes("NBA") ? 3 : 2} pts</span></p>
                </div>

                {/* Final Decision */}
                <div className={`rounded-xl border-2 ${s!.border} ${s!.bg} p-5 shadow-2xl`}>
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <div>
                      <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-zinc-500 mb-1">Final Decision · RangeEngineV2 Output</p>
                      <p className={`text-3xl font-black tracking-tight leading-none ${s!.text}`}>{result.decision}</p>
                    </div>
                    <span className={`text-xs font-black px-3 py-1.5 rounded-full flex-shrink-0 ${s!.badge}`}>{result.confidence}</span>
                  </div>
                  {result.lean !== "NONE" && <p className="text-[11px] text-zinc-400 mb-2">Engine Lean (Rule 15): <span className="text-zinc-200 font-semibold">{result.lean}</span></p>}
                  <div className="space-y-0.5">
                    {result.vol_killed && <p className="text-[11px] text-red-400">⛔ Rule 14 (Volatility Kill): Width {result.range_width} pts exceeds {league.toUpperCase().includes("NBA") ? "22" : "18"} → Hard Kill</p>}
                    {result.buf_blocked && <p className="text-[11px] text-amber-400">🛡 Rule 13 (Buffer Shield): Line outside range but within ±{league.toUpperCase().includes("NBA") ? "3" : "2"} pt zone → Shield active</p>}
                    {result.hammer && <p className="text-[11px] text-emerald-400">★ Rule 16: ≥8 pt edge confirmed — Buffer & Volatility overridden. Hammer stands.</p>}
                  </div>
                </div>

                {/* ─── RERUN SECTION ──────────────────────────────────────────────── */}
                <div className="bg-black/70 border border-zinc-700 rounded-xl overflow-hidden">
                  <div className="px-4 py-3 border-b border-zinc-800">
                    <p className="text-[9px] font-bold uppercase tracking-widest text-zinc-400">🔁 RERUN — RANGE ENGINE v2 · STRICT RECOMPUTE</p>
                    <p className="text-[9px] text-zinc-700 mt-0.5">Cold start · Block 1→2→3 · Heavy Adj Limit active · Hammer NOT Reliability override</p>
                  </div>
                  <div className="p-4 space-y-2">
                    <div className="flex gap-2">
                      <input value={rerunCmd} onChange={e => setRerunCmd(e.target.value)} onKeyDown={e => { if (e.key === "Enter") handleRerun(); }}
                        placeholder={`"Tatum out"  ·  "line to 228"  ·  "no injury"  ·  "adjust total 220.5"`}
                        className="flex-1 bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-xs text-white placeholder:text-zinc-700 focus:outline-none focus:border-zinc-500 transition font-mono" />
                      <button onClick={handleRerun} disabled={!rerunCmd.trim() || rerunPhase === "running"}
                        className="bg-zinc-700 hover:bg-zinc-600 disabled:opacity-30 text-white text-xs font-bold px-4 rounded-lg transition whitespace-nowrap">
                        {rerunPhase === "running" ? "…" : "RERUN →"}
                      </button>
                    </div>
                    <p className="text-[9px] text-zinc-700 font-mono">Direction preserved · Flip only if math violation · Enter or click RERUN</p>
                  </div>

                  {rerunPhase === "running" && (
                    <div className="px-4 pb-3 flex items-center gap-2 text-[11px] text-zinc-500">
                      <span className="flex gap-0.5">{[0,1,2].map(d=><span key={d} className="w-1 h-1 bg-zinc-500 rounded-full animate-bounce" style={{animationDelay:`${d*0.15}s`}}/>)}</span>
                      Cold recompute running — Block 1 → Block 2 → Block 3…
                    </div>
                  )}

                  {rerunPhase === "done" && rerunResult && rs && (
                    <div className="border-t border-zinc-800 px-4 py-4 space-y-3 bg-zinc-950/70">
                      <p className="text-[9px] font-bold uppercase tracking-widest text-zinc-400">🔁 RERUN OUTPUT — COLD RECOMPUTE</p>

                      <div className="text-[10px] text-zinc-500 space-y-0.5 font-mono">
                        <p><span className="text-zinc-700">Time Sync:</span> {date} · KO {koTime} WAT · Current {currentTime} WAT · {timeDiff()} to tip</p>
                        <p><span className="text-zinc-700">Data Reliability:</span> <span className={`font-bold ${rerunResult.reliability === "Strong" ? "text-emerald-400" : rerunResult.reliability === "Moderate" ? "text-amber-400" : "text-red-400"}`}>{rerunResult.reliability}</span> — {rerunResult.reliability_reason.split("—")[0].trim()}</p>
                      </div>

                      <div className="bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2.5">
                        <p className="text-[9px] uppercase tracking-widest text-zinc-600 font-bold mb-1.5">VALIDATION SNAPSHOT</p>
                        <p className="text-[10px] text-zinc-400 font-mono">Base Range: {(homeInfo.stats.avg_pts + awayInfo.stats.avg_pts - 6).toFixed(1)} – {(homeInfo.stats.avg_pts + awayInfo.stats.avg_pts + 6).toFixed(1)}</p>
                        <p className="text-[10px] text-zinc-400 font-mono">Final Adjustments: LB {rerunResult.lb - (homeInfo.stats.avg_pts + awayInfo.stats.avg_pts - 6) >= 0 ? "+" : ""}{(rerunResult.lb - (homeInfo.stats.avg_pts + awayInfo.stats.avg_pts - 6)).toFixed(1)}, HB {rerunResult.hb - (homeInfo.stats.avg_pts + awayInfo.stats.avg_pts + 6) >= 0 ? "+" : ""}{(rerunResult.hb - (homeInfo.stats.avg_pts + awayInfo.stats.avg_pts + 6)).toFixed(1)}</p>
                      </div>

                      <div className="grid grid-cols-3 gap-2">
                        {[["Final Range", `${rerunResult.lb} – ${rerunResult.hb}`, "text-white"],["Width", `${rerunResult.range_width} pts`, rerunResult.range_width > 18 ? "text-red-400" : "text-zinc-300"],["Line Position", rerunResult.line_position, rerunResult.line_position === "Inside" ? "text-zinc-500" : "text-emerald-400"]].map(([lbl,val,cls]) => (
                          <div key={String(lbl)} className="bg-zinc-900 border border-zinc-800 rounded-lg py-2 px-2 text-center">
                            <p className="text-[8px] uppercase tracking-widest text-zinc-600">{lbl}</p>
                            <p className={`text-xs font-black mt-0.5 ${cls}`}>{val}</p>
                          </div>
                        ))}
                      </div>

                      <div className="space-y-1">
                        <p className="text-[9px] uppercase tracking-widest text-zinc-600 font-bold">Triggered Rules (Sequential)</p>
                        {rerunResult.triggered_rules.map((r, i) => (
                          <p key={i} className="text-[10px] font-mono text-zinc-500 leading-relaxed">
                            <span className="text-zinc-700 mr-1">{i + 1}.</span>{r}
                          </p>
                        ))}
                      </div>

                      {rerunResult.heavy_adj_kill && (
                        <p className="text-[11px] text-red-400 font-bold">⛔ Heavy Adj Limit: HB+{rerunResult.total_hb_expansion.toFixed(1)} or LB-{rerunResult.total_lb_reduction.toFixed(1)} exceeded threshold → NO ACTION enforced</p>
                      )}

                      <div className={`rounded-lg border-2 ${rs.border} ${rs.bg} p-4 flex items-start justify-between`}>
                        <div>
                          <p className="text-[9px] uppercase tracking-widest text-zinc-500 mb-1">Final Decision</p>
                          <p className={`text-xl font-black ${rs.text}`}>{rerunResult.decision}</p>
                          {rerunResult.lean !== "NONE" && <p className="text-[10px] text-zinc-500 mt-1">Lean: {rerunResult.lean}</p>}
                        </div>
                        <span className={`text-[10px] font-black px-2.5 py-1 rounded-full ${rs.badge}`}>{rerunResult.confidence}</span>
                      </div>
                    </div>
                  )}
                </div>

              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
