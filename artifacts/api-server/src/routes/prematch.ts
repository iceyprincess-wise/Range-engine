import { Router, type Request, type Response } from "express";
import { quota, updateQuotaFromResponse } from "../lib/quotaTracker";
import { store, persist, markDirty, rememberGames, resolveDataDir } from "../lib/warehouse";
import { expandTeamAlias, teamKey } from "../lib/teamNames";
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
  const hits = (data?.results || []).filter((r: any) => r.type === "team");
  // Prefer the provider hit whose name is exactly the query: the old
  // first-hit pick could return a similarly-named team.
  // D-2026-11-19-91: compare with normTeamName (diacritics/alias-aware),
  // not raw lowercase exact-match — "Zalgiris" never equalled "Žalgiris".
  const hit = hits.find((r: any) => normTeamName(r.entity?.name ?? "") === normTeamName(q)) || hits[0];
  return hit ? { id: hit.entity.id as number, name: hit.entity.name as string } : null;
};

// Compare team names the way the candidate queries are built
// (D-2026-11-15-05): strip parenthetical suffixes, normalise
// punctuation/whitespace, drop diacritics, lower-case — so
// "Zalgiris Kaunas" matches provider "Žalgiris Kaunas" and
// "Real Madrid (W)" matches provider "Real Madrid", while a
// different team never compares equal.
// D-2026-11-18-53: wrapped in the shared alias expansion, so
// "LA Clippers" compares equal to "Los Angeles Clippers".
const normTeamName = (s: string) =>
  expandTeamAlias(s.replace(/\(.*?\)/g, " ").replace(/[._]/g, " ").replace(/\s+/g, " ").trim().toLowerCase());

const searchTeam = async (name: string) => {
  const key = teamKey(name); // D-2026-11-18-88: canonical team key — the raw-lowercase key missed the alias-expanded reader
  // A banked entry is trusted only when its name IS the team
  // asked for (D-2026-11-15-05): the pre-fix fallback banked
  // wrong teams under the requested key ("Springfield Magic"
  // -> Orlando Magic, id 999), and the old early return served
  // that poisoned mapping forever without even searching.
  // A mismatched banked entry is deleted here (markDirty, so
  // the next persist writes the cleaned map) — the provider
  // search below (or the warehouse fallback) resolves again
  // and re-banks the correct team.
  const bankedTeam = store.teams[key];
  if (bankedTeam && normTeamName(bankedTeam.name) === normTeamName(name)) return bankedTeam;
  if (bankedTeam) { delete store.teams[key]; markDirty(); }
  const base = name.replace(/\(.*?\)/g, " ").replace(/[._]/g, " ").replace(/\s+/g, " ").trim();
  const words = base.split(" ");
  const candidates = [...new Set([
    base,
    words.slice(0, 2).join(" "),
    words.length > 1 ? words[words.length - 1] : "",
  ].filter((c) => c && c.length >= 3))].slice(0, 3);
  // D-2026-11-19-94: quota reserve BEFORE the provider search — the
  // banked-map check above already ran, so a team the warehouse can answer
  // never spends here. With <2 calls left the provider loop is skipped
  // entirely and the warehouse fallback below still runs.
  const quotaBlocked = quota.remaining !== null && quota.remaining < 2;
  for (const q of (quotaBlocked ? [] : candidates)) {
    try {
      const team = await searchOnce(q);
      // Accept a provider hit ONLY when it is the team actually
      // asked for (D-2026-11-15-05): searchOnce falls back to
      // hits[0] when no hit matches the query exactly, so an
      // unchecked hit can be a completely different team. The
      // last-word candidate is the demonstrated trigger
      // ("Springfield Magic" -> "Magic" -> Orlando Magic, id
      // 999, banked under the wrong key), but the base and
      // first-2-words candidates take the same unchecked path —
      // a provider that fuzzy-matches the full name returns the
      // same wrong team there (harness S2), so the gate covers
      // every candidate, not just the last word. A non-matching
      // hit is skipped, not banked: the next candidate, then
      // the warehouse fallback, then the honest 502 below
      // still run.
      if (team && normTeamName(team.name) === normTeamName(name)) { store.teams[key] = team; markDirty(); return team; }
    } catch {
      // Provider unreachable for this query — try the next candidate,
      // then the warehouse fallback below, instead of failing a
      // request the warehouse can already answer.
    }
  }
  // Warehouse fallback: the provider search missed, but the warehouse
  // already holds this team under its exact name — banked games carry
  // team ids + names. Resolve the id locally instead of failing a
  // request the warehouse can already answer.
  // D-2026-11-19-90: compare with normTeamName (diacritics/alias-aware),
  // not raw lowercase — the raw test missed alias-expanded keys, so the
  // warehouse fallback never fired for teams stored under another form.
  const banked = (Object.values(store.games) as any[]).find((g: any) =>
    normTeamName(g.homeTeam?.name ?? "") === normTeamName(name) || normTeamName(g.awayTeam?.name ?? "") === normTeamName(name));
  const bankedSide = banked
    ? (normTeamName(banked.homeTeam?.name ?? "") === normTeamName(name) ? banked.homeTeam : banked.awayTeam)
    : null;
  if (bankedSide?.id) {
    const team = { id: bankedSide.id as number, name: bankedSide.name as string };
    store.teams[key] = team; markDirty(); return team;
  }
  throw new Error('Team not found in provider: "' + name + '" — check spelling or use the games browser tap-to-fill (exact names)');
};

