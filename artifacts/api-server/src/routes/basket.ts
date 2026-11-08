import { Router, type Request, type Response } from "express";
import { updateQuotaFromResponse } from "../lib/quotaTracker";

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

const basketFetch = async (path: string): Promise<any> => {
  const url = `https://${RAPIDAPI_HOST}${path}`;
  const response = await fetch(url, {
    headers: {
      "x-rapidapi-key": RAPIDAPI_KEY ?? "",
      "x-rapidapi-host": RAPIDAPI_HOST,
    },
  });

  // Every live-route call spends provider quota; it must reach the
  // tracker or /v1/quota (and every quota gate) decides on numbers
  // that ignore all live spend. Other route modules already do this.
  updateQuotaFromResponse(response);
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`BasketAPI ${response.status} ${response.statusText}: ${text}`);
  }
  return response.json();
};

const safeMatch = (event: any, homeSearch: string, awaySearch: string) => {
  const homeName = event?.homeTeam?.name?.toLowerCase() || "";
  const awayName = event?.awayTeam?.name?.toLowerCase() || "";
  // BOTH sides must match (each side allows either direction, so
  // "Lakers" still finds "Los Angeles Lakers"). The old OR logic
  // returned the first live game involving EITHER team, e.g. a
  // Lakers-vs-Celtics query matched a live Lakers-vs-Bulls game.
  const side = (stored: string, query: string) =>
    stored.length > 0 && query.length > 0 && (stored.includes(query) || query.includes(stored));
  return side(homeName, homeSearch) && side(awayName, awaySearch);
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
      // No statistics payload: this handler used to spend a second
      // quota call fetching the live match's statistics, and NO
      // consumer ever read the field (research reads none of the sync
      // fields for values; revalidation reads closing-line fields).
      // A fetched-then-discarded result is waste, not a feature.
      statistics: null,
    };

    setCache(cacheKey, payload, 20_000);
    return res.json(payload);
  } catch (error: any) {
    console.error("/api/v1/sync error:", error);
    return res.status(502).json({ error: error.message || "BasketAPI sync failed" });
  }
});

router.get("/v1/resolve", async (req: Request, res: Response) => {
  const { homeTeam, awayTeam, date } = req.query as Record<string, string>;

  if (!homeTeam || !awayTeam) {
    return res.status(400).json({ error: "homeTeam and awayTeam are required" });
  }

  // Every other BasketAPI route in this file guards the key first;
  // resolve did not, so a keyless server answered 502 (upstream 403)
  // instead of a clean 500 "Missing RAPIDAPI_KEY".
  if (!RAPIDAPI_KEY) {
    return res.status(500).json({ error: "Missing RAPIDAPI_KEY environment variable" });
  }

  // Resolve searches LIVE matches only: a dated query cannot be
  // answered from the live feed, so say so instead of silently
  // returning today's match (or a 404) for another day. Use
  // /api/v1/games/schedule for dated fixtures.
  if (date) {
    const today = new Date().toISOString().split("T")[0];
    if (date !== today) {
      return res.status(400).json({ error: "resolve only searches live matches; use /api/v1/games/schedule for dated fixtures", date, today });
    }
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

router.get("/basket/live", async (_req, res: Response) => {
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

    const response = await basketFetch(`/api/basketball/match/${encodeURIComponent(String(id))}/statistics`);
    setCache(cacheKey, response, 15_000);
    return res.json(response);
  } catch (error: any) {
    console.error("/api/basket/match/:id/statistics error:", error);
    return res.status(502).json({ error: error.message || "BasketAPI match stats failed" });
  }
});

export default router;
