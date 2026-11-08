import { Router, type Request, type Response } from "express";
import fs from "node:fs";
import path from "node:path";
import { store, resolveDataDir } from "../lib/warehouse";
import { quota } from "../lib/quotaTracker";

const router = Router();
// Same data-dir resolution as the store itself (see lib/warehouse.ts):
// process.cwd() is not guaranteed to be the api-server directory, and a
// cwd-based path silently reported null mtime/size for the real store.
const STORE_PATH = path.join(resolveDataDir(), "store.json");
const dt = (g: any) => (g.startTimestamp ? new Date(g.startTimestamp * 1000).toISOString().slice(0, 10) : "?");
const row = (g: any) => ({
  id: g.id, date: dt(g),
  home: g.homeTeam?.name ?? "?", away: g.awayTeam?.name ?? "?",
  hs: g.homeScore?.current ?? null, as: g.awayScore?.current ?? null,
  q: g.homeScore?.period1 != null, st: !!store.stats[g.id],
});

router.get("/v1/warehouse", (_req: Request, res: Response) => {
  const games = Object.values(store.games) as any[];
  let mtime: number | null = null, sizeBytes: number | null = null;
  try { const s = fs.statSync(STORE_PATH); mtime = s.mtimeMs; sizeBytes = s.size; } catch { /* first run */ }

  const byLeague: Record<string, any[]> = {};
  let quarterLevel = 0, oldest = Infinity, newest = 0;
  for (const g of games) {
    const k = (g.tournament?.category?.name ?? "?") + " - " + (g.tournament?.name ?? "?");
    (byLeague[k] = byLeague[k] || []).push(g);
    if (g.homeScore?.period1 != null) quarterLevel++;
    const t = g.startTimestamp ?? 0;
    if (t > newest) newest = t;
    if (t && t < oldest) oldest = t;
  }

  // LEAGUE DNA — measured, every game listed, nothing sliced
  // "FEEDS ENGINE" is judged on the league FAMILY pool — same category
  // + base tournament name (before any ", Playoffs"-style suffix) —
  // because that is the pool the league-dna route and the engine
  // actually measure. Judged per split row, the page claimed
  // "NBA, Playoffs (14) needs 15g" while the engine's NBA pool (67)
  // was already feeding it.
  const familyOf = (g: any) =>
    (g.tournament?.category?.name ?? "?") + " - " + String(g.tournament?.name ?? "?").split(",")[0].trim();
  const familyScored = new Map<string, number>();
  for (const g of games) {
    if (g.homeScore?.current != null && g.awayScore?.current != null)
      familyScored.set(familyOf(g), (familyScored.get(familyOf(g)) ?? 0) + 1);
  }
  const leagues = Object.entries(byLeague).map(([league, gs]) => {
    const sorted = gs.slice().sort((a, b) => (b.startTimestamp ?? 0) - (a.startTimestamp ?? 0));
    const totals = gs.map((g) => (g.homeScore?.current ?? 0) + (g.awayScore?.current ?? 0)).filter((t) => t > 0);
    const avg = totals.length ? totals.reduce((s, v) => s + v, 0) / totals.length : null;
    // Sample SD (n-1), matching league-dna-measure.cjs, the generator of the
    // DNA snapshot -- the live route must not disagree with the snapshot.
    const sd = avg != null ? (totals.length > 1 ? Math.sqrt(totals.reduce((s, v) => s + (v - avg) ** 2, 0) / (totals.length - 1)) : 0) : null;
    const pooled = familyScored.get(familyOf(gs[0])) ?? totals.length;
    return {
      league, games: gs.length,
      dna: avg != null ? { avgTotal: +avg.toFixed(1), sd: +sd!.toFixed(1), minTotal: Math.min(...totals), maxTotal: Math.max(...totals), measuredActive: pooled >= 15, pooledGames: pooled } : null,
      allGames: sorted.map(row),
    };
  }).sort((a, b) => b.games - a.games);

  // TEAM DNA — full profile per stored team, every game listed.
  // store.teams only holds the 28 teams resolved by name search, but
  // banked games reference 168 team ids (names + ids ride inside the
  // game objects), so derive the team list from the games and merge the
  // searched map over it. Without this, 140 teams had no profile at all.
  const teamById = new Map<number, { id: number; name: string }>();
  for (const g of games) {
    for (const side of [g.homeTeam, g.awayTeam]) {
      if (side?.id != null && side?.name && !teamById.has(side.id)) teamById.set(side.id, { id: side.id, name: side.name });
    }
  }
  for (const t of Object.values(store.teams) as any[]) if (t?.id != null) teamById.set(t.id, { id: t.id, name: t.name ?? teamById.get(t.id)?.name ?? "?" });
  const teams = [...teamById.values()].map((t: any) => {
    const gs = games
      .filter((g) => g.homeTeam?.id === t.id || g.awayTeam?.id === t.id)
      .sort((a, b) => (b.startTimestamp ?? 0) - (a.startTimestamp ?? 0));
    const scored: number[] = [], allowed: number[] = [], homeS: number[] = [], roadS: number[] = [];
    let h1 = 0, h2 = 0, hn = 0, form = "";
    let ftM = 0, ftA = 0, p3M = 0, p3A = 0, fgM = 0, fgA = 0, fouls = 0, fn = 0, sn = 0;
    for (const g of gs) {
      const isHome = g.homeTeam?.id === t.id;
      const sc = isHome ? g.homeScore?.current : g.awayScore?.current;
      const al = isHome ? g.awayScore?.current : g.homeScore?.current;
      if (sc == null || al == null) continue;
      scored.push(sc); allowed.push(al);
      (isHome ? homeS : roadS).push(sc);
      if (form.length < 5) form += sc > al ? "W" : "L";
      const own = isHome ? g.homeScore : g.awayScore;
      if (own?.period1 != null && own?.period2 != null && own?.period3 != null && own?.period4 != null) { h1 += own.period1 + own.period2; h2 += own.period3 + own.period4; hn++; }
      const st = store.stats[g.id];
      if (st) {
        const pick = (k: string) => { const it = st[k]; return it ? (isHome ? { m: it.hv, a: it.ht } : { m: it.av, a: it.at }) : null; };
        const ft = pick("freeThrowsScored"), p3 = pick("threePointersScored"), fg = pick("fieldGoalsScored");
        const fl = st["totalFouls"] ? (isHome ? st["totalFouls"].hv : st["totalFouls"].av) : null;
        if (ft || p3 || fg) sn++;
        if (ft?.a) { ftM += ft.m; ftA += ft.a; }
        if (p3?.a) { p3M += p3.m; p3A += p3.a; }
        if (fg?.a) { fgM += fg.m; fgA += fg.a; }
        if (fl != null) { fouls += fl; fn++; }
      }
    }
    const avg = (x: number[]) => (x.length ? +(x.reduce((s, v) => s + v, 0) / x.length).toFixed(1) : null);
    const pct = (m: number, a: number) => (a ? +((m / a) * 100).toFixed(1) : null);
    return {
      name: t.name, id: t.id, gamesInStore: gs.length,
      dna: {
        formLast5: form || null,
        scoredAvg: avg(scored), allowedAvg: avg(allowed),
        homeScoredAvg: avg(homeS), roadScoredAvg: avg(roadS),
        secondHalfFade: hn ? +((h1 - h2) / hn).toFixed(1) : null,
        quarterGames: hn,
        shooting: sn ? { statGames: sn, ftPct: pct(ftM, ftA), pt3Pct: pct(p3M, p3A), fgPct: pct(fgM, fgA), foulsPerGame: fn ? +(fouls / fn).toFixed(1) : null } : null,
      },
      allGames: gs.map(row),
    };
  }).sort((a, b) => b.gamesInStore - a.gamesInStore);

  return res.json({
    fetchedAt: new Date().toISOString(),
    storeWrittenAgoSec: mtime ? Math.round((Date.now() - mtime) / 1000) : null,
    storeSizeBytes: sizeBytes,
    totals: { games: games.length, teams: teams.length, leagues: leagues.length, statsEnriched: Object.keys(store.stats).length, quarterLevel },
    span: { oldest: oldest !== Infinity ? new Date(oldest * 1000).toISOString().slice(0, 10) : null, newest: newest ? new Date(newest * 1000).toISOString().slice(0, 10) : null },
    leagues, teams, quota,
    provenance: "local disk — zero upstream API calls",
  });
});
export default router;