// Freshness is persisted: the in-memory-only map meant every server
// restart (every Render redeploy / spin-down wake) marked EVERY team
// stale and re-bought the same page-0 history at full quota price.
const LASTFETCH_PATH = path.join(resolveDataDir(), "lastfetch.json");
const lastFetch: Record<number, number> = (() => {
  try { return JSON.parse(fs.readFileSync(LASTFETCH_PATH, "utf8")); } catch { return {}; }
})();
const saveLastFetch = () => {
  try {
    fs.mkdirSync(path.dirname(LASTFETCH_PATH), { recursive: true });
    fs.writeFileSync(LASTFETCH_PATH, JSON.stringify(lastFetch));
  } catch { /* non-fatal */ }
};
const FRESH_MS = 6 * 60 * 60 * 1000;

const refreshTeam = async (id: number) => {
  const data = await apiFetch("/api/basketball/team/" + id + "/matches/previous/0");
  rememberGames(data?.events || []);
  lastFetch[id] = Date.now();
  saveLastFetch();
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
  const homeAllowed: number[] = [];
  const roadAllowed: number[] = [];
  const totals: number[] = [];
  const form: string[] = [];
  let otGames = 0;
  for (const g of games) {
    const isHome = g.homeTeam?.id === teamId;
    const scored = pts(g, isHome ? "home" : "away") as number;
    const allowed = pts(g, isHome ? "away" : "home") as number;
    (isHome ? homePts : roadPts).push(scored);
    (isHome ? homeAllowed : roadAllowed).push(allowed);
    totals.push(scored + allowed);
    if (g.homeScore?.overtime != null || g.awayScore?.overtime != null || g.status?.code === 110) otGames++;
    if (form.length < 5) form.push(scored > allowed ? "W" : "L");
  }
  const avg = (a: number[]) => (a.length ? a.reduce((s, v) => s + v, 0) / a.length : null);
  return {
    gamesAnalyzed: games.length,
    formLast5: form.join(""),
    homeArenaPPG: avg(homePts),
    awayRoadPPG: avg(roadPts),
    // Measured points-ALLOWED averages (the per-game `allowed` was
    // computed but only ever used for totals and W/L form). Research
    // maps these to defensive PPG; without them the UI fell back to
    // printing the team's OFFENSIVE PPG as its "defense".
    homeArenaAllowed: avg(homeAllowed),
    awayRoadAllowed: avg(roadAllowed),
    avgAllowed: avg([...homeAllowed, ...roadAllowed]),
    avgTotal: avg(totals),
    // Real per-game totals (newest first) so the client can run the
    // Rule 16 variance check against actual recent scoring, not averages.
    recentTotals: totals.slice(0, 10),
    // Measured overtime frequency over this team's banked games.
    // The overtime period scores / AET status were banked on every
    // game but read by nobody; Rule 18 and the research OT label now
    // consume the real rate instead of a closeness heuristic alone.
    otGames,
    otRate: games.length ? +(otGames / games.length).toFixed(3) : null,
  };
};

