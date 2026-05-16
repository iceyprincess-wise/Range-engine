import { Router, type Request, type Response } from "express";

const router = Router();
const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY;
const RAPIDAPI_HOST = process.env.RAPIDAPI_HOST || "basketapi1.p.rapidapi.com";

if (!RAPIDAPI_KEY) {
  console.warn(
    "RAPIDAPI_KEY is not configured. BasketAPI routes will return 500 until the key is provided.",
  );
}

const cache = new Map<string, { expiresAt: number; value: any }>();

const getCached = (cacheKey: string) => {
  const item = cache.get(cacheKey);
  if (!item || item.expiresAt < Date.now()) return undefined;
  return item.value;
};

const setCache = (cacheKey: string, value: any, ttl = 15_000) => {
  cache.set(cacheKey, { value, expiresAt: Date.now() + ttl });
};

const basketFetch = async (path: string) => {
  const url = `https://${RAPIDAPI_HOST}${path}`;
  const response = await fetch(url, {
    headers: {
      "x-rapidapi-key": RAPIDAPI_KEY ?? "",
      "x-rapidapi-host": RAPIDAPI_HOST,
    },
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`BasketAPI ${response.status} ${response.statusText}: ${text}`);
  }
  return response.json();
};

const safeMatch = (event: any, homeSearch: string, awaySearch: string) => {
  const homeName = event?.homeTeam?.name?.toLowerCase() || "";
  const awayName = event?.awayTeam?.name?.toLowerCase() || "";
  return (
    homeName.includes(homeSearch) ||
    awayName.includes(awaySearch) ||
    homeSearch.includes(homeName) ||
    awaySearch.includes(awayName)
  );
};

const getTargetMatch = (events: any[], homeTeam: string, awayTeam: string) => {
  const homeSearch = (homeTeam || "").trim().toLowerCase();
  const awaySearch = (awayTeam || "").trim().toLowerCase();

  return events.find((event) => safeMatch(event, homeSearch, awaySearch));
};

router.get("/v1/sync", async (req: Request, res: Response) => {
  const { league, homeTeam, awayTeam } = req.query as Record<string, string>;

  if (!homeTeam || !awayTeam) {
    return res.status(400).json({ error: "homeTeam and awayTeam are required" });
  }

  if (!RAPIDAPI_KEY) {
    return res.status(500).json({ error: "Missing RAPIDAPI_KEY environment variable" });
  }

  try {
    const cacheKey = `live-${homeTeam}-${awayTeam}`;
    const cached = getCached(cacheKey);
    if (cached) {
      return res.json(cached);
    }

    const liveResponse = await basketFetch("/api/basketball/matches/live");
    const events = liveResponse?.events || [];
    const target = getTargetMatch(events, homeTeam, awayTeam);

    if (!target) {
      return res.status(404).json({ error: "Live match not found for the requested teams" });
    }

    const statsResponse = await basketFetch(`/api/basketball/match/${target.id}/statistics`);
    const homeScore = target.homeScore?.current ?? 0;
    const awayScore = target.awayScore?.current ?? 0;
    const payload = {
      homeForm: target.homeTeam?.name || homeTeam,
      awayForm: target.awayTeam?.name || awayTeam,
      h2h: `${homeScore} - ${awayScore}`,
      status: target.status?.type || "UNKNOWN",
      matchId: target.id,
      league: league || "",
      score: { home: homeScore, away: awayScore },
      statistics: statsResponse?.statistics ?? null,
    };

    setCache(cacheKey, payload, 20_000);
    return res.json(payload);
  } catch (error: any) {
    console.error("/api/v1/sync error:", error);
    return res.status(502).json({ error: error.message || "BasketAPI sync failed" });
  }
});

router.get("/v1/resolve", async (req: Request, res: Response) => {
  const { league, homeTeam, awayTeam, date } = req.query as Record<string, string>;

  if (!homeTeam || !awayTeam) {
    return res.status(400).json({ error: "homeTeam and awayTeam are required" });
  }

  try {
    const cacheKey = `resolve-${homeTeam}-${awayTeam}-${date || ""}`;
    const cached = getCached(cacheKey);
    if (cached) {
      return res.json(cached);
    }

    const liveResponse = await basketFetch("/api/basketball/matches/live");
    const events = liveResponse?.events || [];
    const target = getTargetMatch(events, homeTeam, awayTeam);

    if (!target) {
      return res.status(404).json({ error: "Match resolution failed: no live event found" });
    }

    const payload = {
      matchId: target.id,
      homeTeam: target.homeTeam?.name,
      awayTeam: target.awayTeam?.name,
      status: target.status?.type,
      score: {
        home: target.homeScore?.current ?? 0,
        away: target.awayScore?.current ?? 0,
      },
      date: date || new Date().toISOString().split("T")[0],
    };

    setCache(cacheKey, payload, 20_000);
    return res.json(payload);
  } catch (error: any) {
    console.error("/api/v1/resolve error:", error);
    return res.status(502).json({ error: error.message || "BasketAPI resolve failed" });
  }
});

router.get("/basket/live", async (req: Request, res: Response) => {
  if (!RAPIDAPI_KEY) {
    return res.status(500).json({ error: "Missing RAPIDAPI_KEY environment variable" });
  }
  try {
    const cacheKey = "basket-live";
    const cached = getCached(cacheKey);
    if (cached) {
      return res.json(cached);
    }

    const response = await basketFetch("/api/basketball/matches/live");
    setCache(cacheKey, response, 10_000);
    return res.json(response);
  } catch (error: any) {
    console.error("/api/basket/live error:", error);
    return res.status(502).json({ error: error.message || "BasketAPI live fetch failed" });
  }
});

router.get("/basket/match/:id/statistics", async (req: Request, res: Response) => {
  if (!RAPIDAPI_KEY) {
    return res.status(500).json({ error: "Missing RAPIDAPI_KEY environment variable" });
  }

  const { id } = req.params;
  if (!id) {
    return res.status(400).json({ error: "Match ID is required" });
  }

  try {
    const cacheKey = `basket-match-stats-${id}`;
    const cached = getCached(cacheKey);
    if (cached) {
      return res.json(cached);
    }

    const response = await basketFetch(`/api/basketball/match/${encodeURIComponent(id)}/statistics`);
    setCache(cacheKey, response, 15_000);
    return res.json(response);
  } catch (error: any) {
    console.error("/api/basket/match/:id/statistics error:", error);
    return res.status(502).json({ error: error.message || "BasketAPI match stats failed" });
  }
});

export default router;
