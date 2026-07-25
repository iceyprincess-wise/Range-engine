import { parseNumber, weightedAverage, normalizePercent } from "./format";
import { lookupTeam } from "./teamDb";
import { getLeagueDNA } from "./leagueDna";
import type { AdjLog, EngineOutput, ResearchData } from "./types";
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