const qpts = (e: any, side: "home" | "away", q: number) => e?.[side + "Score"]?.["period" + q] ?? null;

// D-2026-11-17-29: the client pooled home + away + H2H by concatenation,
// so every H2H meeting counted THREE times (once in each team's pool,
// once in the H2H pool): pooled otRate 0.273 vs a true 2/18 = 0.111, and
// recentTotals passed Rule 16's >=5 gate on 2 unique games. The union
// is computed here because the client cannot dedupe totals arrays that
// carry no game ids. Keyed by provider game id (composite fallback for
// banked games without one); newest first.
export function dedupeUnionPool(homeGames: any[], awayGames: any[], h2hGames: any[]) {
  const isOt = (e: any) => e.homeScore?.overtime != null || e.awayScore?.overtime != null || e.status?.code === 110;
  const byId = new Map<string, any>();
  for (const g of [...homeGames, ...awayGames, ...h2hGames]) {
    const k = (g as any).id != null ? `id:${(g as any).id}` : `g:${g.homeTeam?.id}-${g.awayTeam?.id}-${g.startTimestamp}`;
    if (!byId.has(k)) byId.set(k, g);
  }
  const unionGames = [...byId.values()].sort((a: any, b: any) => (b.startTimestamp ?? 0) - (a.startTimestamp ?? 0));
  const otGames = unionGames.filter(isOt).length;
  const totals = unionGames.map((e: any) => (pts(e, "home") as number) + (pts(e, "away") as number));
  return {
    games: unionGames.length,
    otGames,
    otRate: unionGames.length ? +(otGames / unionGames.length).toFixed(3) : null,
    recentTotals: totals.slice(0, 10),
  };
}

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
  let ftM = 0, ftA = 0, p3M = 0, p3A = 0, fgM = 0, fgA = 0, p2M = 0, p2A = 0, fouls = 0, foulN = 0, n = 0;
  let stlSum = 0, stlN = 0, tovSum = 0, tovN = 0, rebSum = 0, rebN = 0, astSum = 0, astN = 0, blkSum = 0, blkN = 0;
  let orebSum = 0, orebN = 0, drebSum = 0, drebN = 0, bigSum = 0, bigN = 0, lcSum = 0, lcN = 0, runSum = 0, runN = 0, tmoSum = 0, tmoN = 0;
  let fbpSum = 0, fbpN = 0, pipSum = 0, pipN = 0, topSum = 0, topN = 0, leadSec = 0, leadTot = 0;
  for (const g of games) {
    const s = store.stats[g.id];
    if (!s) continue;
    const isHome = g.homeTeam?.id === teamId;
    const pick = (k: string) => { const it = s[k]; return it ? (isHome ? { m: it.hv, a: it.ht } : { m: it.av, a: it.at }) : null; };
    const ft = pick("freeThrowsScored"), p3 = pick("threePointersScored"), fg = pick("fieldGoalsScored");
    const fl = s["totalFouls"] ? (isHome ? s["totalFouls"].hv : s["totalFouls"].av) : null;
    if (!ft && !p3 && !fg) continue;
    // D-2026-11-18-59: a null make with attempts present is MISSING
    // data, not 0 makes — adding it pooled a 0% and could drive
    // pt2Pct negative. Skip the line entirely when the make is null.
    if (ft?.a && ft.m != null) { ftM += ft.m; ftA += ft.a; }
    if (p3?.a && p3.m != null) { p3M += p3.m; p3A += p3.a; }
    if (fg?.a && fg.m != null) { fgM += fg.m; fgA += fg.a; }
    // 2PT split: prefer the provider's own banked twoPointersScored
    // per game; fall back to the exact FG - 3PT derivation otherwise.
    const p2d = pick("twoPointersScored");
    if (p2d?.a && p2d.m != null) { p2M += p2d.m; p2A += p2d.a; } else if (fg?.a && p3?.a && fg.m != null && p3.m != null) { p2M += fg.m - p3.m; p2A += fg.a - p3.a; }
    // D-2026-11-19-93: statGames counts only games that actually contributed
    // a shooting line — the old n++ ran before the D-59 null-make guards,
    // so a game whose every line was skipped still counted as a shooting game.
    if ((ft?.a && ft.m != null) || (p3?.a && p3.m != null) || (fg?.a && fg.m != null) || (p2d?.a && p2d.m != null)) n++;
    if (fl != null) { fouls += fl; foulN++; }
    // Counting stats (Ed's added parameters): banked by BOTH providers
    // under these keys, previously averaged by nobody. Each stat keeps
    // its own denominator - a game only counts toward stats it carries.
    const cnt = (k: string) => { const it = s[k]; if (!it) return null; const v = isHome ? it.hv : it.av; return typeof v === "number" ? v : null; };
    const stl = cnt("steals"); if (stl != null) { stlSum += stl; stlN++; }
    const tov = cnt("turnovers"); if (tov != null) { tovSum += tov; tovN++; }
    const reb = cnt("rebounds"); if (reb != null) { rebSum += reb; rebN++; }
    const ast = cnt("assists"); if (ast != null) { astSum += ast; astN++; }
    const blk = cnt("blocks"); if (blk != null) { blkSum += blk; blkN++; }
    // Extended feeder stats: banked by the providers (offensive /
    // defensive rebounds, biggest lead, lead changes, max run,
    // timeouts on the paid feed; fast-break / paint / turnover points
    // and largest lead on the ESPN feed) and consumed by nobody until
    // now. Same per-stat denominator discipline as the counting stats.
    const orb = cnt("offensiveRebounds"); if (orb != null) { orebSum += orb; orebN++; }
    const drb = cnt("defensiveRebounds"); if (drb != null) { drebSum += drb; drebN++; }
    const big = cnt("biggestLead"); if (big != null) { bigSum += big; bigN++; }
    const lc = cnt("leadChanges"); if (lc != null) { lcSum += lc; lcN++; }
    const run = cnt("maxPointsInARow"); if (run != null) { runSum += run; runN++; }
    const tmo = cnt("timeouts"); if (tmo != null) { tmoSum += tmo; tmoN++; }
    const fbp = cnt("fastBreakPoints"); if (fbp != null) { fbpSum += fbp; fbpN++; }
    const pip = cnt("pointsInPaint"); if (pip != null) { pipSum += pip; pipN++; }
    const top = cnt("turnoverPoints"); if (top != null) { topSum += top; topN++; }
    // Time in lead arrives as a made/attempted-style pair (seconds in
    // lead over total game seconds): aggregate as a RATIO of sums,
    // never a mean of per-game percentages.
    const lead = pick("timeSpentInLead"); if (lead?.a && lead.m != null) { leadSec += lead.m; leadTot += lead.a; }
  }
  const pct = (m: number, a: number) => (a ? +((m / a) * 100).toFixed(1) : null);
  return {
    statGames: n,
    ftPct: pct(ftM, ftA),
    pt3Pct: pct(p3M, p3A),
    fgPct: pct(fgM, fgA),
    // Neither provider publishes a 2PT split; it is exact arithmetic on
    // the measured FG and 3PT lines (2PT = FG - 3PT).
    pt2Pct: pct(p2M, p2A),
    ftAttemptsPerGame: n ? +(ftA / n).toFixed(1) : null,
    foulsPerGame: foulN ? +(fouls / foulN).toFixed(1) : null,
    stealsPerGame: stlN ? +(stlSum / stlN).toFixed(1) : null,
    turnoversPerGame: tovN ? +(tovSum / tovN).toFixed(1) : null,
    reboundsPerGame: rebN ? +(rebSum / rebN).toFixed(1) : null,
    assistsPerGame: astN ? +(astSum / astN).toFixed(1) : null,
    blocksPerGame: blkN ? +(blkSum / blkN).toFixed(1) : null,
    offensiveReboundsPerGame: orebN ? +(orebSum / orebN).toFixed(1) : null,
    defensiveReboundsPerGame: drebN ? +(drebSum / drebN).toFixed(1) : null,
    biggestLeadPerGame: bigN ? +(bigSum / bigN).toFixed(1) : null,
    leadChangesPerGame: lcN ? +(lcSum / lcN).toFixed(1) : null,
    maxRunPerGame: runN ? +(runSum / runN).toFixed(1) : null,
    timeoutsPerGame: tmoN ? +(tmoSum / tmoN).toFixed(1) : null,
    fastBreakPointsPerGame: fbpN ? +(fbpSum / fbpN).toFixed(1) : null,
    pointsInPaintPerGame: pipN ? +(pipSum / pipN).toFixed(1) : null,
    turnoverPointsPerGame: topN ? +(topSum / topN).toFixed(1) : null,
    timeInLeadPct: leadTot ? +((leadSec / leadTot) * 100).toFixed(1) : null,
  };
};
// Per-game foul / FT-attempt series for one team, OLDEST -> NEWEST:
// research feeds these to weightedAverage, which weights the LAST
// element most. gamesForTeam returns newest-first, hence the reverse.
// Until now no endpoint returned these series, so runEngine's weighted
// Rule 10 path could never engage — it always fell back to the scalars.
const shootingSeries = (games: any[], teamId: number) => {
  const fouls: number[] = [];
  const ftAttempts: number[] = [];
  for (const g of games.slice().reverse()) {
    const s = store.stats[g.id];
    if (!s) continue;
    const isHome = g.homeTeam?.id === teamId;
    const fl = s["totalFouls"] ? (isHome ? s["totalFouls"].hv : s["totalFouls"].av) : null;
    const ft = s["freeThrowsScored"] ? (isHome ? s["freeThrowsScored"].ht : s["freeThrowsScored"].at) : null;
    if (fl != null && ft != null) { fouls.push(fl); ftAttempts.push(ft); }
  }
  return { fouls, ftAttempts };
};
// The provider records each team's gender ("M" / "F") on the team
// objects inside banked games - 791 of the 873 games in the tracked
// warehouse carry it, and nothing read it. Detection is per team over
// ALL its banked appearances; conflicting records claim nothing.
const teamGender = (teamId: number): "M" | "F" | null => {
  let g: string | null = null;
  for (const e of Object.values(store.games) as any[]) {
    for (const side of [e.homeTeam, e.awayTeam]) {
      if (side?.id === teamId && (side.gender === "M" || side.gender === "F")) {
        if (g && g !== side.gender) return null;
        g = side.gender;
      }
    }
  }
  return g as "M" | "F" | null;
};
const detectFixtureGender = (homeId: number, awayId: number): "Men" | "Women" | null => {
  const hg = teamGender(homeId), ag = teamGender(awayId);
  if (hg && ag) return hg === ag ? (hg === "F" ? "Women" : "Men") : null;
  if (hg === "F" || ag === "F") return "Women";
  if (hg === "M" || ag === "M") return "Men";
  return null;
};
router.get("/v1/prematch", async (req: Request, res: Response) => {
  const { homeTeam, awayTeam, date } = req.query as Record<string, string>;
  // Rest days are measured against the fixture date when the caller
  // supplies one (research does): "days since the last game" only
  // means something relative to when THIS game tips off. Falls back
  // to today for dateless callers.
  const fixtureTs = date && /^\d{4}-\d{2}-\d{2}$/.test(date)
    ? Math.floor(new Date(`${date}T12:00:00Z`).getTime() / 1000)
    : Math.floor(Date.now() / 1000);
  if (!homeTeam || !awayTeam) {
    return res.status(400).json({ error: "homeTeam and awayTeam are required" });
  }
  // No early key gate here on purpose: searchTeam falls back to the
  // warehouse and a failed refresh degrades to provenance
  // "warehouse-stale", so a missing key must not 500 a request the
  // warehouse can already answer. Live-only routes (resolve/sync)
  // keep their own key guard. Proven by the no-key live test: the old
  // gate 500'd even for banked pairings.
  try {
    // D-2026-11-19-94: searchTeam enforces the <2 quota reserve itself
    // (banked check first, then reserve, then provider search), so this
    // call never spends the reserve on a team the warehouse can answer.
    const [home, away] = await Promise.all([searchTeam(homeTeam), searchTeam(awayTeam)]);
    const now = Date.now();
    const stale = [home.id, away.id].filter((id) => now - (lastFetch[id] ?? 0) > FRESH_MS);
    let apiOk = true;
    // Quota guard: refresh/search had no floor, so a run of stale
    // prematches could drain the whole daily budget on re-fetches
    // alone (enrichment and settle-fetch both stop at their gates).
    // With <2 calls left, serve the warehouse instead of spending the
    // reserve — and let provenance say so (apiOk = false).
    if (stale.length > 0 && quota.remaining !== null && quota.remaining < 2) {
      apiOk = false;
      console.log(`prematch: refresh skipped — quota reserve (remaining=${quota.remaining})`);
    } else {
      try { await Promise.all(stale.map(refreshTeam)); } catch (e) { apiOk = false; console.error("refresh failed, serving warehouse:", e); }
    }

    const homeGames = gamesForTeam(home.id);
    const awayGames = gamesForTeam(away.id);

    // Per-side enrichment: the old single call capped the SHARED list
    // at 3, and home games come first, so all 3 slots went to home games
    // and the away side never got any stats (proven live 2026-11-07:
    // home shooting statGames 3, away statGames 0, every away percentage
    // null). Enrich up to 3 games PER SIDE instead (max 6 fetches, still
    // guarded by the quota check inside enrichStats). Stats are cached in
    // the warehouse, so the extra fetches are paid once per game, not
    // once per prematch. A home-side fetch failure no longer blocks the
    // away side either (each call breaks independently).
    const statsBefore = Object.keys(store.stats).length;
    await enrichStats(homeGames, 3);
    await enrichStats(awayGames, 3);
    const statsFetched = Object.keys(store.stats).length > statsBefore;

    const h2hGames = Object.values(store.games).filter((e: any) => {
      const ids = [e.homeTeam?.id, e.awayTeam?.id];
      return ids.includes(home.id) && ids.includes(away.id) && pts(e, "home") != null && pts(e, "away") != null;
    });
    const h2hTotals = h2hGames.map((e: any) => (pts(e, "home") as number) + (pts(e, "away") as number));
    const h2hAvgTotal = h2hTotals.length ? h2hTotals.reduce((s, v) => s + v, 0) / h2hTotals.length : null;
    // Real head-to-head record from the FIXTURE home team's
    // perspective. The UI's H2H box previously counted the home
    // team's last-5 FORM letters and presented them as an H2H record
    // ("5W - 0L" from a single banked meeting, proven live 2026-11-08).
    const h2hHomeWins = h2hGames.filter((e: any) => {
      const hs = pts(e, "home") as number, as = pts(e, "away") as number;
      return e.homeTeam?.id === home.id ? hs > as : as > hs;
    }).length;
    const h2hAwayWins = h2hGames.length - h2hHomeWins;
    const h2hOtGames = h2hGames.filter((e: any) => e.homeScore?.overtime != null || e.awayScore?.overtime != null || e.status?.code === 110).length;
    // D-2026-11-17-29: pooled OT rate + recent totals on the union, not
    // the triple-counted concatenation the client used to build.
    const pooled = dedupeUnionPool(homeGames, awayGames, h2hGames);
    // "Vs Other" pools: each team's banked games EXCLUDING this
    // fixture's opponent. The UI's "Home/Away vs Other (L5)" rows
    // previously rendered the all-opponents form string, H2H games
    // included — the label claimed a separation that did not exist.
    const vsOther = (games: any[], teamId: number, oppId: number) => {
      const pool = games.filter((g: any) => g.homeTeam?.id !== oppId && g.awayTeam?.id !== oppId);
      const totals = pool.map((g: any) => (pts(g, "home") as number) + (pts(g, "away") as number));
      const form = pool.slice(0, 5).map((g: any) => {
        const isH = g.homeTeam?.id === teamId;
        return (pts(g, isH ? "home" : "away") as number) > (pts(g, isH ? "away" : "home") as number) ? "W" : "L";
      }).join("");
      return { games: pool.length, avgTotal: totals.length ? +(totals.reduce((s, v) => s + v, 0) / totals.length).toFixed(1) : null, form };
    };
    const homeVsOther = vsOther(homeGames, home.id, away.id);
    const awayVsOther = vsOther(awayGames, away.id, home.id);
    // Venue: only ESPN-banked games carry one (82 in the warehouse).
    // Serve the most recent banked venue for this pairing / home team
    // instead of leaving the field unread in the store.
    const byRecency = (a: any, b: any) => (b.startTimestamp ?? 0) - (a.startTimestamp ?? 0);
    const venue = [...h2hGames].sort(byRecency).find((g: any) => g.venue?.name)?.venue?.name
      ?? [...homeGames].sort(byRecency).find((g: any) => g.venue?.name)?.venue?.name
      ?? null;

    persist();
    return res.json({
      // "real" only when THIS request actually fetched upstream data
      // (a team refresh or a stats enrichment). The old flag tracked
      // only refresh failure, so a fully warehouse-served response —
      // zero provider calls — was still labelled "real".
      provenance: (apiOk && stale.length > 0) || statsFetched ? "real" : "warehouse-stale",
      fetchedAt: new Date().toISOString(),
      home: { id: home.id, name: home.name, ...summarize(homeGames, home.id), quarters: quarterProfile(homeGames), shooting: teamShooting(homeGames, home.id), shootingSeries: shootingSeries(homeGames, home.id), restDays: homeGames[0]?.startTimestamp ? Math.max(0, Math.floor((fixtureTs - homeGames[0].startTimestamp) / 86400)) : null, vsOther: homeVsOther },
      away: { id: away.id, name: away.name, ...summarize(awayGames, away.id), quarters: quarterProfile(awayGames), shooting: teamShooting(awayGames, away.id), shootingSeries: shootingSeries(awayGames, away.id), restDays: awayGames[0]?.startTimestamp ? Math.max(0, Math.floor((fixtureTs - awayGames[0].startTimestamp) / 86400)) : null, vsOther: awayVsOther },
      h2h: { meetings: h2hGames.length, avgTotal: h2hAvgTotal, totals: h2hTotals, homeWins: h2hHomeWins, awayWins: h2hAwayWins, otGames: h2hOtGames, otRate: h2hGames.length ? +(h2hOtGames / h2hGames.length).toFixed(3) : null },
      pooled,
      // What the warehouse records say this fixture IS (see
      // detectFixtureGender). Detection only - the engine still
      // prices the selector the user chose; the UI warns on mismatch
      // instead of a men's/women's mix-up passing silently.
      detectedGender: detectFixtureGender(home.id, away.id),
      venue,
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
