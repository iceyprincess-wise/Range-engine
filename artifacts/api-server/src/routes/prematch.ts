import { Router, type Request, type Response } from "express";
import { quota, updateQuotaFromResponse } from "../lib/quotaTracker";
import { store, persist, markDirty, rememberGames } from "../lib/warehouse";
import fs from "node:fs";
import path from "node:path";

const router = Router();
const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY;
const RAPIDAPI_HOST = process.env.RAPIDAPI_HOST || "basketapi1.p.rapidapi.com";


// ---------- quota tracking ----------

const apiFetch = async (p: string): Promise<any> => {
  const response = await fetch("https" + "://" + RAPIDAPI_HOST + p, {
    headers: { "x-rapidapi-key": RAPIDAPI_KEY ?? "", "x-rapidapi-host": RAPIDAPI_HOST },
  });
  updateQuotaFromResponse(response);
  if (!response.ok) throw new Error("BasketAPI " + response.status + ": " + (await response.text()));
  return response.json();
};

// ---------- helpers ----------
const pts = (e: any, side: "home" | "away") => e?.[side + "Score"]?.current ?? null;


const searchOnce = async (q: string) => {
  const data = await apiFetch("/api/basketball/search/" + encodeURIComponent(q));
  const hit = (data?.results || []).find((r: any) => r.type === "team");
  return hit ? { id: hit.entity.id as number, name: hit.entity.name as string } : null;
};

