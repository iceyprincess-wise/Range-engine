import { Router, type Request, type Response } from "express";
import { store, rememberGames, persist, markDirty } from "../lib/warehouse";
import { quota, updateQuotaFromResponse } from "../lib/quotaTracker";

const router = Router();
const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY;
const RAPIDAPI_HOST = process.env.RAPIDAPI_HOST || "basketapi1.p.rapidapi.com";
const norm = (s: string) => s.trim().toLowerCase();

const apiFetch = async (p: string): Promise<any> => {
  const response = await fetch("https" + "://" + RAPIDAPI_HOST + p, {
    headers: { "x-rapidapi-key": RAPIDAPI_KEY ?? "", "x-rapidapi-host": RAPIDAPI_HOST },
  });
  updateQuotaFromResponse(response);
  if (!response.ok) throw new Error("BasketAPI " + response.status);
  return response.json();
};

const findStored = (h: string, a: string): any =>
  Object.values(store.games)
    .filter((g: any) => norm(g.homeTeam?.name ?? "").includes(h) && norm(g.awayTeam?.name ?? "").includes(a))
    .sort((x: any, y: any) => (y.startTimestamp ?? 0) - (x.startTimestamp ?? 0))[0];

router.get("/v1/result", async (req: Request, res: Response) => {
  const { homeTeam, awayTeam } = req.query as Record<string, string>;
  if (!homeTeam || !awayTeam) return res.status(400).json({ error: "homeTeam and awayTeam required" });
  const h = norm(homeTeam), a = norm(awayTeam);
  let g = findStored(h, a);

  // SETTLE-FETCH: not banked + quota healthy -> bank it now (once, permanent). Never fires on a dead quota.
  if (!g && RAPIDAPI_KEY && quota.remaining !== null && quota.remaining >= 10) {
    try {
      let team = store.teams[h];
      if (!team) {
        const data = await apiFetch("/api/basketball/search/" + encodeURIComponent(homeTeam));
        const hit = (data?.results || []).find((r: any) => r.type === "team");
        if (hit) { team = { id: hit.entity.id, name: hit.entity.name }; store.teams[h] = team; markDirty(); }
      }
      if (team) {
        const prev = await apiFetch("/api/basketball/team/" + team.id + "/matches/previous/0");
        rememberGames(prev?.events || []);
        persist();
        g = findStored(h, a);
      }
    } catch { /* stays unsettled — honest response below */ }
  }

  if (!g) {
    const lowQuota = quota.remaining !== null && quota.remaining < 10;
    return res.json({ settled: false, note: lowQuota ? "not banked — quota too low for settle-fetch, retry after reset" : "not in warehouse yet" });
  }
  const home = g.homeScore?.current ?? null, away = g.awayScore?.current ?? null;
  return res.json({
    settled: home != null && away != null,
    home, away, total: home != null && away != null ? home + away : null,
    quarters: { home: [1, 2, 3, 4].map((q) => g.homeScore?.["period" + q] ?? null), away: [1, 2, 3, 4].map((q) => g.awayScore?.["period" + q] ?? null) },
    startTimestamp: g.startTimestamp ?? null, provenance: "warehouse",
  });
});
export default router;
