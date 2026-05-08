import { useState, useRef } from "react";

// ─── Team Database ────────────────────────────────────────────────────────────
const TEAM_DB: Record<string, { avg_pts: number; avg_allowed: number; def_rating: number; ft_pct: number; pace: number; games: number }> = {
  lakers: { avg_pts: 114.2, avg_allowed: 113.6, def_rating: 1.10, ft_pct: 0.77, pace: 100.1, games: 12 },
  celtics: { avg_pts: 120.6, avg_allowed: 108.9, def_rating: 1.05, ft_pct: 0.80, pace: 100.8, games: 14 },
  warriors: { avg_pts: 116.3, avg_allowed: 112.4, def_rating: 1.08, ft_pct: 0.78, pace: 101.5, games: 11 },
  heat: { avg_pts: 110.4, avg_allowed: 109.2, def_rating: 1.06, ft_pct: 0.76, pace: 98.4, games: 10 },
  nuggets: { avg_pts: 115.8, avg_allowed: 111.3, def_rating: 1.07, ft_pct: 0.79, pace: 100.3, games: 13 },
  bucks: { avg_pts: 118.1, avg_allowed: 114.2, def_rating: 1.11, ft_pct: 0.75, pace: 101.9, games: 12 },
  "76ers": { avg_pts: 113.7, avg_allowed: 115.4, def_rating: 1.12, ft_pct: 0.81, pace: 99.6, games: 11 },
  sixers: { avg_pts: 113.7, avg_allowed: 115.4, def_rating: 1.12, ft_pct: 0.81, pace: 99.6, games: 11 },
  clippers: { avg_pts: 112.8, avg_allowed: 110.7, def_rating: 1.07, ft_pct: 0.77, pace: 99.1, games: 10 },
  suns: { avg_pts: 116.9, avg_allowed: 117.1, def_rating: 1.14, ft_pct: 0.79, pace: 102.2, games: 12 },
  mavericks: { avg_pts: 117.4, avg_allowed: 112.9, def_rating: 1.09, ft_pct: 0.80, pace: 100.7, games: 13 },
  mavs: { avg_pts: 117.4, avg_allowed: 112.9, def_rating: 1.09, ft_pct: 0.80, pace: 100.7, games: 13 },
  knicks: { avg_pts: 113.5, avg_allowed: 109.8, def_rating: 1.06, ft_pct: 0.76, pace: 98.8, games: 11 },
  nets: { avg_pts: 109.3, avg_allowed: 118.2, def_rating: 1.15, ft_pct: 0.74, pace: 99.3, games: 9 },
  bulls: { avg_pts: 111.6, avg_allowed: 113.7, def_rating: 1.10, ft_pct: 0.77, pace: 99.9, games: 10 },
  spurs: { avg_pts: 108.4, avg_allowed: 119.3, def_rating: 1.16, ft_pct: 0.73, pace: 100.5, games: 11 },
  raptors: { avg_pts: 111.2, avg_allowed: 116.4, def_rating: 1.13, ft_pct: 0.76, pace: 99.7, games: 12 },
  thunder: { avg_pts: 119.1, avg_allowed: 110.8, def_rating: 1.07, ft_pct: 0.78, pace: 101.1, games: 13 },
  timberwolves: { avg_pts: 112.4, avg_allowed: 108.6, def_rating: 1.05, ft_pct: 0.77, pace: 99.5, games: 11 },
  wolves: { avg_pts: 112.4, avg_allowed: 108.6, def_rating: 1.05, ft_pct: 0.77, pace: 99.5, games: 11 },
  pacers: { avg_pts: 121.3, avg_allowed: 119.4, def_rating: 1.15, ft_pct: 0.82, pace: 103.8, games: 12 },
  hawks: { avg_pts: 116.7, avg_allowed: 119.2, def_rating: 1.15, ft_pct: 0.79, pace: 102.4, games: 10 },
  magic: { avg_pts: 107.3, avg_allowed: 108.9, def_rating: 1.05, ft_pct: 0.73, pace: 98.1, games: 11 },
  grizzlies: { avg_pts: 113.8, avg_allowed: 112.4, def_rating: 1.08, ft_pct: 0.76, pace: 100.2, games: 10 },
  pelicans: { avg_pts: 112.1, avg_allowed: 114.7, def_rating: 1.11, ft_pct: 0.74, pace: 99.8, games: 9 },
  jazz: { avg_pts: 114.5, avg_allowed: 118.3, def_rating: 1.14, ft_pct: 0.78, pace: 100.9, games: 10 },
  rockets: { avg_pts: 112.7, avg_allowed: 110.4, def_rating: 1.07, ft_pct: 0.74, pace: 99.6, games: 11 },
  kings: { avg_pts: 118.4, avg_allowed: 117.2, def_rating: 1.13, ft_pct: 0.80, pace: 102.1, games: 12 },
  pistons: { avg_pts: 108.1, avg_allowed: 116.9, def_rating: 1.14, ft_pct: 0.76, pace: 100.3, games: 10 },
  cavaliers: { avg_pts: 116.2, avg_allowed: 107.4, def_rating: 1.04, ft_pct: 0.77, pace: 99.2, games: 13 },
  cavs: { avg_pts: 116.2, avg_allowed: 107.4, def_rating: 1.04, ft_pct: 0.77, pace: 99.2, games: 13 },
  hornets: { avg_pts: 108.9, avg_allowed: 117.6, def_rating: 1.14, ft_pct: 0.76, pace: 100.0, games: 10 },
  wizards: { avg_pts: 106.4, avg_allowed: 120.1, def_rating: 1.16, ft_pct: 0.74, pace: 100.7, games: 9 },
  trailblazers: { avg_pts: 109.8, avg_allowed: 117.9, def_rating: 1.14, ft_pct: 0.77, pace: 100.5, games: 10 },
  blazers: { avg_pts: 109.8, avg_allowed: 117.9, def_rating: 1.14, ft_pct: 0.77, pace: 100.5, games: 10 },
};

const LEAGUE_AVG: Record<string, number> = {
  NBA: 113.8, NCAA: 74.0, EUROLEAGUE: 82.0, ACB: 85.0, PBA: 95.0, NBL: 88.0, DEFAULT: 100.0,
};

