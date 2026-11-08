import { Router, type Request, type Response } from "express";
import { store, rememberGames, markDirty, persist } from "../lib/warehouse";

const router = Router();

// ── FREE FEED (ESPN public JSON — no key, no RapidAPI quota) ─────────
// The paid BasketAPI budget is 50 calls/day, which made banking the
// 15+ games per league the engine needs painfully slow. ESPN's public
// scoreboard carries finished NBA/WNBA games WITH quarter linescores,
// and its summary endpoint carries full team box-score totals — the
// same two things the warehouse banks from the paid provider.
// Identity rule (the one real hazard): ESPN team ids live in a
// different id space (Celtics = ESPN 2 vs BasketAPI 3422), and the
// warehouse matches teams BY ID. ESPN ids are therefore NEVER stored:
// each ESPN team name is resolved to the warehouse's own team id by
// exact name, and a game is banked only when BOTH sides resolve —
// otherwise it is skipped and reported, never guessed.
const ESPN = "https://site.api.espn.com/apis/site/v2/sports/basketball";
const LEAGUES: Record<string, { path: string; name: string }> = {
  nba: { path: "nba", name: "NBA" },
  wnba: { path: "wnba", name: "WNBA" },
};

const normName = (s: string) => s.trim().toLowerCase().replace(/\s+/g, " ");

// Proven provider name variants (ESPN short name vs the warehouse's
// BasketAPI name). An alias is only a lookup hint: the game still
// banks solely when the aliased name exists in the warehouse map.
const NAME_ALIASES: Record<string, string> = {
  "la clippers": "los angeles clippers",
};

const teamIdByName = (): Map<string, { id: number; name: string }> => {
  const m = new Map<string, { id: number; name: string }>();
  for (const t of Object.values(store.teams) as any[]) {
    if (t?.name && t?.id != null) m.set(normName(t.name), { id: t.id, name: t.name });
  }
  for (const g of Object.values(store.games) as any[]) {
    for (const side of [g?.homeTeam, g?.awayTeam]) {
      if (side?.name && side?.id != null && !m.has(normName(side.name)))
        m.set(normName(side.name), { id: side.id, name: side.name });
    }
  }
  return m;
};

const espnFetch = async (url: string): Promise<any> => {
  const r = await fetch(url, { headers: { "user-agent": "Mozilla/5.0" } });
  if (!r.ok) throw new Error("ESPN HTTP " + r.status);
  return r.json();
};

const convertEvent = (ev: any, leagueName: string, ids: Map<string, { id: number; name: string }>): any => {
  const comp = ev?.competitions?.[0];
  const cs: any[] = comp?.competitors ?? [];
  const home = cs.find((c) => c.homeAway === "home");
  const away = cs.find((c) => c.homeAway === "away");
  if (!home || !away) return { skip: "shape" };
  if (!ev?.status?.type?.completed) return { skip: "not-final" };
  const hName = home.team?.displayName ?? "";
  const aName = away.team?.displayName ?? "";
  const hId = ids.get(normName(hName)) ?? ids.get(NAME_ALIASES[normName(hName)] ?? "");
  const aId = ids.get(normName(aName)) ?? ids.get(NAME_ALIASES[normName(aName)] ?? "");
  // Report only the side(s) that actually failed to resolve — listing
  // both teams of a skipped game blamed resolved teams too.
  if (!hId || !aId)
    return { skip: "unresolved", teams: [!hId ? hName : "", !aId ? aName : ""].filter(Boolean) };
  const scoreOf = (c: any) => {
    const cur = Number(c.score);
    if (!Number.isFinite(cur)) return null;
    const s: any = { current: cur, display: cur };
    (c.linescores ?? []).slice(0, 4).forEach((l: any, i: number) => {
      const v = Number(l?.displayValue);
      if (Number.isFinite(v)) s["period" + (i + 1)] = v;
    });
    return s;
  };
  const hs = scoreOf(home), as = scoreOf(away);
  if (!hs || !as) return { skip: "shape" };
  return {
    game: {
      id: Number(ev.id),
      startTimestamp: Math.floor(new Date(ev.date).getTime() / 1000),
      status: { code: 100, description: "Ended", type: "finished" },
      // The league determines the recorded gender deterministically
      // for this feed (NBA = M, WNBA = F). The paid provider's team
      // objects carry the same field; ESPN-converted games were the
      // only banked games missing it.
      homeTeam: { id: hId.id, name: hId.name, gender: /wnba/i.test(leagueName) ? "F" : "M" },
      awayTeam: { id: aId.id, name: aId.name, gender: /wnba/i.test(leagueName) ? "F" : "M" },
      homeScore: hs,
      awayScore: as,
      tournament: { name: leagueName, category: { name: "USA" } },
      // Venue identity from the ESPN payload, banked for completeness.
      // No engine rule consumes venue yet — the only arena input the
      // engine uses is the home/road PPG split.
      venue: comp?.venue?.fullName ? { name: comp.venue.fullName } : undefined,
      source: "espn-freefeed",
    },
  };
};

