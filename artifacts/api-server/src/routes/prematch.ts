import { Router, type Request, type Response } from "express";
import fs from "node:fs";
import path from "node:path";

const router = Router();
const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY;
const RAPIDAPI_HOST = process.env.RAPIDAPI_HOST || "basketapi1.p.rapidapi.com";

// ---------- permanent warehouse (finished games never change) ----------
const DATA_DIR = path.join(process.cwd(), "data");
const STORE_PATH = path.join(DATA_DIR, "store.json");

type StoredTeam = { id: number; name: string };
type Store = { teams: Record<string, StoredTeam>; games: Record<string, any> };

const loadStore = (): Store => {
  try { return JSON.parse(fs.readFileSync(STORE_PATH, "utf8")); }
  catch { return { teams: {}, games: {} }; }
};
const store: Store = loadStore();
let dirty = false;
const persist = () => {
  if (!dirty) return;
  try {
    fs.mkdirSync(DATA_DIR, { recursive: true });
    fs.writeFileSync(STORE_PATH, JSON.stringify(store));
    dirty = false;
  } catch (err) { console.error("warehouse persist failed:", err); }
};
setInterval(persist, 30_000).unref();

// ---------- quota tracking ----------
let quota: { limit: number | null; remaining: number | null; updatedAt: number | null } = {
  limit: null, remaining: null, updatedAt: null,
};

const apiFetch = async (p: string) => {
  const response = await fetch("https" + "://" + RAPIDAPI_HOST + p, {
    headers: { "x-rapidapi-key": RAPIDAPI_KEY ?? "", "x-rapidapi-host": RAPIDAPI_HOST },
  });
  const lim = response.headers.get("x-ratelimit-requests-limit");
  const rem = response.headers.get("x-ratelimit-requests-remaining");
  if (rem !== null) {
    quota = { limit: lim !== null ? Number(lim) : quota.limit, remaining: Number(rem), updatedAt: Date.now() };
  }
  if (!response.ok) throw new Error("BasketAPI " + response.status + ": " + (await response.text()));
  return response.json();
};

// ---------- helpers ----------
const isFinished = (e: any) => e?.status?.type === "finished";
const pts = (e: any, side: "home" | "away") => e?.[side + "Score"]?.current ?? null;

const rememberGames = (events: any[]) => {
  for (const e of events) {
    if (!e?.id || !isFinished(e)) continue;
    if (!store.games[e.id]) { store.games[e.id] = e; dirty = true; }
  }
};

const searchTeam = async (name: string) => {
  const key = name.trim().toLowerCase();
  if (store.teams[key]) return store.teams[key];
  const data = await apiFetch("/api/basketball/search/" + encodeURIComponent(name));
  const hit = (data?.results || []).find((r: any) => r.type === "team");
  if (!hit) throw new Error("No team found for \"" + name + "\"");
  const team = { id: hit.entity.id as number, name: hit.entity.name as string };
  store.teams[key] = team;
  dirty = true;
  return team;
};

const lastFetch: Record<number, number> = {};
const FRESH_MS = 6 * 60 * 60 * 1000;

const refreshTeam = async (id: number) => {
  const data = await apiFetch("/api/basketball/team/" + id + "/matches/previous/0");
  rememberGames(data?.events || []);
  lastFetch[id] = Date.now();
};

const gamesForTeam = (teamId: number) =>
  Object.values(store.games)
    .filter((g: any) => g.homeTeam?.id === teamId || g.awayTeam?.id === teamId)
    .filter((g: any) => pts(g, "home") != null && pts(g, "away") != null)
    .sort((a: any, b: any) => (b.startTimestamp ?? 0) - (a.startTimestamp ?? 0))
    .slice(0, 50);

const summarize = (games: any[], teamId: number) => {
  const homePts: number[] = [];
  const roadPts: number[] = [];
  const totals: number[] = [];
  const form: string[] = [];
  for (const g of games) {
    const isHome = g.homeTeam?.id === teamId;
    const scored = pts(g, isHome ? "home" : "away") as number;
    const allowed = pts(g, isHome ? "away" : "home") as number;
    (isHome ? homePts : roadPts).push(scored);
    totals.push(scored + allowed);
    if (form.length < 5) form.push(scored > allowed ? "W" : "L");
  }
  const avg = (a: number[]) => (a.length ? a.reduce((s, v) => s + v, 0) / a.length : null);
  return {
    gamesAnalyzed: games.length,
    formLast5: form.join(""),
    homeArenaPPG: avg(homePts),
    awayRoadPPG: avg(roadPts),
    avgTotal: avg(totals),
  };
};

router.get("/v1/prematch", async (req: Request, res: Response) => {
  const { homeTeam, awayTeam } = req.query as Record<string, string>;
  if (!homeTeam || !awayTeam) {
    return res.status(400).json({ error: "homeTeam and awayTeam are required" });
  }
  if (!RAPIDAPI_KEY) {
    return res.status(500).json({ error: "Missing RAPIDAPI_KEY environment variable" });
  }

  try {
    const [home, away] = await Promise.all([searchTeam(homeTeam), searchTeam(awayTeam)]);
    const now = Date.now();
    const stale = [home.id, away.id].filter((id) => now - (lastFetch[id] ?? 0) > FRESH_MS);
    let apiOk = true;
    try { await Promise.all(stale.map(refreshTeam)); } catch (e) { apiOk = false; console.error("refresh failed, serving warehouse:", e); }

    const homeGames = gamesForTeam(home.id);
    const awayGames = gamesForTeam(away.id);

    const h2hGames = Object.values(store.games).filter((e: any) => {
      const ids = [e.homeTeam?.id, e.awayTeam?.id];
      return ids.includes(home.id) && ids.includes(away.id);
    });
    const h2hTotals = h2hGames.map((e: any) => (pts(e, "home") ?? 0) + (pts(e, "away") ?? 0));
    const h2hAvgTotal = h2hTotals.length ? h2hTotals.reduce((s, v) => s + v, 0) / h2hTotals.length : null;

    persist();
    res.json({
      provenance: apiOk ? "real" : "warehouse-stale",
      fetchedAt: new Date().toISOString(),
      home: { id: home.id, name: home.name, ...summarize(homeGames, home.id) },
      away: { id: away.id, name: away.name, ...summarize(awayGames, away.id) },
      h2h: { meetings: h2hGames.length, avgTotal: h2hAvgTotal, totals: h2hTotals },
      warehouse: { storedGames: Object.keys(store.games).length, storedTeams: Object.keys(store.teams).length },
      quota,
    });
  } catch (error) {
    console.error("/api/v1/prematch error:", error);
    res.status(502).json({ error: error instanceof Error ? error.message : "prematch fetch failed" });
  }
});

router.get("/v1/quota", (_req: Request, res: Response) => {
  res.json(quota);
});

export default router;