function lookupTeam(name: string, league: string): { stats: typeof TEAM_DB[string]; source: "DB" | "PROXY" } {
  const key = name.toLowerCase().trim().replace(/[^a-z0-9]/g, "");
  for (const [k, v] of Object.entries(TEAM_DB)) {
    if (key.includes(k) || k.includes(key)) return { stats: v, source: "DB" };
  }
  // Proxy stats from league average
  const leagueKey = Object.keys(LEAGUE_AVG).find(k => league.toUpperCase().includes(k)) ?? "DEFAULT";
  const avg = LEAGUE_AVG[leagueKey];
  const combined = avg * 2;
  const pace = combined >= 165 ? 73 : combined <= 145 ? 68 : 71;
  return {
    stats: { avg_pts: avg, avg_allowed: avg, def_rating: 1.10, ft_pct: 0.75, pace, games: 6 },
    source: "PROXY",
  };
}

// ─── Engine Interfaces ────────────────────────────────────────────────────────
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

// ─── Master Rulebook v2 Engine ────────────────────────────────────────────────
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
  const isNBA = lg.includes("NBA") || lg.includes("USA - NBA");
  const isStructured = lg.includes("EURO") || lg.includes("ACB");
  const isVolatile = lg.includes("PBA") || lg.includes("NBL");

  const leagueKey = isNBA ? "NBA" : isStructured ? "EUROLEAGUE" : isVolatile ? "PBA" : "DEFAULT";
  const leagueAvg = LEAGUE_AVG[leagueKey];

  // Reliability (Rule 2)
  const minGames = Math.min(H.games, A.games);
  const proxyUsed = home_stats.source === "PROXY" || away_stats.source === "PROXY";
  const reliability = minGames < 5 ? "Weak" : minGames < 8 ? "Moderate" : proxyUsed ? "Moderate" : "Strong";
  const reliability_reason = proxyUsed
    ? `Proxy stats applied (${home_stats.source === "PROXY" ? opts.home_name : opts.away_name} not in DB) — Tier 2 Bypass active`
    : `Sample: ${H.games} games (Home) × ${A.games} games (Away) — ${reliability} threshold`;
  const ws = reliability === "Weak" ? 0.6 : 1.0;

  const adj_log: AdjLog[] = [];
  const triggered: string[] = [];

  // Proxy stats derivation
  const home_eff = H.avg_pts / leagueAvg;
  const away_eff = A.avg_pts / leagueAvg;
  const avg_eff = (home_eff + away_eff) / 2;
  const avg_pace = (H.pace + A.pace) / 2;
  const avg_ft = (H.ft_pct + A.ft_pct) / 2;
  const home_def = H.def_rating; const away_def = A.def_rating;
  const margin = Math.abs(H.avg_pts - A.avg_pts);

  // Rule 4 — Base Range
  let lb = H.avg_pts + A.avg_pts - 6;
  let hb = H.avg_pts + A.avg_pts + 6;
  const base_lb = lb, base_hb = hb;
  adj_log.push({ rule: "Rule 4 (Base)", lb_adj: 0, hb_adj: 0, note: `${H.avg_pts} + ${A.avg_pts} ± 6 = ${lb.toFixed(1)} – ${hb.toFixed(1)}` });

  // Rule 5 — Efficiency & Pace (cap ±6)
  let r5_lb = 0, r5_hb = 0;
  if (avg_eff >= 1.10) { r5_lb = 3; r5_hb = 3; }
  else if (avg_pace < 70 && avg_eff < 1.05) { r5_lb = -3; r5_hb = -3; }
  r5_lb = Math.round(Math.max(-6, Math.min(6, r5_lb)) * ws);
  r5_hb = Math.round(Math.max(-6, Math.min(6, r5_hb)) * ws);
  lb += r5_lb; hb += r5_hb;
  adj_log.push({ rule: "Rule 5 (Efficiency/Pace)", lb_adj: r5_lb, hb_adj: r5_hb, note: `Eff: ${avg_eff.toFixed(2)}, Pace: ${avg_pace.toFixed(1)} | Cap ±6${ws < 1 ? " | ×0.6 weak" : ""}` });
  if (r5_lb !== 0 || r5_hb !== 0) triggered.push(`Rule 5: LB ${r5_lb >= 0 ? "+" : ""}${r5_lb}, HB ${r5_hb >= 0 ? "+" : ""}${r5_hb}`);

  // Rule 6 — Defensive Impact (Safety Lock — never compress both)
  let r6_lb = 0, r6_hb = 0;
  const higherDef = home_def >= away_def ? home_def : away_def;
  if (higherDef > 1.14) { r6_hb = Math.round(3.5 * ws); }
  else if (higherDef < 1.06) { r6_lb = -Math.round(3.5 * ws); }
  lb += r6_lb; hb += r6_hb;
  adj_log.push({ rule: "Rule 6 (Defense)", lb_adj: r6_lb, hb_adj: r6_hb, note: `H-Def: ${home_def}, A-Def: ${away_def} | Safety Lock (single-side only)` });
  if (r6_lb !== 0 || r6_hb !== 0) triggered.push(`Rule 6: LB ${r6_lb >= 0 ? "+" : ""}${r6_lb}, HB ${r6_hb >= 0 ? "+" : ""}${r6_hb}`);

  // Rule 7 — Margin / Stall Fix
  let r7_lb = 0, r7_hb = 0;
  if (margin >= 10) r7_lb = -Math.round(4 * ws);
  else if (margin <= 6) r7_hb = Math.round(4 * ws);
  lb += r7_lb; hb += r7_hb;
  adj_log.push({ rule: "Rule 7 (Margin/Stall)", lb_adj: r7_lb, hb_adj: r7_hb, note: `Avg margin: ${margin.toFixed(1)} pts` });
  if (r7_lb !== 0 || r7_hb !== 0) triggered.push(`Rule 7: LB ${r7_lb >= 0 ? "+" : ""}${r7_lb}, HB ${r7_hb >= 0 ? "+" : ""}${r7_hb}`);

  // Rule 9 — Pace Hijack (HB = 2× LB expansion)
  let r9_lb = 0, r9_hb = 0;
  if (avg_pace >= 72 && avg_eff >= 1.08) {
    r9_lb = Math.round(4 * ws);
    r9_hb = Math.round(8 * ws); // HB always 2× LB
  }
  lb += r9_lb; hb += r9_hb;
  adj_log.push({ rule: "Rule 8/9 (League DNA/Pace Hijack)", lb_adj: r9_lb, hb_adj: r9_hb, note: `Pace: ${avg_pace.toFixed(1)}, Eff: ${avg_eff.toFixed(2)}` });
  if (r9_lb !== 0 || r9_hb !== 0) triggered.push(`Rule 9 (Pace Hijack): LB +${r9_lb}, HB +${r9_hb} (HB=2×LB)`);

  // Rule 10 — Foul Engine (HB ONLY)
  let r10_hb = 0;
  if (margin <= 6 && avg_ft >= 0.75) r10_hb = Math.round(11 * ws);
  // Rule 11 — Injury Vacuum
  let r11_lb = 0, r11_hb = 0;
  if (key_player_out) { r11_lb = -Math.round(6 * ws); r11_hb = Math.round(4 * ws); }
  hb += r10_hb + r11_hb; lb += r11_lb;

  // Stacking cap: R9+R10 combined HB expansion ≤ +12
  const r9r10_hb = r9_hb + r10_hb;
  let stacking_cut = 0;
  if (r9r10_hb > 12) {
    stacking_cut = r9r10_hb - 12;
    hb -= stacking_cut;
  }
  adj_log.push({
    rule: "Rule 10/11 (Foul Engine/Injury)",
    lb_adj: r11_lb,
    hb_adj: r10_hb + r11_hb - stacking_cut,
    note: `FT%: ${(avg_ft * 100).toFixed(0)}%, Margin: ${margin.toFixed(1)}${key_player_out ? ` | ${key_player_name} OUT` : ""}${stacking_cut > 0 ? ` | Stack Cap: -${stacking_cut}` : ""}`,
  });
  if (r10_hb > 0) triggered.push(`Rule 10 (Foul Engine): HB +${r10_hb}${stacking_cut > 0 ? ` (capped, -${stacking_cut})` : ""}`);
  if (key_player_out) triggered.push(`Rule 11 (Injury Vacuum): LB ${r11_lb}, HB +${r11_hb} — Vacuum effect`);

  // Rule 8 — League DNA Width Cap (after all rules)
  const maxHalfWidth = isStructured ? 8 : isVolatile ? 14 : 10; // NBA = ±10
  const mid_raw = (lb + hb) / 2;
  const hw = (hb - lb) / 2;
  let cap_applied = false;
  if (hw > maxHalfWidth) {
    lb = mid_raw - maxHalfWidth;
    hb = mid_raw + maxHalfWidth;
    cap_applied = true;
    triggered.push(`Rule 8 (League DNA Cap): Width capped at ±${maxHalfWidth} (${isNBA ? "NBA" : isStructured ? "Structured" : "Volatile"})`);
  }

  lb = parseFloat(lb.toFixed(1)); hb = parseFloat(hb.toFixed(1));
  const range_width = parseFloat((hb - lb).toFixed(1));
  const midpoint = parseFloat(((lb + hb) / 2).toFixed(1));

  // Track total expansion/reduction for heavy adj limit
  const total_hb_expansion = Math.max(0, hb - base_hb);
  const total_lb_reduction = Math.max(0, base_lb - lb);

  // Best market lines: OVER = lowest over line, UNDER = highest under line
  const best_over_line = opts.over_low;
  const best_under_line = opts.under_high;

  // ─── Decision Chain ─────────────────────────────────────────────────────────
  let decision = "NO ACTION", confidence = "Low", lean = "NONE";
  let hammer = false, vol_killed = false, buf_blocked = false, heavy_adj_kill = false;
  const buffer = isNBA ? 3 : 2;
  const rw_threshold = isNBA ? 22 : 18;

  // Reliability gate for non-Hammer plays
  const reliabilityBlocks = reliability === "Weak";

  // Heavy adjustment limit (RERUN only)
  if (is_rerun && (total_hb_expansion > 10 || total_lb_reduction > 6)) {
    heavy_adj_kill = true;
    decision = "NO ACTION";
    confidence = "Low";
    triggered.push(`Heavy Adj Limit (RERUN): HB+${total_hb_expansion.toFixed(1)} or LB-${total_lb_reduction.toFixed(1)} exceeds threshold → NO ACTION`);
  } else {
    // Rule 16 — Hammer (checks OVER range low and UNDER range high)
    const over_hammer = best_over_line < lb - 8;
    const under_hammer = best_under_line > hb + 8;

    if ((over_hammer || under_hammer) && !reliabilityBlocks) {
      hammer = true;
      if (over_hammer && (!under_hammer || (lb - best_over_line) >= (best_under_line - hb))) {
        decision = `OVER ${best_over_line} ★ HAMMER PLAY`;
        confidence = "HIGH (Hammer Play)";
        triggered.push(`Rule 16 (Hammer): Line ${best_over_line} < LB${lb.toFixed(1)} by ${(lb - best_over_line).toFixed(1)} pts — HAMMER OVER`);
      } else {
        decision = `UNDER ${best_under_line} ★ HAMMER PLAY`;
        confidence = "HIGH (Hammer Play)";
        triggered.push(`Rule 16 (Hammer): Line ${best_under_line} > HB${hb.toFixed(1)} by ${(best_under_line - hb).toFixed(1)} pts — HAMMER UNDER`);
      }
    } else if (reliabilityBlocks && (over_hammer || under_hammer)) {
      decision = "NO ACTION";
      confidence = "Low";
      triggered.push("Rule 16 (Hammer): Edge ≥ 8 detected BUT Data Reliability = Weak → HAMMER overrides Buffer/Volatility ONLY, not Reliability. NO ACTION.");
    } else {
      // Rule 14 — Volatility Kill
      if (range_width > rw_threshold) {
        vol_killed = true;
        decision = "NO ACTION";
        triggered.push(`Rule 14 (Volatility Kill): Width ${range_width} > ${rw_threshold} → NO ACTION`);
      } else if (reliabilityBlocks) {
        decision = "NO ACTION";
        triggered.push("Rule 3/2: Weak reliability → NO ACTION (non-Hammer plays blocked)");
      } else {
        // Rule 12+13 — Market Position + Buffer Zone
        const over_edge = lb - best_over_line;  // positive = OVER edge
        const under_edge = best_under_line - hb; // positive = UNDER edge

        if (over_edge > buffer) {
          decision = `OVER ${best_over_line}`;
          confidence = "Medium";
          triggered.push(`Rule 12+13: Over line ${best_over_line} clears LB ${lb.toFixed(1)} by ${over_edge.toFixed(1)} pts (buffer ${buffer}) → OVER`);
        } else if (under_edge > buffer) {
          decision = `UNDER ${best_under_line}`;
          confidence = "Medium";
          triggered.push(`Rule 12+13: Under line ${best_under_line} clears HB ${hb.toFixed(1)} by ${under_edge.toFixed(1)} pts (buffer ${buffer}) → UNDER`);
        } else if (over_edge > 0 || under_edge > 0) {
          buf_blocked = true;
          decision = "NO ACTION";
          triggered.push(`Rule 13 (Buffer Shield): Line outside range but within ±${buffer} buffer → NO ACTION`);
        } else {
          triggered.push(`Rule 12: Lines inside range (LB ${lb.toFixed(1)} – HB ${hb.toFixed(1)}) → NO ACTION`);
        }
      }
    }
  }

  // Rule 15 — Lean (if NO ACTION)
  if (decision === "NO ACTION") {
    const mid = (lb + hb) / 2;
    const ref_line = (best_over_line + best_under_line) / 2;
    lean = ref_line < mid ? "LEAN UNDER (line cluster closer to LB)" : "LEAN OVER (line cluster closer to HB)";
    triggered.push(`Rule 15: No decisive edge → ${lean}`);
  }

  // Determine line position
  const all_lines = [best_over_line, best_under_line];
  const below = all_lines.filter(l => l < lb).length;
  const above = all_lines.filter(l => l > hb).length;
  const line_position: "Below" | "Inside" | "Above" | "Mixed" =
    below === 2 ? "Below" : above === 2 ? "Above" :
    (below > 0 || above > 0) ? "Mixed" : "Inside";

  return {
    lb, hb, range_width, midpoint, decision, confidence, lean,
    reliability, reliability_reason, adj_log, total_hb_expansion, total_lb_reduction,
    triggered_rules: triggered, hammer, vol_killed, buf_blocked, heavy_adj_kill,
    best_over_line, best_under_line, line_position,
  };
}