const searchTeam = async (name: string) => {
  const key = name.trim().toLowerCase();
  if (store.teams[key]) return store.teams[key];
  const base = name.replace(/\(.*?\)/g, " ").replace(/[._]/g, " ").replace(/\s+/g, " ").trim();
  const words = base.split(" ");
  const candidates = [...new Set([
    base,
    words.slice(0, 2).join(" "),
    words.length > 1 ? words[words.length - 1] : "",
  ].filter((c) => c && c.length >= 3))].slice(0, 3);
  for (const q of candidates) {
    const team = await searchOnce(q);
    if (team) { store.teams[key] = team; markDirty(); return team; }
  }
  throw new Error('Team not found in provider: "' + name + '" — check spelling or use the games browser tap-to-fill (exact names)');
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

const qpts = (e: any, side: "home" | "away", q: number) => e?.[side + "Score"]?.["period" + q] ?? null;

const quarterProfile = (games: any[]) => {
  const combined: number[][] = [[], [], [], []];
  const collapse = [0, 0, 0, 0];
  let counted = 0;
  for (const g of games) {
    const qs: number[] = [];
    for (let q = 1; q <= 4; q++) {
      const h = qpts(g, "home", q);
      const a = qpts(g, "away", q);
      if (h == null || a == null) break;
      qs.push(h + a);
    }
    if (qs.length !== 4) continue;
    counted++;
    const gameQuarterAvg = qs.reduce((s, v) => s + v, 0) / 4;
    qs.forEach((v, i) => {
      combined[i].push(v);
      if (v < 0.75 * gameQuarterAvg) collapse[i]++;
    });
  }
  const avg = (a: number[]) => (a.length ? +(a.reduce((s, v) => s + v, 0) / a.length).toFixed(1) : null);
  return {
    gamesWithQuarters: counted,
    avgCombined: { q1: avg(combined[0]), q2: avg(combined[1]), q3: avg(combined[2]), q4: avg(combined[3]) },
    collapsePct: counted
      ? { q1: Math.round((collapse[0] / counted) * 100), q2: Math.round((collapse[1] / counted) * 100), q3: Math.round((collapse[2] / counted) * 100), q4: Math.round((collapse[3] / counted) * 100) }
      : null,
  };
};
const parseStatItems = (payload: any) => {
  const out: Record<string, any> = {};
  for (const g of payload?.statistics?.[0]?.groups || [])
    for (const it of g.statisticsItems || [])
      out[it.key] = { hv: it.homeValue ?? null, ht: it.homeTotal ?? null, av: it.awayValue ?? null, at: it.awayTotal ?? null };
  return out;
};

// Fetch stats for up to `max` stored games that lack them. Skipped when quota is low —
// the analysis itself always outranks enrichment.
const enrichStats = async (games: any[], max: number) => {
  if (quota.remaining !== null && quota.remaining < 10) return;
  const todo = games.filter((g) => !store.stats[g.id]).slice(0, max);
  for (const g of todo) {
    try {
      const data = await apiFetch("/api/basketball/match/" + g.id + "/statistics");
      store.stats[g.id] = parseStatItems(data);
      markDirty();
    } catch { break; }
  }
};

const teamShooting = (games: any[], teamId: number) => {
  let ftM = 0, ftA = 0, p3M = 0, p3A = 0, fgM = 0, fgA = 0, fouls = 0, foulN = 0, n = 0;
  for (const g of games) {
    const s = store.stats[g.id];
    if (!s) continue;
    const isHome = g.homeTeam?.id === teamId;
    const pick = (k: string) => { const it = s[k]; return it ? (isHome ? { m: it.hv, a: it.ht } : { m: it.av, a: it.at }) : null; };
    const ft = pick("freeThrowsScored"), p3 = pick("threePointersScored"), fg = pick("fieldGoalsScored");
    const fl = s["totalFouls"] ? (isHome ? s["totalFouls"].hv : s["totalFouls"].av) : null;
    if (!ft && !p3 && !fg) continue;
    n++;
    if (ft?.a) { ftM += ft.m; ftA += ft.a; }
    if (p3?.a) { p3M += p3.m; p3A += p3.a; }
    if (fg?.a) { fgM += fg.m; fgA += fg.a; }
    if (fl != null) { fouls += fl; foulN++; }
  }
  const pct = (m: number, a: number) => (a ? +((m / a) * 100).toFixed(1) : null);
  return {
    statGames: n,
    ftPct: pct(ftM, ftA),
    pt3Pct: pct(p3M, p3A),
    fgPct: pct(fgM, fgA),
    ftAttemptsPerGame: n ? +(ftA / n).toFixed(1) : null,
    foulsPerGame: foulN ? +(fouls / foulN).toFixed(1) : null,
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

    await enrichStats([...homeGames, ...awayGames], 3);

    const h2hGames = Object.values(store.games).filter((e: any) => {
      const ids = [e.homeTeam?.id, e.awayTeam?.id];
      return ids.includes(home.id) && ids.includes(away.id);
    });
    const h2hTotals = h2hGames.map((e: any) => (pts(e, "home") ?? 0) + (pts(e, "away") ?? 0));
    const h2hAvgTotal = h2hTotals.length ? h2hTotals.reduce((s, v) => s + v, 0) / h2hTotals.length : null;

    persist();
    return res.json({
      provenance: apiOk ? "real" : "warehouse-stale",
      fetchedAt: new Date().toISOString(),
      home: { id: home.id, name: home.name, ...summarize(homeGames, home.id), quarters: quarterProfile(homeGames), shooting: teamShooting(homeGames, home.id), restDays: homeGames[0]?.startTimestamp ? Math.max(0, Math.floor((Date.now() / 1000 - homeGames[0].startTimestamp) / 86400)) : null },
      away: { id: away.id, name: away.name, ...summarize(awayGames, away.id), quarters: quarterProfile(awayGames), shooting: teamShooting(awayGames, away.id), restDays: awayGames[0]?.startTimestamp ? Math.max(0, Math.floor((Date.now() / 1000 - awayGames[0].startTimestamp) / 86400)) : null },
      h2h: { meetings: h2hGames.length, avgTotal: h2hAvgTotal, totals: h2hTotals },
      warehouse: { storedGames: Object.keys(store.games).length, storedTeams: Object.keys(store.teams).length },
      quota,
    });
  } catch (error) {
    console.error("/api/v1/prematch error:", error);
    return res.status(502).json({ error: error instanceof Error ? error.message : "prematch fetch failed" });
  }
});

router.get("/v1/quota", (_req: Request, res: Response) => {
  res.json(quota);
});

export default router;