// Box-score totals in the exact store.stats shape the paid statistics
// enrichment writes ({hv, ht, av, at} per key), so teamShooting and
// the warehouse view consume them identically.
const parseEspnBoxscore = (summary: any): any => {
  const entries: any[] = summary?.boxscore?.teams ?? [];
  const home = entries.find((e) => e.homeAway === "home");
  const away = entries.find((e) => e.homeAway === "away");
  if (!home || !away) return null;
  const get = (e: any, name: string) =>
    (e.statistics ?? []).find((s: any) => s.name === name)?.displayValue ?? null;
  const ma = (v: any) => {
    if (typeof v !== "string") return null;
    const p = v.split("-").map(Number);
    return p.length === 2 && p.every(Number.isFinite) ? { m: p[0], a: p[1] } : null;
  };
  const fgH = ma(get(home, "fieldGoalsMade-fieldGoalsAttempted"));
  const fgA = ma(get(away, "fieldGoalsMade-fieldGoalsAttempted"));
  if (!fgH || !fgA) return null;
  const out: any = { fieldGoalsScored: { hv: fgH.m, ht: fgH.a, av: fgA.m, at: fgA.a } };
  const p3H = ma(get(home, "threePointFieldGoalsMade-threePointFieldGoalsAttempted"));
  const p3A = ma(get(away, "threePointFieldGoalsMade-threePointFieldGoalsAttempted"));
  if (p3H && p3A) {
    out.threePointersScored = { hv: p3H.m, ht: p3H.a, av: p3A.m, at: p3A.a };
    // ESPN publishes no 2PT split; exact arithmetic on the measured
    // FG and 3PT lines (2PT = FG - 3PT), same store.stats shape.
    out.twoPointersScored = { hv: fgH.m - p3H.m, ht: fgH.a - p3H.a, av: fgA.m - p3A.m, at: fgA.a - p3A.a };
  }
  const ftH = ma(get(home, "freeThrowsMade-freeThrowsAttempted"));
  const ftA = ma(get(away, "freeThrowsMade-freeThrowsAttempted"));
  if (ftH && ftA) out.freeThrowsScored = { hv: ftH.m, ht: ftH.a, av: ftA.m, at: ftA.a };
  const foulsH = Number(get(home, "fouls")), foulsA = Number(get(away, "fouls"));
  if (Number.isFinite(foulsH) && Number.isFinite(foulsA))
    out.totalFouls = { hv: foulsH, ht: null, av: foulsA, at: null };
  // Counting stats: ESPN publishes these as plain display values, not
  // made-attempted pairs (names verified live against the NBA summary
  // payload, 2026-11-08). Banked under the same store keys the paid
  // enrichment uses - ESPN calls rebounds "totalRebounds"; the store
  // key is "rebounds" - so prematch averages both sources identically.
  // Written only when BOTH sides report the stat.
  const count = (name: string) => {
    const hv = Number(get(home, name)), av = Number(get(away, name));
    return Number.isFinite(hv) && Number.isFinite(av) ? { hv, ht: null, av, at: null } : null;
  };
  const stl = count("steals"); if (stl) out.steals = stl;
  const tov = count("turnovers"); if (tov) out.turnovers = tov;
  const ast = count("assists"); if (ast) out.assists = ast;
  const blk = count("blocks"); if (blk) out.blocks = blk;
  const reb = count("totalRebounds"); if (reb) out.rebounds = reb;
  const oreb = count("offensiveRebounds"); if (oreb) out.offensiveRebounds = oreb;
  const dreb = count("defensiveRebounds"); if (dreb) out.defensiveRebounds = dreb;
  // ESPN-only extras (names verified live in the same payload):
  // largestLead banks under the store's biggestLead key; fast-break,
  // paint and turnover points have no paid-feed counterpart yet -
  // prematch averages them whenever a banked entry carries them.
  const lead = count("largestLead"); if (lead) out.biggestLead = lead;
  const fbp = count("fastBreakPoints"); if (fbp) out.fastBreakPoints = fbp;
  const pip = count("pointsInPaint"); if (pip) out.pointsInPaint = pip;
  const top = count("turnoverPoints"); if (top) out.turnoverPoints = top;
  return out;
};

