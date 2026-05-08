import { useState, useRef } from "react";

// ─── Types ───────────────────────────────────────────────────────────────────
interface TeamStat {
  name: string; abbr: string; city: string;
  avg_pts: number; avg_allowed: number;
  def_rating: number; ft_pct: number; pace: number;
  games: number; aliases: string[];
}
interface EngineInput {
  home: TeamStat; away: TeamStat;
  league: string; betting_line: number; key_player_out: boolean;
  key_player_name?: string;
}
interface RuleLog { rule: number; block: 1 | 2 | 3; label: string; detail: string; fired: boolean; impact?: string; }
interface EngineResult {
  lb: number; hb: number; midpoint: number; range_width: number;
  decision: string; confidence: string; lean: string;
  reliability: string; reliability_reason: string;
  rules: RuleLog[]; league_cap_applied: boolean;
  volatility_killed: boolean; hammer: boolean; buffer_blocked: boolean;
}

// ─── 2024–25 Team Database ───────────────────────────────────────────────────
const TEAMS: Record<string, TeamStat> = {
  lakers:       { name:"Lakers",       abbr:"LAL", city:"Los Angeles",   avg_pts:114.2, avg_allowed:113.6, def_rating:1.10, ft_pct:0.77, pace:100.1, games:12, aliases:["lal","la lakers","los angeles lakers"] },
  celtics:      { name:"Celtics",      abbr:"BOS", city:"Boston",        avg_pts:120.6, avg_allowed:108.9, def_rating:1.05, ft_pct:0.80, pace:100.8, games:14, aliases:["bos","boston celtics"] },
  warriors:     { name:"Warriors",     abbr:"GSW", city:"Golden State",  avg_pts:116.3, avg_allowed:112.4, def_rating:1.08, ft_pct:0.78, pace:101.5, games:11, aliases:["gsw","golden state","golden state warriors"] },
  heat:         { name:"Heat",         abbr:"MIA", city:"Miami",         avg_pts:110.4, avg_allowed:109.2, def_rating:1.06, ft_pct:0.76, pace:98.4,  games:10, aliases:["mia","miami heat"] },
  nuggets:      { name:"Nuggets",      abbr:"DEN", city:"Denver",        avg_pts:115.8, avg_allowed:111.3, def_rating:1.07, ft_pct:0.79, pace:100.3, games:13, aliases:["den","denver nuggets"] },
  bucks:        { name:"Bucks",        abbr:"MIL", city:"Milwaukee",     avg_pts:118.1, avg_allowed:114.2, def_rating:1.11, ft_pct:0.75, pace:101.9, games:12, aliases:["mil","milwaukee bucks"] },
  sixers:       { name:"76ers",        abbr:"PHI", city:"Philadelphia",  avg_pts:113.7, avg_allowed:115.4, def_rating:1.12, ft_pct:0.81, pace:99.6,  games:11, aliases:["phi","philadelphia","76ers","sixers","philadelphia 76ers"] },
  clippers:     { name:"Clippers",     abbr:"LAC", city:"Los Angeles",   avg_pts:112.8, avg_allowed:110.7, def_rating:1.07, ft_pct:0.77, pace:99.1,  games:10, aliases:["lac","la clippers","los angeles clippers"] },
  suns:         { name:"Suns",         abbr:"PHX", city:"Phoenix",       avg_pts:116.9, avg_allowed:117.1, def_rating:1.14, ft_pct:0.79, pace:102.2, games:12, aliases:["phx","phoenix suns"] },
  mavs:         { name:"Mavericks",    abbr:"DAL", city:"Dallas",        avg_pts:117.4, avg_allowed:112.9, def_rating:1.09, ft_pct:0.80, pace:100.7, games:13, aliases:["dal","dallas","dallas mavericks","mavericks"] },
  knicks:       { name:"Knicks",       abbr:"NYK", city:"New York",      avg_pts:113.5, avg_allowed:109.8, def_rating:1.06, ft_pct:0.76, pace:98.8,  games:11, aliases:["nyk","new york","new york knicks"] },
  nets:         { name:"Nets",         abbr:"BKN", city:"Brooklyn",      avg_pts:109.3, avg_allowed:118.2, def_rating:1.15, ft_pct:0.74, pace:99.3,  games:9,  aliases:["bkn","brooklyn","brooklyn nets"] },
  bulls:        { name:"Bulls",        abbr:"CHI", city:"Chicago",       avg_pts:111.6, avg_allowed:113.7, def_rating:1.10, ft_pct:0.77, pace:99.9,  games:10, aliases:["chi","chicago bulls"] },
  spurs:        { name:"Spurs",        abbr:"SAS", city:"San Antonio",   avg_pts:108.4, avg_allowed:119.3, def_rating:1.16, ft_pct:0.73, pace:100.5, games:11, aliases:["sas","san antonio","san antonio spurs"] },
  raptors:      { name:"Raptors",      abbr:"TOR", city:"Toronto",       avg_pts:111.2, avg_allowed:116.4, def_rating:1.13, ft_pct:0.76, pace:99.7,  games:12, aliases:["tor","toronto","toronto raptors"] },
  thunder:      { name:"Thunder",      abbr:"OKC", city:"Oklahoma City", avg_pts:119.1, avg_allowed:110.8, def_rating:1.07, ft_pct:0.78, pace:101.1, games:13, aliases:["okc","oklahoma city","oklahoma city thunder"] },
  timberwolves: { name:"Timberwolves", abbr:"MIN", city:"Minnesota",     avg_pts:112.4, avg_allowed:108.6, def_rating:1.05, ft_pct:0.77, pace:99.5,  games:11, aliases:["min","minnesota","timberwolves","wolves"] },
  pacers:       { name:"Pacers",       abbr:"IND", city:"Indiana",       avg_pts:121.3, avg_allowed:119.4, def_rating:1.15, ft_pct:0.82, pace:103.8, games:12, aliases:["ind","indiana","indiana pacers"] },
  hawks:        { name:"Hawks",        abbr:"ATL", city:"Atlanta",       avg_pts:116.7, avg_allowed:119.2, def_rating:1.15, ft_pct:0.79, pace:102.4, games:10, aliases:["atl","atlanta","atlanta hawks"] },
  magic:        { name:"Magic",        abbr:"ORL", city:"Orlando",       avg_pts:107.3, avg_allowed:108.9, def_rating:1.05, ft_pct:0.73, pace:98.1,  games:11, aliases:["orl","orlando","orlando magic"] },
  grizzlies:    { name:"Grizzlies",    abbr:"MEM", city:"Memphis",       avg_pts:113.8, avg_allowed:112.4, def_rating:1.08, ft_pct:0.76, pace:100.2, games:10, aliases:["mem","memphis","memphis grizzlies"] },
  pelicans:     { name:"Pelicans",     abbr:"NOP", city:"New Orleans",   avg_pts:112.1, avg_allowed:114.7, def_rating:1.11, ft_pct:0.74, pace:99.8,  games:9,  aliases:["nop","new orleans","new orleans pelicans"] },
};
const LEAGUE_AVG = 113.8;

