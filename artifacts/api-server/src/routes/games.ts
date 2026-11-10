import { Router, type Request, type Response } from "express";
import fs from "node:fs";
import path from "node:path";
import { updateQuotaFromResponse, quota } from "../lib/quotaTracker";
import { rememberGames, persist, store, resolveDataDir } from "../lib/warehouse";

const router = Router();
const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY;
const RAPIDAPI_HOST = process.env.RAPIDAPI_HOST || "basketapi1.p.rapidapi.com";
const CACHE_PATH = path.join(resolveDataDir(), "games-cache.json");

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

// The provider's day segment is D/M/YYYY. "Today" must be the USER's
// day: the server clock is UTC, so between 00:00 and 00:59 WAT the
// server's own date is still yesterday and every tournaments/schedule
// request fetched (and cached under) the wrong day. The client sends
// its local date as ?date=YYYY-MM-DD; when present and valid it wins,
// otherwise the server date remains the fallback for dateless callers.
const segOf = (d: Date) => d.getDate() + "/" + (d.getMonth() + 1) + "/" + d.getFullYear();
const daySegments = (req?: Request) => {
  const raw = typeof req?.query?.date === "string" ? req.query.date : "";
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(raw);
  if (m) {
    const y = Number(m[1]), mo = Number(m[2]), da = Number(m[3]);
    const d = new Date(y, mo - 1, da);
    if (d.getFullYear() === y && d.getMonth() === mo - 1 && d.getDate() === da) return segOf(d);
  }
  return segOf(new Date());
};

// TOURNAMENTS — opening is ALWAYS free (serves last saved update from disk).
// Only ?update=1 spends quota. Response reports the REAL cost via quota delta.
router.get("/v1/games/tournaments", async (req: Request, res: Response) => {
  const seg = daySegments(req);
  // "force" is the alias the mockup's Master Refresh sends (?force=1);
  // "update" is the documented one. Both refresh.
  if (req.query.update !== "1" && req.query.force !== "1") {
    if (disk.tournaments) return res.json({ ...disk.tournaments, stale: disk.tournaments.date !== seg, fromDisk: true, quotaSpent: 0 });
    return res.json({ date: seg, updatedAt: null, count: 0, tournaments: [], stale: true, fromDisk: true, quotaSpent: 0 });
  }
  if (!RAPIDAPI_KEY) return res.status(500).json({ error: "Missing RAPIDAPI_KEY" });
  const before = quota.remaining;
  try {
    const results = await Promise.all([1, 2, 3, 4, 5, 6].map((pg) => apiFetch("/api/basketball/scheduled-tournaments/" + seg + "/page/" + pg).catch(() => null)));
    const pagesFailed = results.filter((r) => r === null).length;
    if (results.every((r) => r === null)) {
      // Every upstream page failed: report the failure instead of
      // presenting an empty list as fresh ("0 tournaments today").
      return res.status(502).json({ error: "tournaments update failed: BasketAPI unreachable" });
    }
    const tours: { id: number; name: string; country: string }[] = [];
    const seen = new Set<number>();
    for (const data of results) for (const s of data?.scheduled || []) {
      const uid = s?.tournament?.uniqueTournament?.id;
      if (!uid || seen.has(uid)) continue;
      seen.add(uid);
      tours.push({ id: uid, name: s.tournament?.name ?? "Unknown", country: s.tournament?.category?.name ?? "" });
    }
    const payload = { date: seg, updatedAt: new Date().toISOString(), count: tours.length, tournaments: tours, partial: pagesFailed > 0, pagesFailed };
    // A partial list is reported as partial and is NOT cached: caching
    // it used to overwrite the last complete list with an incomplete
    // one presented as fresh. A COMPLETE list IS cached even when it
    // is empty: a genuine 0-tournament day is the provider's real
    // answer (the schedule route already caches a genuine 0-game day
    // for the same reason), and leaving it uncached made every app
    // entry re-fire the 6-page force. D-2026-11-10-08.
    if (pagesFailed === 0) { disk.tournaments = payload; saveDisk(); }
    return res.json({ ...payload, stale: false, fromDisk: false, quotaSpent: before != null && quota.remaining != null ? before - quota.remaining : null });
  } catch (error) {
    return res.status(502).json({ error: error instanceof Error ? error.message : "update failed" });
  }
});

// SCHEDULE — 1 call first tap per tournament per day, disk forever after (works quota-dead).
router.get("/v1/games/schedule", async (req: Request, res: Response) => {
  const tid = Number(req.query.tid);
  if (!tid) return res.status(400).json({ error: "tid is required" });
  const key = tid + "-" + daySegments(req);
  if (disk.schedules[key]) return res.json({ ...disk.schedules[key], fromDisk: true, quotaSpent: 0 });
  if (!RAPIDAPI_KEY) return res.status(500).json({ error: "Missing RAPIDAPI_KEY" });
  try {
    const data = await apiFetch("/api/basketball/tournament/" + tid + "/schedules/" + daySegments(req));
    rememberGames(data?.events || []);
    persist();
    const games = (data?.events || []).map((e: any) => ({
      id: e.id, home: e.homeTeam?.name ?? "?", away: e.awayTeam?.name ?? "?",
      startTimestamp: e.startTimestamp ?? null, status: e.status?.type ?? "notstarted",
      tournament: e.tournament?.name ?? "", country: e.tournament?.category?.name ?? "",
    }));
    const payload = { tid, date: daySegments(req), count: games.length, games };
    // Cache EVERY successful fetch, including a genuine 0-game day:
    // apiFetch already throws on a non-OK response, so reaching here
    // means the empty list is the provider's real answer. The old
    // length gate left empty schedules uncached, so a 0-game
    // tournament cost 1 provider call on EVERY tap, forever.
    disk.schedules[key] = payload; saveDisk();
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
    if (g?.homeScore?.current != null && g?.awayScore?.current != null) finals.push({ id, hs: g.homeScore.current, as: g.awayScore.current });
  }
  return res.json({ finals, quotaSpent: 0 });
});
export default router;
