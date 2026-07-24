import { Router, type Request, type Response } from "express";

const router = Router();
const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY;
const RAPIDAPI_HOST = process.env.RAPIDAPI_HOST || "basketapi1.p.rapidapi.com";

const apiFetch = async (p: string) => {
  const response = await fetch("https" + "://" + RAPIDAPI_HOST + p, {
    headers: { "x-rapidapi-key": RAPIDAPI_KEY ?? "", "x-rapidapi-host": RAPIDAPI_HOST },
  });
  if (response.status === 204) return null; // valid route, nothing scheduled — not an error
  if (!response.ok) throw new Error("BasketAPI " + response.status + ": " + (await response.text()));
  return response.json();
};

// cache until local midnight — a day's slate is fixed once assembled
const cache = new Map<string, { expiresAt: number; value: any }>();
const midnight = () => { const d = new Date(); d.setHours(24, 0, 0, 0); return d.getTime(); };
const getC = (k: string) => { const h = cache.get(k); return h && h.expiresAt > Date.now() ? h.value : undefined; };

const daySegments = () => {
  const d = new Date();
  return d.getDate() + "/" + (d.getMonth() + 1) + "/" + d.getFullYear();
};

// Level 1: which tournaments have games today (walk pages until 204/empty, max 6)
router.get("/v1/games/tournaments", async (_req: Request, res: Response) => {
  if (!RAPIDAPI_KEY) return res.status(500).json({ error: "Missing RAPIDAPI_KEY" });
  const seg = daySegments();
  const key = "tours-" + seg;
  const hit = getC(key);
  if (hit) return res.json(hit);

  try {
    const tours: { id: number; name: string; country: string }[] = [];
    const seen = new Set<number>();
    for (let page = 1; page <= 6; page++) {
      const data = await apiFetch("/api/basketball/scheduled-tournaments/" + seg + "/page/" + page);
      const list = data?.scheduled || [];
      if (!list.length) break;
      for (const s of list) {
        const uid = s?.tournament?.uniqueTournament?.id;
        if (!uid || seen.has(uid)) continue;
        seen.add(uid);
        tours.push({
          id: uid,
          name: s.tournament?.name ?? "Unknown",
          country: s.tournament?.category?.name ?? "",
        });
      }
    }
    const payload = { date: seg, count: tours.length, tournaments: tours };
    cache.set(key, { expiresAt: midnight(), value: payload });
    res.json(payload);
  } catch (error) {
    console.error("/v1/games/tournaments error:", error);
    res.status(502).json({ error: error instanceof Error ? error.message : "discovery failed" });
  }
});

// Level 2: one tournament's fixtures for today (1 call, cached)
router.get("/v1/games/schedule", async (req: Request, res: Response) => {
  const tid = Number(req.query.tid);
  if (!tid) return res.status(400).json({ error: "tid is required" });
  const seg = daySegments();
  const key = "sched-" + tid + "-" + seg;
  const hit = getC(key);
  if (hit) return res.json(hit);

  try {
    const data = await apiFetch("/api/basketball/tournament/" + tid + "/schedules/" + seg);
    const games = (data?.events || []).map((e: any) => ({
      id: e.id,
      home: e.homeTeam?.name ?? "?",
      away: e.awayTeam?.name ?? "?",
      startTimestamp: e.startTimestamp ?? null,
      status: e.status?.type ?? "notstarted",
      tournament: e.tournament?.name ?? "",
      country: e.tournament?.category?.name ?? "",
    }));
    const payload = { tid, date: seg, count: games.length, games };
    cache.set(key, { expiresAt: midnight(), value: payload });
    res.json(payload);
  } catch (error) {
    console.error("/v1/games/schedule error:", error);
    res.status(502).json({ error: error instanceof Error ? error.message : "schedule fetch failed" });
  }
});

export default router;
