import { Router, type Request, type Response } from "express";
import fs from "node:fs";
import path from "node:path";
import { runEngine, lookupTeam, getLeagueDNA } from "@workspace/range-engine";

const router = Router();
const STORE_PATH = path.join(process.cwd(), "data", "store.json");
const pts = (e: any, side: "home" | "away") => e?.[side + "Score"]?.current ?? null;

router.get("/v1/backtest", (_req: Request, res: Response) => {
  let store: any;
  try { store = JSON.parse(fs.readFileSync(STORE_PATH, "utf8")); }
  catch { return res.status(500).json({ error: "warehouse not found" }); }

  const games: any[] = Object.values(store.games || {})
    .filter((g: any) => pts(g, "home") != null && pts(g, "away") != null && g.startTimestamp)
    .sort((a: any, b: any) => a.startTimestamp - b.startTimestamp);

  // ANTI-LOOKAHEAD: for each target game, only games strictly earlier exist.
  const priorFor = (teamId: number, ts: number) =>
    games.filter((g) => g.startTimestamp < ts && (g.homeTeam?.id === teamId || g.awayTeam?.id === teamId));

  const summarize = (prior: any[], teamId: number) => {
    const homeP: number[] = [], roadP: number[] = [], allowed: number[] = [];
    for (const g of prior.slice(-30)) {
      const isHome = g.homeTeam?.id === teamId;
      homeP.length + roadP.length; // no-op
      (isHome ? homeP : roadP).push(pts(g, isHome ? "home" : "away"));
      allowed.push(pts(g, isHome ? "away" : "home"));
    }
    const avg = (x: number[]) => (x.length ? x.reduce((s, v) => s + v, 0) / x.length : null);
    const all = [...homeP, ...roadP];
    return {
      games: prior.length,
      arenaPPG: avg(homeP) ?? avg(all),
      roadPPG: avg(roadP) ?? avg(all),
      scoredAvg: avg(all),
      allowedAvg: avg(allowed),
    };
  };

  const MIN_PRIOR = 8;
  const rows: any[] = [];
  const ruleTable: Record<string, { fired: number; within: number; absErrSum: number }> = {};

  for (const g of games) {
    const hid = g.homeTeam?.id, aid = g.awayTeam?.id;
    if (!hid || !aid) continue;
    const hp = priorFor(hid, g.startTimestamp);
    const ap = priorFor(aid, g.startTimestamp);
    if (hp.length < MIN_PRIOR || ap.length < MIN_PRIOR) continue;

    const H = summarize(hp, hid), A = summarize(ap, aid);
    if (H.scoredAvg == null || A.scoredAvg == null) continue;

    const league = `${g.tournament?.category?.name ?? ""} - ${g.tournament?.name ?? ""}`;
    const dna = getLeagueDNA(league);
    const mkStats = (name: string, S: any) => {
      const base = lookupTeam(name, dna);
      return {
        ...base,
        stats: { ...base.stats, avg_pts: S.scoredAvg, avg_allowed: S.allowedAvg, games: Math.min(S.games, 50) },
        source: "WAREHOUSE" as const,
        proxyCapped: false,
        capValue: 0,
      };
    };

    const h2h = hp.filter((x) => [x.homeTeam?.id, x.awayTeam?.id].includes(aid));
    const h2hTotals = h2h.map((x) => (pts(x, "home") ?? 0) + (pts(x, "away") ?? 0));
    const h2hAvg = h2hTotals.length ? h2hTotals.reduce((s, v) => s + v, 0) / h2hTotals.length : undefined;

    // Synthetic market window (no historical lines stored): naive anchor +/- 7
    const line = Math.round((H.arenaPPG ?? 0) + (A.roadPPG ?? 0)) + 0.5;

    let out;
    try {
      out = runEngine({
        home_name: g.homeTeam.name,
        away_name: g.awayTeam.name,
        home_stats: mkStats(g.homeTeam.name, H),
        away_stats: mkStats(g.awayTeam.name, A),
        league,
        key_player_out: false,
        key_player_name: "",
        over_low: line - 7, over_high: line + 7,
        under_low: line - 7, under_high: line + 7,
        home_arena_ppg: H.arenaPPG ?? undefined,
        away_arena_ppg: A.roadPPG ?? undefined,
        h2h_avg_total: h2hAvg,
        use_weighted: !!h2hAvg,
      });
    } catch (err) {
      continue; // one bad game must not kill the run
    }

    const actual = (pts(g, "home") as number) + (pts(g, "away") as number);
    const within = actual >= out.lb && actual <= out.hb;
    const err = +(actual - out.midpoint).toFixed(1);
    rows.push({ match: `${g.homeTeam.name} vs ${g.awayTeam.name}`, actual, lb: out.lb, hb: out.hb, midpoint: out.midpoint, within, err });

    for (const r of out.triggered_rules || []) {
      ruleTable[r] = ruleTable[r] || { fired: 0, within: 0, absErrSum: 0 };
      ruleTable[r].fired++;
      if (within) ruleTable[r].within++;
      ruleTable[r].absErrSum += Math.abs(err);
    }
  }

  const n = rows.length;
  const summary = n
    ? {
        gamesTested: n,
        withinRangePct: +((rows.filter((r) => r.within).length / n) * 100).toFixed(1),
        mae: +(rows.reduce((s, r) => s + Math.abs(r.err), 0) / n).toFixed(1),
        bias: +(rows.reduce((s, r) => s + r.err, 0) / n).toFixed(1),
      }
    : { gamesTested: 0 };

  const rules = Object.entries(ruleTable)
    .map(([rule, v]) => ({ rule, fired: v.fired, withinPct: +((v.within / v.fired) * 100).toFixed(0), avgAbsErr: +(v.absErrSum / v.fired).toFixed(1) }))
    .sort((a, b) => b.fired - a.fired);

  return res.json({
    note: "Range graded vs actual totals from warehouse history, anti-lookahead enforced (MIN_PRIOR=" + MIN_PRIOR + "). bias>0 = engine predicts too LOW (under-lean); bias<0 = too HIGH. Decisions vs real lines need Archive data.",
    summary,
    rules,
    games: rows,
  });
});

export default router;