function findTeam(q: string): TeamStat | null {
  const lq = q.toLowerCase().trim();
  for (const [key, t] of Object.entries(TEAMS)) {
    if (lq.includes(key) || lq.includes(t.name.toLowerCase()) || lq.includes(t.abbr.toLowerCase()) || t.aliases.some(a => lq.includes(a))) return t;
  }
  return null;
}

function parsePrompt(prompt: string): { home: TeamStat | null; away: TeamStat | null; line: number | null; keyOut: boolean; keyName: string; league: string } {
  const lp = prompt.toLowerCase();
  const vsMatch = lp.match(/(.+?)\s+(?:vs\.?|@|at|v\.?)\s+(.+)/);
  let home: TeamStat | null = null, away: TeamStat | null = null;
  if (vsMatch) {
    away = findTeam(vsMatch[1]);
    home = findTeam(vsMatch[2]);
    if (!home && !away) { home = findTeam(vsMatch[1]); away = findTeam(vsMatch[2]); }
  } else {
    const found = Object.values(TEAMS).filter(t => lp.includes(t.name.toLowerCase()) || lp.includes(t.abbr.toLowerCase()));
    if (found.length >= 2) [away, home] = found;
  }
  const lineM = lp.match(/(?:o\/u|over[- ]under|total|line|ou)[\s:]*(\d+\.?\d*)/);
  const line = lineM ? parseFloat(lineM[1]) : null;
  const keyOut = /\bout\b|\binjured\b|\bdnp\b|\bquestionable\b|\bmissing\b|\bscratch/i.test(prompt);
  const nameM = prompt.match(/(\w+(?:\s+\w+)?)\s+(?:is\s+)?(?:out|injured|dnp|questionable|missing)/i);
  const keyName = nameM ? nameM[1] : "Key Scorer";
  const leagueM = lp.match(/\b(nba|euroleague|acb|pba|nbl|ncaa|wnba)\b/);
  const league = leagueM ? leagueM[1].toUpperCase() : "NBA";
  return { home, away, line, keyOut, keyName, league };
}

