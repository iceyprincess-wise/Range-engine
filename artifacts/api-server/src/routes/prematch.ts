import { Router, type Request, type Response } from "express";

const router = Router();
const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY;
const RAPIDAPI_HOST = process.env.RAPIDAPI_HOST || "basketapi1.p.rapidapi.com";

// ---- quota tracking (read from RapidAPI response headers) ----
let quota: { limit: number | null; remaining: number | null; updatedAt: number | null } = {
  limit: null,
  remaining: null,
  updatedAt: null,
};

const apiFetch = async (path: string) => {
  const response = await fetch("https" + "://" + RAPIDAPI_HOST + path, {
    headers: {
      "x-rapidapi-key": RAPIDAPI_KEY ?? "",
      "x-rapidapi-host": RAPIDAPI_HOST,
    },
  });
  const lim = response.headers.get("x-ratelimit-requests-limit");
  const rem = response.headers.get("x-ratelimit-requests-remaining");
  if (rem !== null) {
    quota = {
      limit: lim !== null ? Number(lim) : quota.limit,
      remaining: Number(rem),
      updatedAt: Date.now(),
    };
  }
  if (!response.ok) {
    throw new Error(`BasketAPI ${response.status}: ${await response.text()}`);
  }
  return response.json();
};

// ---- 6h cache: pre-match research is stable ----
const TTL = 6 * 60 * 60 * 1000;
const cache = new Map<string, { expiresAt: number; value: any }>();

// ---- helpers ----
const searchTeam = async (name: string) => {
  const data = await apiFetch(`/api/basketball/search/${encodeURIComponent(name)}`);
  const hit = (data?.results || []).find((r: any) => r.type === "team");
  if (!hit) throw new Error(`No team found for "${name}"`);
  return { id: hit.entity.id as number, name: hit.entity.name as string };
};

const PREV_SHAPES = [
  (id: number, page: number) => `/api/basketball/team/${id}/matches/previous/${page}`,
  (id: number, page: number) => `/api/basketball/team/${id}/events/previous/${page}`,
];
let prevShape: ((id: number, page: number) => string) | null = null;

const fetchPrevious = async (id: number, page: number) => {
  if (prevShape) return apiFetch(prevShape(id, page));
  let lastErr: unknown = null;
  for (const shape of PREV_SHAPES) {
    try {
      const data = await apiFetch(shape(id, page));
      prevShape = shape;
      return data;
    } catch (err) {
      lastErr = err;
    }
  }
  throw lastErr;
};

const isFinished = (e: any) => e?.status?.type === "finished";
const pts = (e: any, side: "home" | "away") => e?.[`${side}Score`]?.current ?? null;

const summarize = (events: any[], teamId: number) => {
  const games = events
    .filter(isFinished)
    .filter((e) => pts(e, "home") != null && pts(e, "away") != null)
    .sort((a, b) => (b.startTimestamp ?? 0) - (a.startTimestamp ?? 0)); // newest first

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
    summary: {
      gamesAnalyzed: games.length,
      formLast5: form.join(""),
      homeArenaPPG: avg(homePts),
      awayRoadPPG: avg(roadPts),
      avgTotal: avg(totals),
    },
    games,
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

  const cacheKey = `prematch-${homeTeam.toLowerCase()}-${awayTeam.toLowerCase()}`;
  const hit = cache.get(cacheKey);
  if (hit && hit.expiresAt > Date.now()) return res.json(hit.value);

  try {
    const [home, away] = await Promise.all([searchTeam(homeTeam), searchTeam(awayTeam)]);
    const [homePrev, awayPrev] = await Promise.all([
      fetchPrevious(home.id, 0),
      fetchPrevious(away.id, 0),
    ]);
    const homeAll = summarize(homePrev?.events || [], home.id);
    const awayAll = summarize(awayPrev?.events || [], away.id);

    // H2H: meetings between the two ids found in either team's history
    const seen = new Set<number>();
    const h2hGames = [...homeAll.games, ...awayAll.games].filter((e: any) => {
      const ids = [e.homeTeam?.id, e.awayTeam?.id];
      const duel = ids.includes(home.id) && ids.includes(away.id);
      if (!duel || seen.has(e.id)) return false;
      seen.add(e.id);
      return true;
    });
    const h2hTotals = h2hGames.map((e: any) => (pts(e, "home") ?? 0) + (pts(e, "away") ?? 0));
    const h2hAvgTotal = h2hTotals.length
      ? h2hTotals.reduce((s, v) => s + v, 0) / h2hTotals.length
      : null;

    const payload = {
      provenance: "real",
      fetchedAt: new Date().toISOString(),
      home: { id: home.id, name: home.name, ...homeAll.summary },
      away: { id: away.id, name: away.name, ...awayAll.summary },
      h2h: { meetings: h2hGames.length, avgTotal: h2hAvgTotal, totals: h2hTotals },
      quota,
    };
    cache.set(cacheKey, { expiresAt: Date.now() + TTL, value: payload });
    res.json(payload);
  } catch (error) {
    console.error("/api/v1/prematch error:", error);
    res.status(502).json({ error: error instanceof Error ? error.message : "prematch fetch failed" });
  }
});

router.get("/v1/quota", (_req: Request, res: Response) => {
  res.json(quota);
});

export default router;