// GET /v1/freefeed/bank?league=nba|wnba&dates=YYYYMMDD[,YYYYMMDD...]
// Banks finished games for those dates (max 14 dates per call), then
// fills box-score stats for ESPN-sourced games that lack them
// (max 20 summary fetches per call — call again to continue).
router.get("/v1/freefeed/bank", async (req: Request, res: Response) => {
  const lg = LEAGUES[String(req.query.league ?? "nba").toLowerCase()];
  if (!lg) return res.status(400).json({ error: "league must be nba or wnba" });
  const dates = String(req.query.dates ?? "")
    .split(",").map((s) => s.trim()).filter((s) => /^\d{8}$/.test(s)).slice(0, 14);
  if (!dates.length)
    return res.status(400).json({ error: "dates=YYYYMMDD[,YYYYMMDD...] is required (max 14 dates)" });
  const ids = teamIdByName();
  let seen = 0, banked = 0, alreadyBanked = 0, notFinal = 0, crossProviderDuplicates = 0;
  const unresolved: string[] = [];
  for (const d of dates) {
    let data: any;
    try { data = await espnFetch(`${ESPN}/${lg.path}/scoreboard?dates=${d}`); }
    catch (e) {
      return res.status(502).json({ error: `ESPN scoreboard failed for ${d}: ${e instanceof Error ? e.message : String(e)}` });
    }
    for (const ev of data?.events ?? []) {
      seen++;
      const conv = convertEvent(ev, lg.name, ids);
      if (conv.skip === "not-final") { notFinal++; continue; }
      if (conv.skip === "unresolved") { unresolved.push(...(conv.teams ?? [])); continue; }
      if (conv.skip || !conv.game) continue;
      const g = conv.game;
      // The same real game may already be banked under a BasketAPI id:
      // same two team ids within 12h = the same game, do not double-bank.
      const dupe = (Object.values(store.games) as any[]).find(
        (x) => x.id !== g.id && x.homeTeam?.id === g.homeTeam.id && x.awayTeam?.id === g.awayTeam.id &&
          x.startTimestamp && Math.abs(x.startTimestamp - g.startTimestamp) < 43200,
      );
      if (dupe) { crossProviderDuplicates++; continue; }
      if (store.games[g.id]) { alreadyBanked++; continue; }
      rememberGames([g]);
      if (store.games[g.id]) banked++;
    }
  }
  let statsFilled = 0, statsFailed = 0;
  const needStats = (Object.values(store.games) as any[])
    .filter((g) => g.source === "espn-freefeed" && g.tournament?.name === lg.name && !store.stats[g.id])
    .slice(0, 20);
  for (const g of needStats) {
    try {
      const summary = await espnFetch(`${ESPN}/${lg.path}/summary?event=${g.id}`);
      const st = parseEspnBoxscore(summary);
      if (st) { store.stats[g.id] = st; markDirty(); statsFilled++; }
      else statsFailed++;
    } catch { statsFailed++; }
  }
  if (banked > 0 || statsFilled > 0) persist();
  const statsRemaining = (Object.values(store.games) as any[])
    .filter((g) => g.source === "espn-freefeed" && g.tournament?.name === lg.name && !store.stats[g.id]).length;
  return res.json({
    league: lg.name, dates: dates.length, seen, banked, alreadyBanked, notFinal,
    unresolvedTeams: [...new Set(unresolved)], crossProviderDuplicates,
    statsFilled, statsFailed, statsRemaining,
    provenance: "ESPN public feed — zero RapidAPI quota spent",
  });
});

// GET /v1/freefeed/injuries?league=nba|wnba — structured injury feed
// (30-minute cache). This is the measured input Rule 11 never had:
// today it only sees news-headline regexes and manual entry.
const injuryCache = new Map<string, { at: number; data: any }>();
router.get("/v1/freefeed/injuries", async (req: Request, res: Response) => {
  const key = String(req.query.league ?? "nba").toLowerCase();
  const lg = LEAGUES[key];
  if (!lg) return res.status(400).json({ error: "league must be nba or wnba" });
  const cached = injuryCache.get(key);
  if (cached && Date.now() - cached.at < 30 * 60 * 1000)
    return res.json({ ...cached.data, cached: true });
  try {
    const data = await espnFetch(`${ESPN}/${lg.path}/injuries`);
    const out: any[] = [];
    for (const entry of data?.injuries ?? []) {
      const team = entry?.displayName ?? entry?.team?.displayName ?? "?";
      const list = Array.isArray(entry?.injuries) ? entry.injuries : entry?.athlete ? [entry] : [];
      for (const inj of list) {
        out.push({
          team,
          player: inj?.athlete?.displayName ?? "?",
          status: inj?.status ?? "?",
          comment: inj?.details?.detail ?? inj?.longComment ?? inj?.shortComment ?? "",
          date: inj?.date ?? null,
        });
      }
    }
    const payload = {
      league: lg.name, count: out.length, injuries: out,
      fetchedAt: new Date().toISOString(),
      provenance: "ESPN public feed — zero RapidAPI quota spent",
    };
    injuryCache.set(key, { at: Date.now(), data: payload });
    return res.json({ ...payload, cached: false });
  } catch (e) {
    return res.status(502).json({ error: `ESPN injuries failed: ${e instanceof Error ? e.message : String(e)}` });
  }
});

export default router;
