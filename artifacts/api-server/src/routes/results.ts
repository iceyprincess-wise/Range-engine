import { Router, type Request, type Response } from "express";
import { store, rememberGames, persist, markDirty } from "../lib/warehouse";
import { quota, updateQuotaFromResponse } from "../lib/quotaTracker";

const router = Router();
const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY;
const RAPIDAPI_HOST = process.env.RAPIDAPI_HOST || "basketapi1.p.rapidapi.com";
const norm = (s: string) => s.trim().toLowerCase();

// Set after a 429/403 settle-fetch failure: the quota is known dead,
// so do not re-probe it on every request for 5 minutes.
let settleCooldownUntil = 0;

// Per-fixture settle-fetch cooldown (D-2026-11-11-13): the global
// 5-minute cooldown above only fires on 429/403, so a fixture whose
// game is simply not banked yet was re-fetched on every /v1/result
// call — up to 2 provider calls per Archive open, per page load,
// forever. A completed fetch that finds nothing cools that one
// fixture for 24h. In-memory only: a server restart clears it, and
// the client's persisted 24h attempt backoff covers that case.
const settleFetchCooldown = new Map<string, number>();
const SETTLE_FETCH_COOLDOWN_MS = 24 * 3600 * 1000;
const fixtureSettleKey = (home: string, away: string, date?: string, koTime?: string) =>
  [home, away, date ?? "", koTime ?? ""].join("|");

const apiFetch = async (p: string): Promise<any> => {
  const response = await fetch("https" + "://" + RAPIDAPI_HOST + p, {
    headers: { "x-rapidapi-key": RAPIDAPI_KEY ?? "", "x-rapidapi-host": RAPIDAPI_HOST },
  });
  updateQuotaFromResponse(response);
  if (!response.ok) throw new Error("BasketAPI " + response.status);
  return response.json();
};

const findStored = (h: string, a: string, date?: string, koTime?: string): any => {
  // SETTLEMENT IDENTITY: a result belongs to ONE fixture. Matching on
  // team names alone returned the pair's most recent scored meeting -
  // an April game "settled" a November fixture minutes before its
  // tip-off (proven live 2026-11-08). With a fixture date, only games
  // starting within +-1 day of it may answer (the +-1 tolerates
  // UTC/local date edges around midnight); exact-date matches are
  // preferred over window-edge ones in the return below.
  const target = date ? Date.parse(date + "T00:00:00Z") : NaN;
  // Kickoff window: the fixture itself, not its neighbours.
  // date+koTime parsed as UTC with a +-4h tolerance covers the
  // WAT/UTC+1 offset and clock skew; a scored meeting 24h away
  // (yesterday's game of a back-to-back pair, or tomorrow's) is
  // a DIFFERENT fixture and must never settle this one, so with
  // koTime there is no +-1-day fallback at all: no window match
  // means "not banked yet", honestly (D-2026-11-11-08).
  const koMs = date && koTime && /^\d{2}:\d{2}$/.test(koTime)
    ? Date.parse(date + "T" + koTime + ":00Z")
    : NaN;
  const dayOf = (g: any) => (g.startTimestamp ? new Date(g.startTimestamp * 1000).toISOString().slice(0, 10) : null);
  const pool = Object.values(store.games).filter((g: any) => {
    if (!Number.isFinite(target)) return true;
    const d = dayOf(g);
    if (!d) return false;
    return Math.abs(Date.parse(d + "T00:00:00Z") - target) <= 86400000;
  });
  // Exact pair first: substring matching must never outrank the exact
  // pair when it is banked (e.g. a later meeting of the same teams, or
  // a team whose name merely contains the query). Substring stays only
  // as a fallback for abbreviated input.
  // A settlement lookup must answer with a SCORED game: the old code
  // returned the latest name match even when it was an unscored future
  // fixture, so /v1/result answered settled:false for a pair whose
  // last meeting is already banked with a score. Search scored games
  // first (exact pair, then substring), unscored only as a fallback.
  const scored = (games: any[]) => games.filter((g: any) => g.homeScore?.current != null && g.awayScore?.current != null);
  const byTime = (games: any[]) =>
    games.sort((x: any, y: any) => (y.startTimestamp ?? 0) - (x.startTimestamp ?? 0))[0];
  const pick = (games: any[]) => {
    const exact = byTime(games.filter((g: any) => norm(g.homeTeam?.name ?? "") === h && norm(g.awayTeam?.name ?? "") === a));
    if (exact) return exact;
    return byTime(games.filter((g: any) => norm(g.homeTeam?.name ?? "").includes(h) && norm(g.awayTeam?.name ?? "").includes(a)));
  };
  const exactDay = Number.isFinite(target) ? pool.filter((g: any) => dayOf(g) === date) : pool;
  if (Number.isFinite(koMs)) {
    const inWindow = (g: any) => g.startTimestamp != null && Math.abs(g.startTimestamp * 1000 - koMs) <= 4 * 3600 * 1000;
    const windowGames = Object.values(store.games).filter(inWindow);
    return pick(scored(windowGames)) ?? pick(windowGames);
  }
  return pick(scored(exactDay)) ?? pick(scored(pool)) ?? pick(exactDay) ?? pick(pool);
};