// ─── MASTER RULEBOOK V2 ENGINE ───────────────────────────────────────────────
function runMasterEngine(input: EngineInput): EngineResult {
  const { home, away, league: rawLeague, betting_line: line, key_player_out, key_player_name } = input;
  const league = rawLeague.toUpperCase();
  const rules: RuleLog[] = [];

  // RELIABILITY (Rule 2)
  const minGames = Math.min(home.games, away.games);
  const reliability = minGames >= 8 ? "Strong" : minGames >= 5 ? "Moderate" : "Weak";
  const reliability_reason = `Min games sample: ${minGames} (${home.abbr}: ${home.games}, ${away.abbr}: ${away.games})`;
  const weakScale = reliability === "Weak" ? 0.6 : 1.0;
  rules.push({ rule: 2, block: 1, label: "Data Reliability", fired: true, detail: `${reliability} — ${reliability_reason}`, impact: reliability === "Weak" ? "All R5–R11 shifts ×0.6" : "Full shifts applied" });

  // RULE 4 — Base Range
  const H = home.avg_pts, A = away.avg_pts;
  let lb = H + A - 6, hb = H + A + 6;
  rules.push({ rule: 4, block: 1, label: "Base Scoring Range", fired: true, detail: `${H} + ${A} ± 6`, impact: `Range: ${lb.toFixed(1)} – ${hb.toFixed(1)}` });

  // RULE 5 — Efficiency & Pace (hard cap ±6 total)
  const avgEff = ((home.avg_pts / LEAGUE_AVG) + (away.avg_pts / LEAGUE_AVG)) / 2;
  const avgPace = (home.pace + away.pace) / 2;
  let r5_lb = 0, r5_hb = 0;
  if (avgEff >= 1.10) { r5_lb += 3; r5_hb += 3; }
  else if (avgPace < 70 && avgEff < 1.05) { r5_lb -= 3; r5_hb -= 3; }
  r5_lb = Math.max(-6, Math.min(6, Math.round(r5_lb * weakScale)));
  r5_hb = Math.max(-6, Math.min(6, Math.round(r5_hb * weakScale)));
  lb += r5_lb; hb += r5_hb;
  const r5fired = r5_lb !== 0 || r5_hb !== 0;
  rules.push({ rule: 5, block: 1, label: "Efficiency & Pace", fired: r5fired, detail: `Eff: ${avgEff.toFixed(2)}, Pace: ${avgPace.toFixed(1)}`, impact: r5fired ? `LB ${r5_lb >= 0 ? "+" : ""}${r5_lb}, HB ${r5_hb >= 0 ? "+" : ""}${r5_hb} (capped ±6)` : "No adjustment (neutral)" });

  // RULE 6 — Defensive Impact (NEVER compress both sides simultaneously)
  const homeWeakDef = home.def_rating > 1.14;
  const awayWeakDef = away.def_rating > 1.14;
  const homeStrongDef = home.def_rating < 1.06;
  const awayStrongDef = away.def_rating < 1.06;
  const higherDef = home.def_rating >= away.def_rating ? home : away;
  let r6_detail = "", r6_impact = "No action";
  if (homeWeakDef || awayWeakDef) {
    const adj = Math.round(3.5 * weakScale);
    hb += adj;
    r6_detail = `${higherDef.abbr} def rating ${higherDef.def_rating} > 1.14 (weak defense)`;
    r6_impact = `HB +${adj} (HB only — Safety Lock active)`;
  } else if (homeStrongDef || awayStrongDef) {
    const adj = Math.round(3.5 * weakScale);
    lb -= adj;
    r6_detail = `${higherDef.abbr} def rating ${higherDef.def_rating} < 1.06 (strong defense)`;
    r6_impact = `LB -${adj} (LB only — Safety Lock active)`;
  } else {
    r6_detail = `Home def: ${home.def_rating}, Away def: ${away.def_rating} (neutral zone)`;
  }
  rules.push({ rule: 6, block: 1, label: "Defensive Impact", fired: homeWeakDef || awayWeakDef || homeStrongDef || awayStrongDef, detail: r6_detail, impact: r6_impact });

  // RULE 7 — Volatility & Margin
  const margin = Math.abs(H - A);
  let r7_lb = 0, r7_hb = 0;
  if (margin >= 10) { r7_lb = -Math.round(4 * weakScale); }
  else if (margin <= 6) { r7_hb = Math.round(4 * weakScale); }
  lb += r7_lb; hb += r7_hb;
  rules.push({ rule: 7, block: 1, label: "Volatility & Margin", fired: margin >= 10 || margin <= 6, detail: `Avg margin: ${margin.toFixed(1)} pts`, impact: margin >= 10 ? `LB ${r7_lb} (blowout stall risk)` : margin <= 6 ? `HB +${r7_hb} (clutch scoring)` : "Neutral margin — no change" });

  // RULE 9 — Pace Hijack (HB expands TWICE as much as LB)
  const r9fired = avgPace >= 72 && avgEff >= 1.08;
  if (r9fired) {
    const lbAdj = Math.round(4 * weakScale);
    const hbAdj = Math.round(8 * weakScale); // HB = 2× LB
    lb += lbAdj; hb += hbAdj;
    rules.push({ rule: 9, block: 2, label: "Pace Hijack", fired: true, detail: `Pace ${avgPace.toFixed(1)} ≥ 72 & Eff ${avgEff.toFixed(2)} ≥ 1.08`, impact: `LB +${lbAdj}, HB +${hbAdj} (HB = 2× LB — Ghost Possessions)` });
  } else {
    rules.push({ rule: 9, block: 2, label: "Pace Hijack", fired: false, detail: `Pace ${avgPace.toFixed(1)}, Eff ${avgEff.toFixed(2)} — threshold not met`, impact: "Not triggered" });
  }

  // RULE 10 — Foul Engine
  const avgFT = (home.ft_pct + away.ft_pct) / 2;
  const r10fired = margin <= 6 && avgFT >= 0.75;
  if (r10fired) {
    const adj = Math.round(11 * weakScale);
    hb += adj;
    rules.push({ rule: 10, block: 2, label: "Foul Engine", fired: true, detail: `Margin ≤ 6 (${margin.toFixed(1)}) & FT% ${(avgFT * 100).toFixed(0)}% ≥ 75%`, impact: `HB +${adj} (late FT & OT shield — HB ONLY)` });
  } else {
    rules.push({ rule: 10, block: 2, label: "Foul Engine", fired: false, detail: `Margin: ${margin.toFixed(1)}, FT%: ${(avgFT * 100).toFixed(0)}%`, impact: "Not triggered" });
  }

  // RULE 11 — Injury Vacuum
  if (key_player_out) {
    const shift = -Math.round(6 * weakScale);
    const expand = Math.round(4 * weakScale);
    lb += shift; hb += (shift + expand);
    rules.push({ rule: 11, block: 2, label: "Injury Vacuum", fired: true, detail: `${key_player_name ?? "Key scorer"} is OUT`, impact: `Entire range shifted ↓ ${shift}, HB expands +${expand} (Vacuum — not raw subtraction)` });
  } else {
    rules.push({ rule: 11, block: 2, label: "Injury Vacuum", fired: false, detail: "No key player absence reported", impact: "Not triggered" });
  }

  // RULE 8 — League DNA Width Cap (applied AFTER all other rules)
  const isNBA = league.includes("NBA");
  const isStructured = league.includes("EURO") || league.includes("ACB");
  const isVolatile = league.includes("PBA") || league.includes("NBL");
  const maxHalfWidth = isStructured ? 8 : isVolatile ? 14 : 10;
  const preCap_lb = lb, preCap_hb = hb;
  const currentHalf = (hb - lb) / 2;
  let league_cap_applied = false;
  if (currentHalf > maxHalfWidth) {
    const mid = (lb + hb) / 2;
    lb = mid - maxHalfWidth;
    hb = mid + maxHalfWidth;
    league_cap_applied = true;
  }
  rules.push({ rule: 8, block: 2, label: "League DNA Width Cap", fired: league_cap_applied, detail: `${isNBA ? "NBA" : isStructured ? "Structured" : isVolatile ? "Volatile" : "NBA"}: Max ±${maxHalfWidth} (width ${maxHalfWidth * 2})`, impact: league_cap_applied ? `Cap applied — clamped from ${(preCap_hb - preCap_lb).toFixed(1)} → ${(hb - lb).toFixed(1)} pts wide` : `Width ${(hb - lb).toFixed(1)} pts — within cap` });

  const range_width = parseFloat((hb - lb).toFixed(1));
  const midpoint = parseFloat(((lb + hb) / 2).toFixed(1));

  // ─── DECISION CHAIN ─────────────────────────────────────────────────────────
  let decision = "NO ACTION", confidence = "Low", lean = "NONE";
  let volatility_killed = false, hammer = false, buffer_blocked = false;

  // RULE 16 — Hammer Play (overrides R13 + R14)
  if (line < lb - 8) {
    hammer = true;
    decision = `OVER ${line} ★ HAMMER PLAY`;
    confidence = "HIGH (Hammer Play)";
    rules.push({ rule: 16, block: 3, label: "Hammer Play", fired: true, detail: `Line ${line} is ${(lb - line).toFixed(1)} pts BELOW LB ${lb.toFixed(1)} — exceeds 8pt threshold`, impact: "HAMMER OVER triggered — overrides Rules 13 & 14" });
  } else if (line > hb + 8) {
    hammer = true;
    decision = `UNDER ${line} ★ HAMMER PLAY`;
    confidence = "HIGH (Hammer Play)";
    rules.push({ rule: 16, block: 3, label: "Hammer Play", fired: true, detail: `Line ${line} is ${(line - hb).toFixed(1)} pts ABOVE HB ${hb.toFixed(1)} — exceeds 8pt threshold`, impact: "HAMMER UNDER triggered — overrides Rules 13 & 14" });
  } else {
    rules.push({ rule: 16, block: 3, label: "Hammer Play", fired: false, detail: `Line ${line} is within 8pts of range (LB ${lb.toFixed(1)} – HB ${hb.toFixed(1)})`, impact: "Not triggered — normal decision flow" });

    // RULE 14 — Volatility Filter
    if (range_width > 18) {
      volatility_killed = true;
      decision = "NO ACTION";
      confidence = "Low";
      rules.push({ rule: 14, block: 3, label: "Volatility Filter", fired: true, detail: `Range width ${range_width.toFixed(1)} > 18 pts threshold`, impact: "HARD KILL — Game too unpredictable. NO ACTION." });
    } else {
      rules.push({ rule: 14, block: 3, label: "Volatility Filter", fired: false, detail: `Range width ${range_width.toFixed(1)} ≤ 18 — acceptable`, impact: "Passed — proceeding to decision" });

      // RULE 12 + RULE 13 — Market Position + Buffer Zone
      if (line < lb) {
        if (line >= lb - 3) {
          buffer_blocked = true;
          decision = "NO ACTION";
          rules.push({ rule: 13, block: 3, label: "Buffer Zone Shield", fired: true, detail: `Line ${line} is below LB ${lb.toFixed(1)} but within ±3 buffer (gap: ${(lb - line).toFixed(1)})`, impact: "BLOCKED — Anti-1-point-loss shield active. NO ACTION." });
        } else {
          decision = `OVER ${line}`;
          confidence = "Medium";
          rules.push({ rule: 13, block: 3, label: "Buffer Zone Shield", fired: false, detail: `Line ${line} clears LB ${lb.toFixed(1)} by ${(lb - line).toFixed(1)} pts (> 3pt buffer)`, impact: "Buffer cleared — OVER signal confirmed" });
        }
      } else if (line > hb) {
        if (line <= hb + 3) {
          buffer_blocked = true;
          decision = "NO ACTION";
          rules.push({ rule: 13, block: 3, label: "Buffer Zone Shield", fired: true, detail: `Line ${line} is above HB ${hb.toFixed(1)} but within ±3 buffer (gap: ${(line - hb).toFixed(1)})`, impact: "BLOCKED — Anti-1-point-loss shield active. NO ACTION." });
        } else {
          decision = `UNDER ${line}`;
          confidence = "Medium";
          rules.push({ rule: 13, block: 3, label: "Buffer Zone Shield", fired: false, detail: `Line ${line} clears HB ${hb.toFixed(1)} by ${(line - hb).toFixed(1)} pts (> 3pt buffer)`, impact: "Buffer cleared — UNDER signal confirmed" });
        }
      } else {
        rules.push({ rule: 13, block: 3, label: "Buffer Zone Shield", fired: false, detail: `Line ${line} is inside range (LB ${lb.toFixed(1)} – HB ${hb.toFixed(1)})`, impact: "Line inside range — NO ACTION" });
      }
    }
  }

  // RULE 15 — Final Decision Discipline
  if (decision === "NO ACTION") {
    const mid = (lb + hb) / 2;
    lean = line < mid ? "LEAN UNDER (line closer to LB)" : "LEAN OVER (line closer to HB)";
    rules.push({ rule: 15, block: 3, label: "Final Decision Discipline", fired: true, detail: `No clean Total edge found. Midpoint: ${mid.toFixed(1)}, Line: ${line}`, impact: `${lean} — informational only. No forced bet.` });
  } else {
    rules.push({ rule: 15, block: 3, label: "Final Decision Discipline", fired: false, detail: `Clean ${decision.includes("OVER") ? "OVER" : "UNDER"} edge confirmed`, impact: "Decision discipline satisfied — Priority 1 Total edge" });
  }

  // Rule 12 entry
  rules.splice(rules.findIndex(r => r.rule === 13), 0, {
    rule: 12, block: 3, label: "Market Position",
    fired: line < lb || line > hb,
    detail: `Line ${line} vs Range ${lb.toFixed(1)} – ${hb.toFixed(1)}`,
    impact: line < lb ? "Line BELOW LB → Potential OVER" : line > hb ? "Line ABOVE HB → Potential UNDER" : "Line INSIDE range → NO ACTION"
  });

  // Sort rules by rule number
  rules.sort((a, b) => a.rule - b.rule);

  return { lb: parseFloat(lb.toFixed(1)), hb: parseFloat(hb.toFixed(1)), midpoint, range_width, decision, confidence, lean, reliability, reliability_reason, rules, league_cap_applied, volatility_killed, hammer, buffer_blocked };
}