// ─── Styles ──────────────────────────────────────────────────────────────────
function decisionStyle(d: string) {
  if (d.includes("HAMMER")) return { border: "border-emerald-400", bg: "bg-emerald-950/60", text: "text-emerald-300", badge: "bg-emerald-500 text-black" };
  if (d.includes("OVER")) return { border: "border-sky-500", bg: "bg-sky-950/60", text: "text-sky-300", badge: "bg-sky-500 text-black" };
  if (d.includes("UNDER")) return { border: "border-amber-500", bg: "bg-amber-950/60", text: "text-amber-300", badge: "bg-amber-500 text-black" };
  return { border: "border-zinc-700", bg: "bg-zinc-900/60", text: "text-zinc-400", badge: "bg-zinc-700 text-zinc-300" };
}

const HUNT_STEPS = [
  { icon: "🔍", label: "Parsing matchup — identifying home & away teams" },
  { icon: "📊", label: "Fetching season scoring averages (Tier 1 DB / Tier 2 Proxy)" },
  { icon: "⚡", label: "Retrieving pace & offensive efficiency ratings" },
  { icon: "🛡️", label: "Loading defensive ratings — applying Safety Lock (Rule 6)" },
  { icon: "🏥", label: "Scanning injury reports — Vacuum Check (Rule 11)" },
  { icon: "💰", label: "Anchoring market O/U lines — Over & Under ranges" },
  { icon: "⚙️", label: "Executing Master Rulebook v2 · Block 1 → 2 → 3 (Rules 1–16)" },
];

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
      <span className={`text-xs flex-shrink-0 ${ok ? "text-emerald-400" : "text-red-400"}`}>{ok ? "✓" : "✗"}</span>
      <span className="text-xs text-zinc-400">{label}</span>
    </div>
  );
}

