import { Router, type Request, type Response } from "express";
import fs from "node:fs";
import path from "node:path";
import { updateQuotaFromResponse, quota } from "../lib/quotaTracker";
import { rememberGames, persist, store } from "../lib/warehouse";

const router = Router();
const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY;
const RAPIDAPI_HOST = process.env.RAPIDAPI_HOST || "basketapi1.p.rapidapi.com";
const CACHE_PATH = path.join(process.cwd(), "data", "games-cache.json");

type DiskCache = { tournaments?: any; schedules: Record<string, any> };
const loadDisk = (): DiskCache => { try { return JSON.parse(fs.readFileSync(CACHE_PATH, "utf8")); } catch { return { schedules: {} }; } };
const disk: DiskCache = loadDisk();
if (!disk.schedules) disk.schedules = {};
const saveDisk = () => { try { fs.mkdirSync(path.dirname(CACHE_PATH), { recursive: true }); fs.writeFileSync(CACHE_PATH, JSON.stringify(disk)); } catch { /* non-fatal */ } };

const apiFetch = async (p: string): Promise<any> => {
  const response = await fetch("https" + "://" + RAPIDAPI_HOST + p, {
    headers: { "x-rapidapi-key": RAPIDAPI_KEY ?? "", "x-rapidapi-host": RAPIDAPI_HOST },
  });
  updateQuotaFromResponse(response);
  if (response.status === 204) return null;
  if (!response.ok) throw new Error("BasketAPI " + response.status);
  return response.json();
};

const daySegments = () => { const d = new Date(); return d.getDate() + "/" + (d.getMonth() + 1) + "/" + d.getFullYear(); };

// TOURNAMENTS — opening is ALWAYS free (serves last saved update from disk).
// Only ?update=1 spends quota. Response reports the REAL cost via quota delta.
router.get("/v1/games/tournaments", async (req: Request, res: Response) => {
  const seg = daySegments();
  if (req.query.update !== "1") {
    if (disk.tournaments) return res.json({ ...disk.tournaments, stale: disk.tournaments.date !== seg, fromDisk: true, quotaSpent: 0 });
    return res.json({ date: seg, updatedAt: null, count: 0, tournaments: [], stale: true, fromDisk: true, quotaSpent: 0 });
  }
  if (!RAPIDAPI_KEY) return res.status(500).json({ error: "Missing RAPIDAPI_KEY" });
  const before = quota.remaining;
  try {
    const results = await Promise.all([1, 2, 3, 4, 5, 6].map((pg) => apiFetch("/api/basketball/scheduled-tournaments/" + seg + "/page/" + pg).catch(() => null)));
    const tours: { id: number; name: string; country: string }[] = [];
    const seen = new Set<number>();
    for (const data of results) for (const s of data?.scheduled || []) {
      const uid = s?.tournament?.uniqueTournament?.id;
      if (!uid || seen.has(uid)) continue;
      seen.add(uid);
      tours.push({ id: uid, name: s.tournament?.name ?? "Unknown", country: s.tournament?.category?.name ?? "" });
    }
    const payload = { date: seg, updatedAt: new Date().toISOString(), count: tours.length, tournaments: tours };
    if (tours.length > 0) { disk.tournaments = payload; saveDisk(); }
    return res.json({ ...payload, stale: false, fromDisk: false, quotaSpent: before != null && quota.remaining != null ? before - quota.remaining : 6 });
  } catch (error) {
    return res.status(502).json({ error: error instanceof Error ? error.message : "update failed" });
  }
});

// SCHEDULE — 1 call first tap per tournament per day, disk forever after (works quota-dead).
router.get("/v1/games/schedule", async (req: Request, res: Response) => {
  const tid = Number(req.query.tid);
  if (!tid) return res.status(400).json({ error: "tid is required" });
  const key = tid + "-" + daySegments();
  if (disk.schedules[key]) return res.json({ ...disk.schedules[key], fromDisk: true, quotaSpent: 0 });
  if (!RAPIDAPI_KEY) return res.status(500).json({ error: "Missing RAPIDAPI_KEY" });
  try {
    const data = await apiFetch("/api/basketball/tournament/" + tid + "/schedules/" + daySegments());
    rememberGames(data?.events || []);
    persist();
    const games = (data?.events || []).map((e: any) => ({
      id: e.id, home: e.homeTeam?.name ?? "?", away: e.awayTeam?.name ?? "?",
      startTimestamp: e.startTimestamp ?? null, status: e.status?.type ?? "notstarted",
      tournament: e.tournament?.name ?? "", country: e.tournament?.category?.name ?? "",
    }));
    const payload = { tid, date: daySegments(), count: games.length, games };
    if (games.length > 0) { disk.schedules[key] = payload; saveDisk(); }
    return res.json({ ...payload, fromDisk: false, quotaSpent: 1 });
  } catch (error) {
    return res.status(502).json({ error: error instanceof Error ? error.message : "schedule fetch failed" });
  }
});

// BANKCHECK — free finals confirmation from warehouse. 0 API, always.
router.get("/v1/games/bankcheck", (req: Request, res: Response) => {
  const ids = String(req.query.ids ?? "").split(",").map(Number).filter(Boolean);
  const finals: any[] = [];
  for (const id of ids) {
    const g: any = (store.games as any)[id];
    if (g?.homeScore?.current != null) finals.push({ id, hs: g.homeScore.current, as: g.awayScore.current });
  }
  return res.json({ finals, quotaSpent: 0 });
});
export default router;