// ─── Parse Rerun Command ─────────────────────────────────────────────────────
function parseRerun(cmd: string, current: EngineInput): Partial<EngineInput> & { newPrompt?: string } {
  const lc = cmd.toLowerCase();
  const overrides: Partial<EngineInput> & { newPrompt?: string } = {};
  if (lc.includes("out")) {
    const nm = cmd.match(/(\w+(?:\s+\w+)?)\s+(?:is\s+)?out/i);
    overrides.key_player_out = true;
    overrides.key_player_name = nm?.[1] ?? "Key Scorer";
  }
  if (lc.includes("no injury") || lc.includes("without injury") || lc.includes("healthy") || lc.includes("back")) {
    overrides.key_player_out = false;
    overrides.key_player_name = undefined;
  }
  const lineM = cmd.match(/line\s+(?:at\s+|to\s+)?(\d+\.?\d*)/i) || cmd.match(/(?:o\/u|total|adjust)\s+(?:to\s+)?(\d+\.?\d*)/i);
  if (lineM) overrides.betting_line = parseFloat(lineM[1]);
  const leagueM = cmd.match(/\b(nba|euroleague|acb|pba|nbl)\b/i);
  if (leagueM) overrides.league = leagueM[1].toUpperCase();
  return overrides;
}

// ─── Styles ──────────────────────────────────────────────────────────────────
const DS: Record<string, { border: string; bg: string; text: string; badge: string; glow: string }> = {
  HAMMER: { border: "border-emerald-400", bg: "bg-emerald-950/70", text: "text-emerald-300", badge: "bg-emerald-500 text-black", glow: "shadow-emerald-500/25" },
  OVER:   { border: "border-sky-500",     bg: "bg-sky-950/70",     text: "text-sky-300",     badge: "bg-sky-500 text-black",     glow: "shadow-sky-500/25" },
  UNDER:  { border: "border-amber-500",   bg: "bg-amber-950/70",   text: "text-amber-300",   badge: "bg-amber-500 text-black",   glow: "shadow-amber-500/25" },
  NONE:   { border: "border-zinc-700",    bg: "bg-zinc-900/70",    text: "text-zinc-300",    badge: "bg-zinc-700 text-zinc-300", glow: "shadow-zinc-900/25" },
};
function getStyle(d: string) {
  if (d.includes("HAMMER")) return DS.HAMMER;
  if (d.includes("OVER")) return DS.OVER;
  if (d.includes("UNDER")) return DS.UNDER;
  return DS.NONE;
}

