import { Router, type Request, type Response } from "express";
import fs from "node:fs";
import path from "node:path";
import { store } from "../lib/warehouse";
import { quota } from "../lib/quotaTracker";

const router = Router();
const STORE_PATH = path.join(process.cwd(), "data", "store.json");

router.get("/v1/warehouse", (_req: Request, res: Response) => {
  const games = Object.values(store.games) as any[];
  let mtime: number | null = null, sizeBytes: number | null = null;
  try { const st = fs.statSync(STORE_PATH); mtime = st.mtimeMs; sizeBytes = st.size; } catch { /* first run */ }

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

  const leagues = Object.entries(byLeague).map(([league, gs]) => {
    const totals = gs.map((g) => (g.homeScore?.current ?? 0) + (g.awayScore?.current ?? 0)).filter((t) => t > 0);
    const avg = totals.length ? +(totals.reduce((s, v) => s + v, 0) / totals.length).toFixed(1) : null;
    const latest = gs.slice().sort((a, b) => (b.startTimestamp ?? 0) - (a.startTimestamp ?? 0)).slice(0, 10)
      .map((g) => ({
        home: g.homeTeam?.name ?? "?", away: g.awayTeam?.name ?? "?",
        hs: g.homeScore?.current ?? null, as: g.awayScore?.current ?? null,
        date: g.startTimestamp ? new Date(g.startTimestamp * 1000).toISOString().slice(0, 10) : "?",
        quarters: g.homeScore?.period1 != null,
      }));
    return { league, games: gs.length, avgTotal: avg, minTotal: totals.length ? Math.min(...totals) : null, maxTotal: totals.length ? Math.max(...totals) : null, latest };
  }).sort((a, b) => b.games - a.games);

  const teams = Object.entries(store.teams).map(([key, t]: [string, any]) => ({
    name: t.name, id: t.id,
    gamesInStore: games.filter((g) => g.homeTeam?.id === t.id || g.awayTeam?.id === t.id).length,
    statEnriched: games.filter((g) => (g.homeTeam?.id === t.id || g.awayTeam?.id === t.id) && store.stats[g.id]).length,
  })).sort((a, b) => b.gamesInStore - a.gamesInStore);

  return res.json({
    fetchedAt: new Date().toISOString(),
    storeWrittenAgoSec: mtime ? Math.round((Date.now() - mtime) / 1000) : null,
    storeSizeBytes: sizeBytes,
    totals: { games: games.length, teams: teams.length, statsEnriched: Object.keys(store.stats).length, quarterLevel },
    span: { oldest: oldest !== Infinity ? new Date(oldest * 1000).toISOString().slice(0, 10) : null, newest: newest ? new Date(newest * 1000).toISOString().slice(0, 10) : null },
    leagues, teams, quota,
    provenance: "local disk — zero upstream API calls",
  });
});
export default router;