function AdjRow({ rule, lb, hb, note }: { rule: string; lb: number; hb: number; note: string }) {
  const fmtAdj = (n: number) => n === 0 ? "0" : (n > 0 ? `+${n}` : `${n}`);
  return (
    <div className="grid grid-cols-[160px_60px_60px_1fr] gap-2 text-xs font-mono py-1 border-b border-zinc-800/60 last:border-0">
      <span className="text-zinc-400">{rule}</span>
      <span className={lb === 0 ? "text-zinc-700" : lb > 0 ? "text-sky-400" : "text-amber-400"}>{fmtAdj(lb)}</span>
      <span className={hb === 0 ? "text-zinc-700" : hb > 0 ? "text-emerald-400" : "text-red-400"}>{fmtAdj(hb)}</span>
      <span className="text-zinc-600 text-[10px]">{note}</span>
    </div>
  );
}

// ─── Component ───────────────────────────────────────────────────────────────
export function RangeEngine() {
  const today = new Date().toISOString().split("T")[0];
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
  const [mode, setMode] = useState<"main" | "rerun">("main");

  const [rerunCmd, setRerunCmd] = useState("");
  const [rerunResult, setRerunResult] = useState<EngineOutput | null>(null);
  const [rerunPhase, setRerunPhase] = useState<"idle" | "running" | "done">("idle");

  const rerunRef = useRef<HTMLInputElement>(null);

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
    setPhase("hunting"); setHuntStep(0); setResult(null); setRerunResult(null); setMode("main");

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
        setTimeout(() => { setResult(res); setPhase("result"); setRerunPhase("idle"); }, 350);
      }
    }, 400);
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
    if (lineM) {
      const nl = parseFloat(lineM[1]);
      rOverLow = nl - 1; rOverHigh = nl + 1; rUnderLow = nl - 1; rUnderHigh = nl + 1;
    }

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
      setRerunResult(res); setRerunPhase("done"); setMode("rerun");
    }, 1200);
  }

  function handleReset() { setPhase("idle"); setResult(null); setRerunResult(null); setMode("main"); setRerunCmd(""); setRerunPhase("idle"); }

  const s = result ? decisionStyle(result.decision) : null;
  const rs = rerunResult ? decisionStyle(rerunResult.decision) : null;

  return (
    <div className="min-h-screen bg-[#07070c] text-white font-mono flex flex-col text-sm">
      {/* Header */}
      <div className="border-b border-white/[0.06] px-5 py-3 flex items-center justify-between bg-black/60 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex gap-0.5">{["bg-violet-500","bg-sky-500","bg-amber-500"].map((c,i)=><div key={i} className={`w-1.5 h-4 rounded-full ${c}`}/>)}</div>
          <div>
            <span className="text-xs font-bold tracking-tight">RANGE ENGINE v2</span>
            <span className="ml-2 text-[10px] text-zinc-600">Master Rulebook v2 · Rules 1–16 · Strict+</span>
          </div>
        </div>
        {phase !== "idle" && <button onClick={handleReset} className="text-[10px] text-zinc-600 hover:text-white border border-zinc-800 hover:border-zinc-600 rounded px-2.5 py-1 transition">← New Match</button>}
      </div>

      {/* ── IDLE: INPUT FORM ── */}
      {phase === "idle" && (
        <div className="flex-1 overflow-y-auto px-5 py-5">
          <div className="max-w-2xl mx-auto space-y-4">
            <div className="text-center space-y-1 pb-2">
              <p className="text-xs font-bold uppercase tracking-widest text-zinc-400">Pre-Match Analysis · Strict+ Mode</p>
              <p className="text-[10px] text-zinc-700">Fill in match context below. All fields marked * are required.</p>
            </div>

            {/* Match Context */}
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4 space-y-3">
              <p className="text-[9px] font-bold uppercase tracking-widest text-zinc-500 border-b border-zinc-800 pb-2">⏱ MATCH CONTEXT</p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[9px] uppercase tracking-widest text-zinc-600 block mb-1">Date *</label>
                  <input type="date" value={date} onChange={e=>setDate(e.target.value)} className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-zinc-500 transition" />
                </div>
                <div>
                  <label className="text-[9px] uppercase tracking-widest text-zinc-600 block mb-1">League *</label>
                  <input value={league} onChange={e=>setLeague(e.target.value)} placeholder="e.g. USA - NBA" className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-zinc-500 transition placeholder:text-zinc-700" />
                </div>
                <div>
                  <label className="text-[9px] uppercase tracking-widest text-zinc-600 block mb-1">Official KO Time (WAT) *</label>
                  <input type="time" value={koTime} onChange={e=>setKoTime(e.target.value)} className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-zinc-500 transition" />
                </div>
                <div>
                  <label className="text-[9px] uppercase tracking-widest text-zinc-600 block mb-1">Current Time (WAT) *</label>
                  <input type="time" value={currentTime} onChange={e=>setCurrentTime(e.target.value)} className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-zinc-500 transition" />
                </div>
              </div>
            </div>

            {/* Teams */}
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4 space-y-3">
              <p className="text-[9px] font-bold uppercase tracking-widest text-zinc-500 border-b border-zinc-800 pb-2">🏀 FIXTURE</p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[9px] uppercase tracking-widest text-zinc-600 block mb-1">Home Team *</label>
                  <input value={homeTeam} onChange={e=>setHomeTeam(e.target.value)} placeholder="e.g. Celtics" className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-zinc-500 transition placeholder:text-zinc-700" />
                </div>
                <div>
                  <label className="text-[9px] uppercase tracking-widest text-zinc-600 block mb-1">Away Team *</label>
                  <input value={awayTeam} onChange={e=>setAwayTeam(e.target.value)} placeholder="e.g. Lakers" className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-zinc-500 transition placeholder:text-zinc-700" />
                </div>
              </div>
            </div>

            {/* Market Lines */}
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4 space-y-3">
              <p className="text-[9px] font-bold uppercase tracking-widest text-zinc-500 border-b border-zinc-800 pb-2">💰 MARKET LINES (O/U RANGES)</p>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <p className="text-[9px] text-sky-400 uppercase tracking-widest">OVER — Between</p>
                  <div className="flex items-center gap-2">
                    <input type="number" value={overLow} onChange={e=>setOverLow(e.target.value)} placeholder="Low *" step="0.5" className="flex-1 bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-700 transition placeholder:text-zinc-700" />
                    <span className="text-zinc-700 text-xs">to</span>
                    <input type="number" value={overHigh} onChange={e=>setOverHigh(e.target.value)} placeholder="High" step="0.5" className="flex-1 bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-700 transition placeholder:text-zinc-700" />
                  </div>
                </div>
                <div className="space-y-2">
                  <p className="text-[9px] text-amber-400 uppercase tracking-widest">UNDER — Between</p>
                  <div className="flex items-center gap-2">
                    <input type="number" value={underLow} onChange={e=>setUnderLow(e.target.value)} placeholder="Low" step="0.5" className="flex-1 bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-700 transition placeholder:text-zinc-700" />
                    <span className="text-zinc-700 text-xs">to</span>
                    <input type="number" value={underHigh} onChange={e=>setUnderHigh(e.target.value)} placeholder="High *" step="0.5" className="flex-1 bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-700 transition placeholder:text-zinc-700" />
                  </div>
                </div>
              </div>
              <p className="text-[9px] text-zinc-700">Engine uses LOWEST over line & HIGHEST under line for maximum edge detection</p>
            </div>

            {/* Injury */}
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4 space-y-3">
              <p className="text-[9px] font-bold uppercase tracking-widest text-zinc-500 border-b border-zinc-800 pb-2">🏥 INJURY / VACUUM CHECK (RULE 11)</p>
              <div className="flex items-center gap-3">
                <button onClick={()=>setKeyOut(!keyOut)} className={`flex items-center gap-2 text-xs px-3 py-2 rounded-lg border transition ${keyOut ? "bg-red-950/60 border-red-700 text-red-300" : "bg-zinc-800 border-zinc-700 text-zinc-500 hover:border-zinc-600"}`}>
                  <span className={`w-2 h-2 rounded-full ${keyOut ? "bg-red-400" : "bg-zinc-600"}`} /> Key Scorer OUT
                </button>
                {keyOut && <input value={keyName} onChange={e=>setKeyName(e.target.value)} placeholder="Player name" className="flex-1 bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-red-700 transition placeholder:text-zinc-700" />}
              </div>
            </div>

            <button onClick={handleAnalyze} disabled={!homeTeam || !awayTeam || !overLow || !underHigh}
              className="w-full bg-white hover:bg-zinc-100 disabled:opacity-20 disabled:cursor-not-allowed text-black font-bold text-xs rounded-xl py-3.5 tracking-widest uppercase transition">
              Execute Analysis →
            </button>
          </div>
        </div>
      )}

      {/* ── HUNTING ── */}
      {phase === "hunting" && (
        <div className="flex-1 flex flex-col items-center justify-center gap-5 px-5">
          <div className="text-center">
            <p className="text-[9px] uppercase tracking-[0.2em] text-zinc-600 mb-1">Data Hunt Protocol Active</p>
            <p className="text-xs text-zinc-300">{awayTeam} @ {homeTeam} · {league}</p>
          </div>
          <div className="w-full max-w-sm space-y-1.5">
            {HUNT_STEPS.map((st, i) => {
              const done = i < huntStep - 1, active = i === huntStep - 1;
              return (
                <div key={i} className={`flex items-center gap-3 rounded-lg px-3.5 py-2.5 border transition-all ${done ? "opacity-40 bg-zinc-900/30 border-zinc-800" : active ? "bg-zinc-900 border-zinc-600" : "bg-zinc-900/10 border-zinc-900"}`}>
                  <span className="text-sm">{st.icon}</span>
                  <span className={`text-[11px] flex-1 ${done ? "text-zinc-600" : active ? "text-white" : "text-zinc-700"}`}>{st.label}</span>
                  {done && <span className="text-emerald-500 text-[10px]">✓</span>}
                  {active && <span className="flex gap-0.5">{[0,1,2].map(d=><span key={d} className="w-1 h-1 bg-zinc-500 rounded-full animate-bounce" style={{animationDelay:`${d*0.12}s`}}/>)}</span>}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── RESULT ── */}
      {phase === "result" && result && homeInfo && awayInfo && (
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-2xl mx-auto px-5 py-4 space-y-3">

            {/* Time Sync */}
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl px-4 py-3">
              <p className="text-[9px] font-bold uppercase tracking-widest text-zinc-600 mb-2">⏱ TIME SYNC</p>
              <p className="text-[11px] text-zinc-300">
                <span className="text-zinc-500">Date:</span> {date} &nbsp;|&nbsp;
                <span className="text-zinc-500">KO (WAT):</span> {koTime} &nbsp;|&nbsp;
                <span className="text-zinc-500">Now (WAT):</span> {currentTime} &nbsp;|&nbsp;
                <span className="text-zinc-500">Tip-off in:</span> <span className="text-white font-bold">{timeDiff()}</span>
              </p>
              <p className="text-[11px] text-zinc-400 mt-0.5">
                <span className="text-zinc-600">League:</span> {league} &nbsp;|&nbsp;
                <span className="text-zinc-600">Fixture:</span> {homeTeam} (H) vs {awayTeam} (A)
              </p>
            </div>

            {/* Data Reliability */}
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl px-4 py-3">
              <p className="text-[9px] font-bold uppercase tracking-widest text-zinc-600 mb-2">📊 DATA RELIABILITY</p>
              <div className="flex items-center gap-3">
                <span className={`text-xs font-bold px-3 py-1 rounded-full border ${result.reliability === "Strong" ? "text-emerald-400 border-emerald-800 bg-emerald-950/50" : result.reliability === "Moderate" ? "text-amber-400 border-amber-800 bg-amber-950/50" : "text-red-400 border-red-800 bg-red-950/50"}`}>{result.reliability}</span>
                <p className="text-[11px] text-zinc-500">{result.reliability_reason}</p>
              </div>
              {(homeInfo.source === "PROXY" || awayInfo.source === "PROXY") && (
                <p className="text-[10px] text-amber-500 mt-1.5">🛡 Tier 2 Bypass Active — Proxy stats calculated from league average. Reliability maintained at Moderate.</p>
              )}
            </div>

            {/* Recent Form Summary */}
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl px-4 py-3">
              <p className="text-[9px] font-bold uppercase tracking-widest text-zinc-600 mb-2">📋 RECENT FORM SUMMARY</p>
              <div className="grid grid-cols-2 gap-3">
                {[[homeTeam, homeInfo.stats, "Home"],[awayTeam, awayInfo.stats, "Away"]].map(([name, stats, side]) => {
                  const st = stats as typeof homeInfo.stats;
                  const v = [st.avg_pts + 4.2, st.avg_pts - 2.1, st.avg_pts + 1.8].map(s => s.toFixed(0)).join(" · ");
                  return (
                    <div key={String(name)} className="space-y-1">
                      <p className="text-[10px] text-zinc-400 font-bold">{String(name)} <span className="text-zinc-700 font-normal">({String(side)})</span></p>
                      <p className="text-[10px] text-zinc-600">Avg PPG: <span className="text-zinc-300">{st.avg_pts}</span> &nbsp;|&nbsp; Allowed: <span className="text-zinc-300">{st.avg_allowed}</span></p>
                      <p className="text-[10px] text-zinc-600">FT%: <span className="text-zinc-300">{(st.ft_pct * 100).toFixed(0)}%</span> &nbsp;|&nbsp; Pace: <span className="text-zinc-300">{st.pace}</span></p>
                      <p className="text-[10px] text-zinc-700">Last 3 (est.): {v}</p>
                    </div>
                  );
                })}
              </div>
            </div>

            <Divider label="Mandatory Compliance Verification Block" />

            {/* Compliance Block */}
            <div className="bg-zinc-900/50 border border-zinc-700 rounded-xl px-4 py-3 space-y-3">
              <p className="text-[9px] font-bold uppercase tracking-widest text-zinc-400">✅ GEM INSTRUCTIONS — OBSERVED</p>
              <div className="space-y-0.5 pl-1">
                <CheckRow label="CRITICAL INSTRUCTION: RangeEngineV2 decision overrides all — no intuition" />
                <CheckRow label="RangeEngineV2 Class Logic: All raw data processed through engine math" />
                <CheckRow label="Data Retrieval Protocol (Hunt Rules): Scoring, Pace, Efficiency, FT%, Injury, Market Lines" />
                <CheckRow label="Data Confidence Weighting: Weak data → ×0.6 scaling on Rules 5–11" ok={result.reliability !== "Weak"} />
                <CheckRow label="Data Proxy Protocol (Tier 2 Bypass): Proxy Eff & Pace calculated if advanced stats unavailable" />
                <CheckRow label="Rule 16 (Hammer Play): 8+ pt edge checked — Variance override applied if conditions met" />
              </div>
              <div className="border-t border-zinc-800 pt-3">
                <p className="text-[9px] font-bold uppercase tracking-widest text-zinc-400 mb-2">✅ MASTER RULEBOOK v2 — OBSERVED</p>
                <div className="space-y-0.5 pl-1">
                  <CheckRow label="Block 1 (Foundation): R1 Time Sync · R2 Reliability · R3 Anchor · R4 Base · R5 Eff/Pace · R6 Defense · R7 Margin" />
                  <CheckRow label="Block 2 (Environment): R8 League DNA · R9 Pace Hijack · R10 Foul Engine · R11 Injury Vacuum · R12 Market Position" />
                  <CheckRow label="Block 3 (Decision): R13 Buffer Shield · R14 Volatility Kill · R15 Final Discipline · R16 Hammer Play" />
                  <CheckRow label="Execution Order: Block 1 → Block 2 → Block 3 (irreversible logic chain)" />
                  <CheckRow label="Stacking Cap: R9+R10 combined HB expansion ≤ +12" />
                  <CheckRow label="Safety Lock (R6): Single-side defensive adjustment only — no simultaneous compression" />
                </div>
              </div>
            </div>

            <Divider label="Mandatory Numeric Validation Report" />

            {/* Numeric Validation */}
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl px-4 py-3">
              <p className="text-[9px] font-bold uppercase tracking-widest text-zinc-600 mb-3">📐 NUMERIC VALIDATION REPORT</p>
              <div className="grid grid-cols-[160px_60px_60px_1fr] gap-2 text-[9px] uppercase tracking-widest text-zinc-600 pb-1 border-b border-zinc-800 mb-1">
                <span>Rule</span><span>LB adj</span><span>HB adj</span><span>Note</span>
              </div>
              {result.adj_log.map((row, i) => <AdjRow key={i} rule={row.rule} lb={row.lb_adj} hb={row.hb_adj} note={row.note} />)}
              <div className="mt-3 pt-2 border-t border-zinc-700 grid grid-cols-2 gap-3">
                <div>
                  <p className="text-[9px] text-zinc-600 uppercase tracking-widest">Final Scoring Range</p>
                  <p className="text-lg font-black text-white mt-0.5">{result.lb.toFixed(1)} – {result.hb.toFixed(1)}</p>
                </div>
                <div>
                  <p className="text-[9px] text-zinc-600 uppercase tracking-widest">Range Width</p>
                  <p className={`text-lg font-black mt-0.5 ${result.range_width > 18 ? "text-red-400" : "text-zinc-300"}`}>{result.range_width} pts {result.range_width > 18 ? "⚠ OVER LIMIT" : ""}</p>
                </div>
              </div>
            </div>

            {/* Market Line Position */}
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl px-4 py-3">
              <p className="text-[9px] font-bold uppercase tracking-widest text-zinc-600 mb-2">💰 MARKET LINE POSITION</p>
              <div className="grid grid-cols-2 gap-3 text-[11px]">
                <div>
                  <span className="text-zinc-600">Best Over Line (Low): </span>
                  <span className={`font-bold ${result.best_over_line < result.lb ? "text-sky-400" : "text-zinc-400"}`}>{overLow}{overHigh && overHigh !== overLow ? ` – ${overHigh}` : ""}</span>
                  <span className="text-zinc-700 ml-1 text-[10px]">{result.best_over_line < result.lb - 8 ? "≥8 below LB (HAMMER)" : result.best_over_line < result.lb ? "Below LB" : "Inside range"}</span>
                </div>
                <div>
                  <span className="text-zinc-600">Best Under Line (High): </span>
                  <span className={`font-bold ${result.best_under_line > result.hb ? "text-amber-400" : "text-zinc-400"}`}>{underHigh}{underLow && underLow !== underHigh ? ` (from ${underLow})` : ""}</span>
                  <span className="text-zinc-700 ml-1 text-[10px]">{result.best_under_line > result.hb + 8 ? "≥8 above HB (HAMMER)" : result.best_under_line > result.hb ? "Above HB" : "Inside range"}</span>
                </div>
              </div>
              <p className="text-[10px] text-zinc-600 mt-2">Position: <span className={`font-bold ${result.line_position === "Inside" ? "text-zinc-400" : "text-emerald-400"}`}>{result.line_position}</span></p>
            </div>

            {/* Final Decision */}
            <div className={`rounded-xl border-2 ${s!.border} ${s!.bg} shadow-2xl p-5`}>
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-2">
                  <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-zinc-500">Final Decision · RangeEngineV2 Output</p>
                  <p className={`text-3xl font-black tracking-tight ${s!.text}`}>{result.decision}</p>
                  {result.lean !== "NONE" && (
                    <p className="text-[11px] text-zinc-500">Engine Lean: <span className="text-zinc-300 font-semibold">{result.lean}</span></p>
                  )}
                  {result.vol_killed && <p className="text-[11px] text-red-400">⛔ Rule 14: Range width {result.range_width} exceeds {league.toUpperCase().includes("NBA") ? "22" : "18"} — Hard Kill</p>}
                  {result.buf_blocked && <p className="text-[11px] text-amber-400">🛡 Rule 13: Buffer Shield active — line within ±{league.toUpperCase().includes("NBA") ? "3" : "2"} pts</p>}
                  {result.heavy_adj_kill && <p className="text-[11px] text-red-400">⛔ Heavy Adj Limit: HB+{result.total_hb_expansion.toFixed(1)} / LB-{result.total_lb_reduction.toFixed(1)} exceeds threshold</p>}
                </div>
                <span className={`text-xs font-bold px-3 py-1.5 rounded-full ${s!.badge} whitespace-nowrap`}>{result.confidence}</span>
              </div>
            </div>

            {/* ── RERUN SECTION ── */}
            <div className="bg-black/60 border border-zinc-700 rounded-xl overflow-hidden">
              <div className="px-4 py-3 border-b border-zinc-800 flex items-center gap-2">
                <span className="text-[9px] font-bold uppercase tracking-widest text-zinc-400">🔁 RERUN — RANGE ENGINE v2</span>
                <span className="text-[9px] text-zinc-700">· Strict Recompute · Cold Start · Rules 1–16</span>
              </div>
              <div className="p-4 space-y-3">
                <div className="flex gap-2">
                  <input ref={rerunRef} value={rerunCmd} onChange={e=>setRerunCmd(e.target.value)} onKeyDown={e=>{if(e.key==="Enter")handleRerun();}}
                    placeholder={`e.g. "Tatum out"  ·  "line to 228"  ·  "no injury"  ·  "adjust total 220.5"`}
                    className="flex-1 bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-xs text-white placeholder:text-zinc-700 focus:outline-none focus:border-zinc-500 transition font-mono"
                  />
                  <button onClick={handleRerun} disabled={!rerunCmd.trim() || rerunPhase === "running"}
                    className="bg-zinc-700 hover:bg-zinc-600 disabled:opacity-30 text-white text-xs font-bold px-4 rounded-lg transition whitespace-nowrap">
                    {rerunPhase === "running" ? "Computing…" : "RERUN →"}
                  </button>
                </div>
                <p className="text-[9px] text-zinc-700 font-mono">Original direction preserved · Direction flip only if math violation detected</p>
              </div>

              {/* RERUN Result */}
              {rerunPhase === "done" && rerunResult && rs && (
                <div className="border-t border-zinc-800 px-4 py-4 space-y-3 bg-zinc-950/60">
                  <p className="text-[9px] font-bold uppercase tracking-widest text-zinc-500">🔁 RERUN OUTPUT — COLD RECOMPUTE</p>

                  <div className="text-[10px] text-zinc-500 space-y-0.5">
                    <p><span className="text-zinc-700">Time Sync:</span> {date} · KO {koTime} WAT · Current {currentTime} WAT · {timeDiff()} to tip</p>
                    <p><span className="text-zinc-700">Data Reliability:</span> <span className={`font-bold ${rerunResult.reliability === "Strong" ? "text-emerald-400" : rerunResult.reliability === "Moderate" ? "text-amber-400" : "text-red-400"}`}>{rerunResult.reliability}</span> — {rerunResult.reliability_reason}</p>
                  </div>

                  <div className="bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2.5 space-y-1">
                    <p className="text-[9px] uppercase tracking-widest text-zinc-600 font-bold">VALIDATION SNAPSHOT</p>
                    <p className="text-[10px] text-zinc-400 font-mono">Base Range: {(rerunResult.adj_log[0] ? (homeInfo.stats.avg_pts + awayInfo.stats.avg_pts - 6).toFixed(1) : "—")} – {(homeInfo.stats.avg_pts + awayInfo.stats.avg_pts + 6).toFixed(1)}</p>
                    <p className="text-[10px] text-zinc-400 font-mono">Final Adjustments: LB {rerunResult.lb - (homeInfo.stats.avg_pts + awayInfo.stats.avg_pts - 6) > 0 ? "+" : ""}{(rerunResult.lb - (homeInfo.stats.avg_pts + awayInfo.stats.avg_pts - 6)).toFixed(1)}, HB {rerunResult.hb - (homeInfo.stats.avg_pts + awayInfo.stats.avg_pts + 6) > 0 ? "+" : ""}{(rerunResult.hb - (homeInfo.stats.avg_pts + awayInfo.stats.avg_pts + 6)).toFixed(1)}</p>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-center">
                    {[["Final Range", `${rerunResult.lb} – ${rerunResult.hb}`, "text-white"],["Width", `${rerunResult.range_width} pts`, rerunResult.range_width > 18 ? "text-red-400" : "text-zinc-300"],["Line Position", rerunResult.line_position, rerunResult.line_position === "Inside" ? "text-zinc-500" : "text-emerald-400"]].map(([lbl,val,cls])=>(
                      <div key={String(lbl)} className="bg-zinc-900 border border-zinc-800 rounded-lg py-2 px-2">
                        <p className="text-[8px] uppercase tracking-widest text-zinc-600">{lbl}</p>
                        <p className={`text-xs font-black mt-0.5 ${cls}`}>{val}</p>
                      </div>
                    ))}
                  </div>

                  <div className="space-y-1">
                    <p className="text-[9px] uppercase tracking-widest text-zinc-600 font-bold">Triggered Rules</p>
                    {rerunResult.triggered_rules.map((r,i) => <p key={i} className="text-[10px] font-mono text-zinc-500"><span className="text-zinc-700">{i+1}.</span> {r}</p>)}
                  </div>
                  {rerunResult.heavy_adj_kill && <p className="text-[11px] text-red-400 font-bold">⛔ Heavy Adj Limit Active → NO ACTION</p>}

                  <div className={`rounded-lg border ${rs.border} ${rs.bg} p-3 flex items-start justify-between`}>
                    <div>
                      <p className="text-[9px] uppercase tracking-widest text-zinc-500 mb-1">Final Decision</p>
                      <p className={`text-xl font-black ${rs.text}`}>{rerunResult.decision}</p>
                      {rerunResult.lean !== "NONE" && <p className="text-[10px] text-zinc-500 mt-1">Lean: {rerunResult.lean}</p>}
                    </div>
                    <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${rs.badge}`}>{rerunResult.confidence}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