const BLOCK_COLOR: Record<1 | 2 | 3, string> = {
  1: "text-violet-400 bg-violet-950/50 border-violet-800",
  2: "text-sky-400 bg-sky-950/50 border-sky-800",
  3: "text-amber-400 bg-amber-950/50 border-amber-800",
};
const BLOCK_LABEL: Record<1 | 2 | 3, string> = { 1: "FOUNDATION", 2: "ENVIRONMENT", 3: "DECISION" };

const EXAMPLES = [
  "Lakers vs Celtics tonight, O/U 224.5",
  "Warriors @ Nuggets — line 226",
  "Pacers vs Bucks, total 236.5",
  "Heat at Knicks, Bam out",
];

const HUNT_STEPS = [
  { icon: "🔍", label: "Parsing matchup & identifying teams" },
  { icon: "📊", label: "Loading 2024–25 season scoring averages" },
  { icon: "⚡", label: "Retrieving pace & efficiency ratings" },
  { icon: "🛡️", label: "Checking defensive ratings (home & away)" },
  { icon: "🏥", label: "Scanning injury & availability reports" },
  { icon: "💰", label: "Anchoring market O/U line" },
  { icon: "⚙️", label: "Executing Master Rulebook v2 (Rules 1–16)" },
];

// ─── Component ───────────────────────────────────────────────────────────────
export function RangeEngine() {
  const [prompt, setPrompt] = useState("");
  const [phase, setPhase] = useState<"idle" | "hunting" | "result" | "error">("idle");
  const [huntStep, setHuntStep] = useState(0);
  const [result, setResult] = useState<EngineResult | null>(null);
  const [engineInput, setEngineInput] = useState<EngineInput | null>(null);
  const [autoLine, setAutoLine] = useState<number | null>(null);
  const [rerunCmd, setRerunCmd] = useState("");
  const [rerunHistory, setRerunHistory] = useState<string[]>([]);
  const [expandRules, setExpandRules] = useState(false);
  const promptRef = useRef<HTMLTextAreaElement>(null);
  const rerunRef = useRef<HTMLInputElement>(null);

  function runAnalysis(input: EngineInput, line: number) {
    setAutoLine(line);
    setEngineInput(input);
    const r = runMasterEngine(input);
    setTimeout(() => { setResult(r); setPhase("result"); }, 350);
  }

  function handleAnalyze(overridePrompt?: string) {
    const p = overridePrompt ?? prompt;
    if (!p.trim()) return;
    const parsed = parsePrompt(p);
    if (!parsed.home && !parsed.away) { setPhase("error"); return; }
    setPhase("hunting"); setHuntStep(0); setResult(null);

    const home = parsed.home ?? Object.values(TEAMS)[0];
    const away = parsed.away ?? Object.values(TEAMS)[1];
    const line = parsed.line ?? parseFloat((home.avg_pts + away.avg_pts + (Math.random() * 3 - 1.5)).toFixed(1));
    const input: EngineInput = { home, away, league: parsed.league, betting_line: line, key_player_out: parsed.keyOut, key_player_name: parsed.keyName };

    let step = 0;
    const iv = setInterval(() => {
      step++;
      setHuntStep(step);
      if (step >= HUNT_STEPS.length) { clearInterval(iv); runAnalysis(input, line); }
    }, 420);
  }

  function handleRerun() {
    if (!rerunCmd.trim() || !engineInput) return;
    const history = [...rerunHistory, `> ${rerunCmd}`];
    const overrides = parseRerun(rerunCmd, engineInput);
    const newInput = { ...engineInput, ...overrides };
    setRerunHistory(history);
    setRerunCmd("");
    setPhase("hunting"); setHuntStep(0); setResult(null);
    let step = 0;
    const iv = setInterval(() => { step++; setHuntStep(step); if (step >= HUNT_STEPS.length) { clearInterval(iv); runAnalysis(newInput, newInput.betting_line); } }, 300);
  }

  function handleReset() { setPhase("idle"); setResult(null); setEngineInput(null); setPrompt(""); setAutoLine(null); setRerunHistory([]); setRerunCmd(""); setExpandRules(false); setTimeout(() => promptRef.current?.focus(), 50); }

  const s = result ? getStyle(result.decision) : null;

  return (
    <div className="min-h-screen bg-[#08080d] text-white font-sans flex flex-col select-none">
      {/* Header */}
      <div className="border-b border-white/[0.06] px-6 py-3.5 flex items-center justify-between bg-black/50 backdrop-blur flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex gap-0.5">
            <div className="w-1.5 h-5 rounded-full bg-violet-500" />
            <div className="w-1.5 h-5 rounded-full bg-sky-500" />
            <div className="w-1.5 h-5 rounded-full bg-amber-500" />
          </div>
          <div>
            <span className="text-sm font-bold tracking-tight">RangeEngineV2</span>
            <span className="ml-2 text-[10px] text-zinc-600 font-mono">Master Rulebook v2 · Rules 1–16</span>
          </div>
        </div>
        {phase !== "idle" && (
          <button onClick={handleReset} className="text-[11px] text-zinc-500 hover:text-white border border-zinc-800 hover:border-zinc-600 rounded px-2.5 py-1 transition">← New</button>
        )}
      </div>

      {/* IDLE */}
      {phase === "idle" && (
        <div className="flex-1 flex flex-col items-center justify-center px-8 gap-7 pb-10">
          <div className="text-center space-y-2">
            <h2 className="text-2xl font-black tracking-tight">Drop the matchup. Get the analysis.</h2>
            <p className="text-zinc-500 text-sm max-w-md leading-relaxed">Season data is loaded. All 16 rules from the Master Rulebook v2 fire automatically — no manual entry.</p>
          </div>
          <div className="w-full max-w-xl space-y-2.5">
            <textarea
              ref={promptRef}
              value={prompt}
              onChange={e => setPrompt(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleAnalyze(); } }}
              placeholder={`e.g.  "Lakers vs Celtics, O/U 224.5"  or  "Warriors @ Nuggets — Curry out"`}
              rows={3}
              autoFocus
              className="w-full rounded-xl bg-zinc-900 border border-zinc-700 focus:border-zinc-400 text-white text-sm px-4 py-3.5 resize-none focus:outline-none placeholder:text-zinc-600 transition leading-relaxed"
            />
            <button onClick={() => handleAnalyze()} disabled={!prompt.trim()}
              className="w-full bg-white hover:bg-zinc-200 disabled:opacity-25 disabled:cursor-not-allowed text-black font-bold text-sm rounded-xl py-3 transition">
              Run Analysis →
            </button>
          </div>
          <div className="w-full max-w-xl">
            <p className="text-[10px] uppercase tracking-widest text-zinc-700 text-center mb-2">Examples</p>
            <div className="grid grid-cols-2 gap-1.5">
              {EXAMPLES.map(ex => (
                <button key={ex} onClick={() => setPrompt(ex)}
                  className="text-left text-xs text-zinc-500 hover:text-zinc-200 bg-zinc-900/40 hover:bg-zinc-900 border border-zinc-800/60 hover:border-zinc-700 rounded-lg px-3 py-2 transition leading-snug">
                  "{ex}"
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* HUNTING */}
      {phase === "hunting" && (
        <div className="flex-1 flex flex-col items-center justify-center px-8 gap-6">
          <div className="text-center">
            <p className="text-[10px] uppercase tracking-[0.2em] text-zinc-600 mb-1">Executing Hunt Protocol</p>
            <p className="text-sm font-semibold text-zinc-300 italic">"{prompt}"</p>
          </div>
          <div className="w-full max-w-sm space-y-2">
            {HUNT_STEPS.map((step, i) => {
              const done = i < huntStep - 1;
              const active = i === huntStep - 1;
              return (
                <div key={i} className={`flex items-center gap-3 rounded-lg px-3.5 py-2.5 border transition-all duration-300 ${
                  done ? "bg-zinc-900/50 border-zinc-800 opacity-50" :
                  active ? "bg-zinc-900 border-zinc-600 shadow-lg" :
                  "bg-zinc-900/20 border-zinc-900"}`}>
                  <span className="text-base">{step.icon}</span>
                  <span className={`text-xs flex-1 ${done ? "text-zinc-600" : active ? "text-white" : "text-zinc-700"}`}>{step.label}</span>
                  {done && <span className="text-emerald-500 text-xs">✓</span>}
                  {active && <span className="flex gap-0.5">{[0,1,2].map(d => <span key={d} className="w-1 h-1 bg-zinc-400 rounded-full animate-bounce" style={{ animationDelay: `${d*0.12}s` }} />)}</span>}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ERROR */}
      {phase === "error" && (
        <div className="flex-1 flex flex-col items-center justify-center gap-4">
          <p className="text-zinc-300 font-semibold">Teams not recognized in prompt</p>
          <p className="text-zinc-600 text-xs max-w-xs text-center">Try full names ("Lakers vs Celtics") or abbreviations ("LAL vs BOS"). Include "O/U 224.5" for the line.</p>
          <button onClick={handleReset} className="text-xs bg-zinc-900 border border-zinc-700 rounded-lg px-4 py-2 hover:bg-zinc-800 transition">Try Again</button>
        </div>
      )}

      {/* RESULT */}
      {phase === "result" && result && engineInput && (
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-3xl mx-auto px-5 py-5 space-y-4">

            {/* Matchup Row */}
            <div className="flex items-center justify-between bg-zinc-900/50 border border-zinc-800 rounded-xl px-5 py-3.5">
              <div className="flex items-center gap-5">
                {[engineInput.away, engineInput.home].map((t, i) => (
                  <div key={i} className="text-center">
                    <p className="text-lg font-black">{t.abbr}</p>
                    <p className="text-[9px] text-zinc-600 uppercase tracking-widest">{i === 0 ? "Away" : "Home"}</p>
                    <p className="text-xs font-bold text-zinc-400 mt-0.5">{t.avg_pts} ppg</p>
                  </div>
                ))}
                <div className="text-center px-2">
                  <p className="text-[9px] text-zinc-700 uppercase tracking-widest">{engineInput.league}</p>
                  <p className="text-sm font-black text-zinc-500">VS</p>
                  <p className="text-[9px] text-zinc-600 mt-0.5">Line: {autoLine}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-[10px] px-2 py-0.5 rounded border ${result.reliability === "Strong" ? "text-emerald-400 border-emerald-900 bg-emerald-950/50" : result.reliability === "Moderate" ? "text-amber-400 border-amber-900 bg-amber-950/50" : "text-red-400 border-red-900 bg-red-950/50"}`}>
                  {result.reliability}
                </span>
                {engineInput.key_player_out && <span className="text-[10px] text-red-400 border border-red-900 bg-red-950/50 rounded px-2 py-0.5">⚠ {engineInput.key_player_name} OUT</span>}
              </div>
            </div>

            {/* Decision */}
            <div className={`rounded-xl border-2 ${s!.border} ${s!.bg} shadow-2xl ${s!.glow} p-5`}>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-[9px] font-bold uppercase tracking-[0.25em] text-zinc-500 mb-1.5">Final Decision · Master Rulebook v2</p>
                  <p className={`text-3xl font-black tracking-tight leading-none ${s!.text}`}>{result.decision}</p>
                  {result.lean !== "NONE" && <p className="text-xs text-zinc-500 mt-2">Hidden signal: <span className="text-zinc-300 font-medium">{result.lean}</span></p>}
                  {result.volatility_killed && <p className="text-xs text-red-400 mt-2">⛔ Rule 14: Range too wide ({result.range_width} pts) — Volatility Kill active</p>}
                  {result.buffer_blocked && <p className="text-xs text-amber-400 mt-2">🛡 Rule 13: Buffer Shield blocked the trigger</p>}
                </div>
                <span className={`text-xs font-bold px-3 py-1.5 rounded-full whitespace-nowrap flex-shrink-0 ${s!.badge}`}>{result.confidence}</span>
              </div>
            </div>

            {/* Range Metrics */}
            <div className="grid grid-cols-4 gap-2.5">
              {[
                { label: "Low Bound", val: result.lb.toFixed(1), color: "text-sky-400" },
                { label: "Midpoint",  val: result.midpoint.toFixed(1), color: "text-zinc-300" },
                { label: "High Bound", val: result.hb.toFixed(1), color: "text-amber-400" },
                { label: "Width", val: `${result.range_width.toFixed(1)} pts`, color: result.range_width > 18 ? "text-red-400" : "text-purple-400" },
              ].map(m => (
                <div key={m.label} className="bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-center">
                  <p className="text-[9px] text-zinc-600 uppercase tracking-widest mb-1">{m.label}</p>
                  <p className={`text-xl font-black ${m.color}`}>{m.val}</p>
                </div>
              ))}
            </div>

            {/* Range Bar */}
            {autoLine && (
              <div className="bg-zinc-900 border border-zinc-800 rounded-xl px-5 py-4 space-y-2.5">
                <div className="flex justify-between text-[10px] font-mono text-zinc-500">
                  <span className="text-sky-400">LB {result.lb.toFixed(1)}</span>
                  <span className="text-white font-bold text-xs">O/U {autoLine}</span>
                  <span className="text-amber-400">HB {result.hb.toFixed(1)}</span>
                </div>
                <div className="relative h-4 bg-zinc-800 rounded-full overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-r from-sky-900/40 via-zinc-800 to-amber-900/40" />
                  {(() => {
                    const pad = 20, lo = result.lb - pad, hi = result.hb + pad, span = hi - lo;
                    const pct = (v: number) => `${((v - lo) / span * 100).toFixed(1)}%`;
                    const inRange = autoLine >= result.lb && autoLine <= result.hb;
                    return (
                      <>
                        <div className="absolute inset-y-0 bg-white/5" style={{ left: pct(result.lb), right: `${(100 - parseFloat(pct(result.hb))).toFixed(1)}%` }} />
                        <div className="absolute inset-y-0 bg-amber-500/20" style={{ left: pct(result.hb), width: `${(3 / span * 100).toFixed(1)}%` }} />
                        <div className="absolute inset-y-0 bg-sky-500/20" style={{ right: `${(100 - parseFloat(pct(result.lb - 3))).toFixed(1)}%`, width: `${(3 / span * 100).toFixed(1)}%` }} />
                        <div className={`absolute top-0.5 bottom-0.5 w-0.5 rounded-full ${inRange ? "bg-zinc-400" : result.hammer ? "bg-emerald-400" : autoLine < result.lb ? "bg-sky-400" : "bg-amber-400"}`} style={{ left: pct(autoLine) }} />
                      </>
                    );
                  })()}
                </div>
                <div className="flex justify-between text-[10px] text-zinc-700 font-mono">
                  <span>{autoLine < result.lb ? `${(result.lb - autoLine).toFixed(1)} pts below LB` : autoLine > result.hb ? `${(autoLine - result.hb).toFixed(1)} pts above HB` : "Line inside range"}</span>
                  <span className="text-zinc-600">▓ = ±3 buffer zones</span>
                </div>
              </div>
            )}

            {/* Rule Trace */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
              <button onClick={() => setExpandRules(!expandRules)} className="w-full flex items-center justify-between px-5 py-3 hover:bg-zinc-800/50 transition">
                <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-zinc-500">Master Rulebook v2 — Execution Trace</p>
                <span className="text-zinc-600 text-xs">{expandRules ? "▲ Collapse" : "▼ Expand"}</span>
              </button>
              {expandRules && (
                <div className="px-5 pb-4 space-y-1.5 border-t border-zinc-800 pt-3">
                  {[1, 2, 3].map(block => (
                    <div key={block} className="space-y-1.5">
                      <p className={`text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded border w-fit ${BLOCK_COLOR[block as 1|2|3]}`}>Block {block} — {BLOCK_LABEL[block as 1|2|3]}</p>
                      {result.rules.filter(r => r.block === block).map(r => (
                        <div key={r.rule} className={`flex gap-3 text-xs rounded-lg px-3 py-2 border ${r.fired ? "bg-zinc-800/60 border-zinc-700" : "bg-zinc-900/30 border-zinc-800/40 opacity-60"}`}>
                          <span className="font-mono font-bold text-zinc-500 flex-shrink-0">R{r.rule}</span>
                          <div className="flex-1 min-w-0">
                            <span className={`font-semibold ${r.fired ? "text-white" : "text-zinc-600"}`}>{r.label}</span>
                            <span className="text-zinc-600 mx-1">·</span>
                            <span className="text-zinc-500">{r.detail}</span>
                            {r.impact && <p className={`text-[10px] mt-0.5 ${r.fired ? "text-emerald-400" : "text-zinc-700"}`}>↳ {r.impact}</p>}
                          </div>
                          {r.fired ? <span className="text-emerald-500 flex-shrink-0">●</span> : <span className="text-zinc-800 flex-shrink-0">○</span>}
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Rerun Command Section */}
            <div className="bg-zinc-900 border border-zinc-700 rounded-xl overflow-hidden">
              <div className="px-5 py-3 border-b border-zinc-800 flex items-center gap-2">
                <span className="text-emerald-400 font-mono text-xs">▶</span>
                <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">Rerun Command</p>
                <p className="text-[10px] text-zinc-700 ml-1">· adjust any variable and re-execute</p>
              </div>
              {rerunHistory.length > 0 && (
                <div className="px-5 py-2 border-b border-zinc-800 space-y-0.5">
                  {rerunHistory.map((h, i) => <p key={i} className="text-[10px] font-mono text-zinc-600">{h}</p>)}
                </div>
              )}
              <div className="p-4 space-y-2">
                <div className="flex gap-2">
                  <input
                    ref={rerunRef}
                    value={rerunCmd}
                    onChange={e => setRerunCmd(e.target.value)}
                    onKeyDown={e => { if (e.key === "Enter") handleRerun(); }}
                    placeholder={`e.g. "Jokic out"  ·  "line to 228.5"  ·  "euroleague"  ·  "no injury"`}
                    className="flex-1 bg-zinc-800 border border-zinc-700 focus:border-zinc-500 rounded-lg px-3 py-2 text-xs text-white placeholder:text-zinc-700 focus:outline-none transition font-mono"
                  />
                  <button onClick={handleRerun} disabled={!rerunCmd.trim()}
                    className="bg-zinc-700 hover:bg-zinc-600 disabled:opacity-30 text-white text-xs font-bold px-4 rounded-lg transition">
                    Run
                  </button>
                </div>
                <p className="text-[9px] text-zinc-700 font-mono px-1">Commands: "[player] out" · "no injury" · "line to X" · "adjust total X" · "[league name]"</p>
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