router.get("/v1/result", async (req: Request, res: Response) => {
  const { homeTeam, awayTeam, date, koTime } = req.query as Record<string, string>;
  if (!homeTeam || !awayTeam) return res.status(400).json({ error: "homeTeam and awayTeam required" });
  const h = norm(homeTeam), a = norm(awayTeam);
  let g = findStored(h, a, date, koTime);

  // SETTLE-FETCH: not banked + quota healthy -> bank it now (once, permanent). Never fires on a dead quota.
  // Quota "unknown" (null on a fresh boot, before any upstream call has
  // reported headers) is NOT dead: allow one attempt — the attempt
  // itself reports the real quota in its response headers. A 429/403
  // answer cools further attempts down for 5 minutes instead.
  const quotaAllowsSettle = quota.remaining === null || quota.remaining >= 10;
  // Also fires when a match was found but is UNSCORED: the
  // stored copy cannot settle the receipt, and without the
  // fetch the scored copy is never banked (D-2026-11-11-08).
  const needsSettleFetch = !g || g.homeScore?.current == null || g.awayScore?.current == null;
  const settleKey = fixtureSettleKey(h, a, date, koTime);
  const settleCooledDown = (settleFetchCooldown.get(settleKey) ?? 0) > Date.now();
  if (needsSettleFetch && RAPIDAPI_KEY && quotaAllowsSettle && !settleCooledDown && Date.now() > settleCooldownUntil) {
    let fetchCompleted = false;
    try {
      let team = store.teams[h];
      if (!team) {
        const data = await apiFetch("/api/basketball/search/" + encodeURIComponent(homeTeam));
        // Prefer the provider hit whose name is exactly the query, not
        // whichever similarly-named team the provider lists first.
        const hits = (data?.results || []).filter((r: any) => r.type === "team");
        const hit = hits.find((r: any) => norm(r.entity?.name ?? "") === h) || hits[0];
        if (hit) { team = { id: hit.entity.id, name: hit.entity.name }; store.teams[h] = team; markDirty(); }
      }
      if (team) {
        const prev = await apiFetch("/api/basketball/team/" + team.id + "/matches/previous/0");
        rememberGames(prev?.events || []);
        persist();
        g = findStored(h, a, date, koTime);
      }
      fetchCompleted = true;
    } catch (err) {
      if (/BasketAPI (429|403)/.test(err instanceof Error ? err.message : "")) settleCooldownUntil = Date.now() + 5 * 60 * 1000;
      /* stays unsettled — honest response below */
    }
    // A completed fetch that still leaves the game unbanked or
    // unscored cools this fixture down for 24h: without it every
    // /v1/result call re-spent up to 2 provider calls on the same
    // unbankable fixture (D-2026-11-11-13). The warehouse lookup
    // above still runs on every call, so a game banked by another
    // path settles immediately.
    if (fetchCompleted && (!g || g.homeScore?.current == null || g.awayScore?.current == null)) {
      settleFetchCooldown.set(settleKey, Date.now() + SETTLE_FETCH_COOLDOWN_MS);
      if (settleFetchCooldown.size > 200) {
        const now = Date.now();
        for (const [k, v] of settleFetchCooldown) if (v <= now) settleFetchCooldown.delete(k);
      }
    }
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
