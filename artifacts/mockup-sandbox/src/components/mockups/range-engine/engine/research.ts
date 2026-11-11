import { parseNumber, parseNumberArray, normalizePercent, weightedAverage, formatInjuryNotes, getLineupFromPayload } from "@workspace/range-engine";
import { makeResearchCacheKey, saveResearchCache, loadResearchCache, isResearchCacheValid } from "./storage";
import type { ResearchData } from "@workspace/range-engine";
export const API_BASE = (import.meta.env.VITE_API_BASE || "").replace(/\/+$/, "");
export async function fetchResearchData(
  homeTeam: string,
  awayTeam: string,
  league: string,
  gameId?: string,
  bookmaker?: string,
  fixtureDate?: string,
): Promise<ResearchData> {
  const researchStartedAt = Date.now();
  let sourcesScanned = 0;
  const params = new URLSearchParams({
    league: league || "",
    homeTeam: homeTeam || "",
    awayTeam: awayTeam || "",
  });
  if (gameId) params.set("gameId", String(gameId));
  if (bookmaker) params.set("bookmaker", String(bookmaker));

  let preData: any = null;
  let preErr: string | null = null;
  try {
    const preParams = new URLSearchParams({
      homeTeam: homeTeam || "",
      awayTeam: awayTeam || "",
    });
    if (fixtureDate) preParams.set("date", fixtureDate);
    const preResponse = await fetch(`${API_BASE}/api/v1/prematch?${preParams.toString()}`);
    if (preResponse.ok) { preData = await preResponse.json(); sourcesScanned++; }
    else { try { preErr = (await preResponse.json())?.error ?? null; } catch { /* ignore */ } }
  } catch (e) {
    preData = null;
  }

  let leagueFoulsMeasured: number | null = null;
  let leagueDnaMeasured: any = null;
  try {
    const ldRes = await fetch(`${API_BASE}/api/v1/league-dna?league=${encodeURIComponent(league || "")}`);
    if (ldRes.ok) {
      sourcesScanned++;
      const ld = await ldRes.json();
      if (ld?.measured) leagueDnaMeasured = { games: ld.games, avgTotal: ld.avgTotal, sd: ld.sd };
      if (typeof ld?.foulsPerGame === "number") leagueFoulsMeasured = ld.foulsPerGame;
    }
  } catch { leagueDnaMeasured = null; }

  const response = await fetch(`${API_BASE}/api/v1/sync?${params.toString()}`).catch(() => null);

  if ((!response || !response.ok) && !preData) {
    throw new Error(preErr ?? `API request failed${response ? ` with status ${response.status}` : ""}`);
  }

  const apiData: any = response && response.ok ? await response.json() : {};
  if (response && response.ok) sourcesScanned++;

  if (preData) {
    apiData.provenance = "real";
    apiData.homeArenaPPG = preData.home?.homeArenaPPG ?? apiData.homeArenaPPG;
    apiData.awayRoadPPG = preData.away?.awayRoadPPG ?? apiData.awayRoadPPG;
    apiData.h2hAvgTotal = preData.h2h?.avgTotal ?? apiData.h2hAvgTotal;
    if (Array.isArray(preData.h2h?.totals) && preData.h2h.totals.length) {
      apiData.h2h = preData.h2h.totals;
    }
    apiData.homeFormString = preData.home?.formLast5 ?? apiData.homeFormString;
    apiData.awayFormString = preData.away?.formLast5 ?? apiData.awayFormString;
    apiData.homeQuarters = preData.home?.quarters ?? null;
    apiData.awayQuarters = preData.away?.quarters ?? null;
    apiData.homeFt = preData.home?.shooting?.ftPct ?? apiData.homeFt;
    apiData.awayFt = preData.away?.shooting?.ftPct ?? apiData.awayFt;
    apiData.homePt3 = preData.home?.shooting?.pt3Pct ?? apiData.homePt3;
    apiData.awayPt3 = preData.away?.shooting?.pt3Pct ?? apiData.awayPt3;
    apiData.homeFgPct = preData.home?.shooting?.fgPct ?? apiData.homeFgPct;
    apiData.awayFgPct = preData.away?.shooting?.fgPct ?? apiData.awayFgPct;
    apiData.homeFtAttempts = preData.home?.shooting?.ftAttemptsPerGame ?? apiData.homeFtAttempts;
    apiData.awayFtAttempts = preData.away?.shooting?.ftAttemptsPerGame ?? apiData.awayFtAttempts;
    apiData.homeFoulRate = preData.home?.shooting?.foulsPerGame ?? apiData.homeFoulRate;
    apiData.awayFoulRate = preData.away?.shooting?.foulsPerGame ?? apiData.awayFoulRate;
    apiData.homePt2 = preData.home?.shooting?.pt2Pct ?? apiData.homePt2;
    apiData.awayPt2 = preData.away?.shooting?.pt2Pct ?? apiData.awayPt2;
    // Measured points-ALLOWED averages -> defensive PPG. Until now no
    // merge line carried them, so homeDefPpg fell back to the team's
    // OFFENSIVE PPG and the Form DNA "PPG DEFENSE" row printed the
    // attack number as a defensive profile.
    apiData.homeDefPpg = preData.home?.avgAllowed ?? apiData.homeDefPpg;
    apiData.awayDefPpg = preData.away?.avgAllowed ?? apiData.awayDefPpg;
    // Real H2H record for the Sportybet matrix header (the box used to
    // count last-5 form letters - see prematch h2h note).
    apiData.h2hMeetings = preData.h2h?.meetings ?? apiData.h2hMeetings;
    apiData.h2hHomeWins = preData.h2h?.homeWins ?? apiData.h2hHomeWins;
    apiData.h2hAwayWins = preData.h2h?.awayWins ?? apiData.h2hAwayWins;
    // Counting stats per game (display layer - see prematch note).
    apiData.homeSteals = preData.home?.shooting?.stealsPerGame ?? apiData.homeSteals;
    apiData.awaySteals = preData.away?.shooting?.stealsPerGame ?? apiData.awaySteals;
    apiData.homeTurnovers = preData.home?.shooting?.turnoversPerGame ?? apiData.homeTurnovers;
    apiData.awayTurnovers = preData.away?.shooting?.turnoversPerGame ?? apiData.awayTurnovers;
    apiData.homeRebounds = preData.home?.shooting?.reboundsPerGame ?? apiData.homeRebounds;
    apiData.awayRebounds = preData.away?.shooting?.reboundsPerGame ?? apiData.awayRebounds;
    apiData.homeAssists = preData.home?.shooting?.assistsPerGame ?? apiData.homeAssists;
    apiData.awayAssists = preData.away?.shooting?.assistsPerGame ?? apiData.awayAssists;
    apiData.homeBlocks = preData.home?.shooting?.blocksPerGame ?? apiData.homeBlocks;
    apiData.awayBlocks = preData.away?.shooting?.blocksPerGame ?? apiData.awayBlocks;
    // Extended feeder stats (see prematch teamShooting note) + the
    // time-in-lead ratio that finally feeds the Form DNA TIME IN LEAD
    // row (it reads homeLeadPct below) + the detected fixture gender.
    apiData.homeOffReb = preData.home?.shooting?.offensiveReboundsPerGame ?? apiData.homeOffReb;
    apiData.awayOffReb = preData.away?.shooting?.offensiveReboundsPerGame ?? apiData.awayOffReb;
    apiData.homeDefReb = preData.home?.shooting?.defensiveReboundsPerGame ?? apiData.homeDefReb;
    apiData.awayDefReb = preData.away?.shooting?.defensiveReboundsPerGame ?? apiData.awayDefReb;
    apiData.homeBiggestLead = preData.home?.shooting?.biggestLeadPerGame ?? apiData.homeBiggestLead;
    apiData.awayBiggestLead = preData.away?.shooting?.biggestLeadPerGame ?? apiData.awayBiggestLead;
    apiData.homeLeadChanges = preData.home?.shooting?.leadChangesPerGame ?? apiData.homeLeadChanges;
    apiData.awayLeadChanges = preData.away?.shooting?.leadChangesPerGame ?? apiData.awayLeadChanges;
    apiData.homeMaxRun = preData.home?.shooting?.maxRunPerGame ?? apiData.homeMaxRun;
    apiData.awayMaxRun = preData.away?.shooting?.maxRunPerGame ?? apiData.awayMaxRun;
    apiData.homeTimeouts = preData.home?.shooting?.timeoutsPerGame ?? apiData.homeTimeouts;
    apiData.awayTimeouts = preData.away?.shooting?.timeoutsPerGame ?? apiData.awayTimeouts;
    apiData.homeFastBreakPts = preData.home?.shooting?.fastBreakPointsPerGame ?? apiData.homeFastBreakPts;
    apiData.awayFastBreakPts = preData.away?.shooting?.fastBreakPointsPerGame ?? apiData.awayFastBreakPts;
    apiData.homePaintPts = preData.home?.shooting?.pointsInPaintPerGame ?? apiData.homePaintPts;
    apiData.awayPaintPts = preData.away?.shooting?.pointsInPaintPerGame ?? apiData.awayPaintPts;
    apiData.homeTurnoverPts = preData.home?.shooting?.turnoverPointsPerGame ?? apiData.homeTurnoverPts;
    apiData.awayTurnoverPts = preData.away?.shooting?.turnoverPointsPerGame ?? apiData.awayTurnoverPts;
    apiData.homeLeadPct = preData.home?.shooting?.timeInLeadPct ?? apiData.homeLeadPct;
    apiData.awayLeadPct = preData.away?.shooting?.timeInLeadPct ?? apiData.awayLeadPct;
    apiData.detectedGender = preData.detectedGender ?? apiData.detectedGender;
    apiData.homeOtRate = preData.home?.otRate ?? apiData.homeOtRate;
    apiData.awayOtRate = preData.away?.otRate ?? apiData.awayOtRate;
    apiData.h2hOtRate = preData.h2h?.otRate ?? apiData.h2hOtRate;
    // Pooled measured OT rate across both teams' banked games + H2H
    // meetings (games-weighted, from the counts prematch serves).
    {
      const og = (preData.home?.otGames ?? 0) + (preData.away?.otGames ?? 0) + (preData.h2h?.otGames ?? 0);
      const gn = (preData.home?.gamesAnalyzed ?? 0) + (preData.away?.gamesAnalyzed ?? 0) + (preData.h2h?.meetings ?? 0);
      apiData.otRate = gn > 0 ? +(og / gn).toFixed(3) : null;
    }
    apiData.venue = preData.venue ?? apiData.venue;
    apiData.homeVsOtherForm = preData.home?.vsOther?.form ?? apiData.homeVsOtherForm;
    apiData.awayVsOtherForm = preData.away?.vsOther?.form ?? apiData.awayVsOtherForm;
    apiData.homeVsOtherGames = preData.home?.vsOther?.games ?? apiData.homeVsOtherGames;
    apiData.awayVsOtherGames = preData.away?.vsOther?.games ?? apiData.awayVsOtherGames;
    // Per-game series -> the *50 arrays the weighted Rule 10 averages
    // consume. No endpoint returned them before, so the weighted path
    // was dead code that always fell back to the season scalars.
    apiData.homeFoulRate50 = preData.home?.shootingSeries?.fouls ?? apiData.homeFoulRate50;
    apiData.awayFoulRate50 = preData.away?.shootingSeries?.fouls ?? apiData.awayFoulRate50;
    apiData.homeFtAttempts50 = preData.home?.shootingSeries?.ftAttempts ?? apiData.homeFtAttempts50;
    apiData.awayFtAttempts50 = preData.away?.shootingSeries?.ftAttempts ?? apiData.awayFtAttempts50;
    apiData.homeRestDays = preData.home?.restDays ?? apiData.homeRestDays;
    apiData.awayRestDays = preData.away?.restDays ?? apiData.awayRestDays;
    // Pool the REAL recent game totals (both teams + H2H meetings) for the
    // Rule 16 variance gate in runEngine.
    apiData.recentTotals = [
      ...(Array.isArray(preData.home?.recentTotals) ? preData.home.recentTotals : []),
      ...(Array.isArray(preData.away?.recentTotals) ? preData.away.recentTotals : []),
      ...(Array.isArray(preData.h2h?.totals) ? preData.h2h.totals : []),
    ];
    // Quarters-derived collapse must be computed BEFORE the fade note below,
    // which quotes it ("Peak collapse X%"); previously it was computed after.
    const qc = [preData.home?.quarters?.collapsePct, preData.away?.quarters?.collapsePct].filter(Boolean);
    if (qc.length) {
      apiData.collapsePct = Math.max(...qc.flatMap((c: any) => [c.q1, c.q2, c.q3, c.q4]));
    }
    const qf = (q: any) => (q?.q1 != null ? +((q.q1 + q.q2) - (q.q3 + q.q4)).toFixed(1) : null);
    const fadeH = qf(preData.home?.quarters?.avgCombined);
    const fadeA = qf(preData.away?.quarters?.avgCombined);
    if (fadeH != null || fadeA != null) {
      const worstFade = Math.max(fadeH ?? -999, fadeA ?? -999);
      const bestSurge = Math.min(fadeH ?? 999, fadeA ?? 999);
      apiData.defStallRisk = worstFade > 6 ? "HIGH" : worstFade > 3 ? "MODERATE" : "LOW";
      apiData.defStallNote = `Warehouse quarter history: 2nd-half fade — home ${fadeH ?? "n/a"} pts, away ${fadeA ?? "n/a"} pts vs 1st half. Peak collapse ${apiData.collapsePct ?? 0}%.`;
      apiData.offSurgeRisk = bestSurge < -4 ? "HIGH" : bestSurge < -1.5 ? "MODERATE" : "LOW";
      apiData.offSurgeNote = `2nd-half uptick — home ${fadeH != null ? -fadeH : "n/a"} pts, away ${fadeA != null ? -fadeA : "n/a"} pts. Computed from stored quarters, not simulated.`;
    }
  }
  // ESPN injury feed (free, NBA/WNBA): real per-player status lines for
  // the two teams, filling homeInjuries/awayInjuries — fields that until
  // now only ever carried the "awaiting news scan" placeholder. Display
  // and news-scan context only: the feed carries no player PPG, so
  // nothing here auto-fires Rule 11's key-player-out verdict.
  const injuryLeague = /wnba/i.test(league) ? "wnba" : /\bnba\b/i.test(league) ? "nba" : null;
  if (injuryLeague) {
    try {
      const injRes = await fetch(`${API_BASE}/api/v1/freefeed/injuries?league=${injuryLeague}`);
      if (injRes.ok) {
        sourcesScanned++;
        const injData = await injRes.json();
        const linesFor = (team: string) =>
          (Array.isArray(injData?.injuries) ? injData.injuries : [])
            .filter((x: any) => String(x?.team ?? "").trim().toLowerCase() === team.trim().toLowerCase())
            .map((x: any) => `${x.player} — ${x.status}${x.comment ? ` (${x.comment})` : ""}`)
            .join("; ");
        const homeInjLines = linesFor(homeTeam);
        const awayInjLines = linesFor(awayTeam);
        if (homeInjLines) apiData.homeInjuries = homeInjLines;
        if (awayInjLines) apiData.awayInjuries = awayInjLines;
      }
    } catch { /* feed unavailable: placeholder text stays */ }
    // Referee crew + measured strictness (NBA Official assignments x
    // ESPN banked crew history). Fills refereeStrictness — Rule 10's
    // referee branch never had a source before this — and carries
    // the crew names for display. Nulls leave the sync value / 0.
    try {
      const refRes = await fetch(`${API_BASE}/api/v1/freefeed/referees?home=${encodeURIComponent(homeTeam)}&away=${encodeURIComponent(awayTeam)}&league=${injuryLeague}${fixtureDate ? `&date=${fixtureDate}` : ""}`);
      if (refRes.ok) {
        const refData = await refRes.json();
        if (Array.isArray(refData?.officials) && refData.officials.length) {
          apiData.officials = refData.officials;
          sourcesScanned++;
        }
        if (typeof refData?.refereeStrictness === "number") apiData.refereeStrictness = refData.refereeStrictness;
      }
    } catch { /* source unavailable: strictness stays unmeasured */ }
    // Starting fives (RotoWire confirmed/expected, else each team's
    // last banked actual starters from ESPN). Fills the lineup
    // payload fields that until now no producer ever set.
    try {
      const linRes = await fetch(`${API_BASE}/api/v1/freefeed/lineups?home=${encodeURIComponent(homeTeam)}&away=${encodeURIComponent(awayTeam)}&league=${injuryLeague}${fixtureDate ? `&date=${fixtureDate}` : ""}`);
      if (linRes.ok) {
        const linData = await linRes.json();
        if ((Array.isArray(linData?.homeLineup) && linData.homeLineup.length) || (Array.isArray(linData?.awayLineup) && linData.awayLineup.length)) {
          apiData.homeLineup = linData.homeLineup;
          apiData.awayLineup = linData.awayLineup;
          apiData.lineupStatus = linData.status ?? null;
          apiData.lineupSource = linData.source ?? null;
          sourcesScanned++;
        }
      }
    } catch { /* source unavailable: lineups stay unverified */ }
  }

  const homeForm50 = parseNumberArray(
    apiData.homeForm50 ?? apiData.home_form_50 ?? apiData.homeForm ?? [],
  );
  const awayForm50 = parseNumberArray(
    apiData.awayForm50 ?? apiData.away_form_50 ?? apiData.awayForm ?? [],
  );
  const h2h50 = parseNumberArray(
    apiData.h2h50 ?? apiData.h2h_50 ?? apiData.h2h ?? [],
  );

  const homeFoulRate = normalizePercent(
    apiData.homeFoulRate ?? apiData.home_foul_rate ?? apiData.home_fouls_per_game,
  );
  const awayFoulRate = normalizePercent(
    apiData.awayFoulRate ?? apiData.away_foul_rate ?? apiData.away_fouls_per_game,
  );
  const leagueFoulAverage = normalizePercent(
    leagueFoulsMeasured ?? apiData.leagueFoulAverage ?? apiData.league_foul_average ?? apiData.leagueFouls,
  );
  const refereeStrictness = parseNumber(
    apiData.refereeStrictness ?? apiData.referee_strictness ?? apiData.referee_score,
    0,
  );
  const homeFtAttempts = parseNumber(
    apiData.homeFtAttempts ?? apiData.home_ft_attempts ?? apiData.home_fta,
    0,
  );
  const awayFtAttempts = parseNumber(
    apiData.awayFtAttempts ?? apiData.away_ft_attempts ?? apiData.away_fta,
    0,
  );
  const homeFoulRate50 = parseNumberArray(
    apiData.homeFoulRate50 ?? apiData.home_foul_rate_50 ?? apiData.homeFoulRates ?? [],
  );
  const awayFoulRate50 = parseNumberArray(
    apiData.awayFoulRate50 ?? apiData.away_foul_rate_50 ?? apiData.awayFoulRates ?? [],
  );
  const homeFtAttempts50 = parseNumberArray(
    apiData.homeFtAttempts50 ?? apiData.home_ft_attempts_50 ?? apiData.homeFta50 ?? [],
  );
  const awayFtAttempts50 = parseNumberArray(
    apiData.awayFtAttempts50 ?? apiData.away_ft_attempts_50 ?? apiData.awayFta50 ?? [],
  );

  // Unknown rest stays UNKNOWN (null): defaulting it to 1 invented a
  // fatigue signal — runEngine marked rest as "provided" and added its
  // Rule 10 fatigue bonus on a number nobody measured.
  const homeRestRaw = apiData.homeRestDays ?? apiData.home_rest_days ?? apiData.home_rest;
  const awayRestRaw = apiData.awayRestDays ?? apiData.away_rest_days ?? apiData.away_rest;
  const homeRestDays: number | null = homeRestRaw == null ? null : parseNumber(homeRestRaw, 1);
  const awayRestDays: number | null = awayRestRaw == null ? null : parseNumber(awayRestRaw, 1);

  // Shooting rates stay NULL when no source measured them. Defaulting
  // to 0 made runEngine use a real-looking 0.00 eff FT/3PT and skip its
  // TEAM_DB/warehouse fallback (its guard is != null); the call sites
  // pass ?? undefined so null reaches the engine as "not provided".
  const homeFtRaw = apiData.homeFt ?? apiData.home_ft ?? apiData.homeFreeThrowPct;
  const homeFt: number | null = homeFtRaw == null ? null : normalizePercent(homeFtRaw);
  const awayFtRaw = apiData.awayFt ?? apiData.away_ft ?? apiData.awayFreeThrowPct;
  const awayFt: number | null = awayFtRaw == null ? null : normalizePercent(awayFtRaw);
  const homePt3Raw = apiData.homePt3 ?? apiData.home_pt3 ?? apiData.homeThreePtPct;
  const homePt3: number | null = homePt3Raw == null ? null : normalizePercent(homePt3Raw);
  const awayPt3Raw = apiData.awayPt3 ?? apiData.away_pt3 ?? apiData.awayThreePtPct;
  const awayPt3: number | null = awayPt3Raw == null ? null : normalizePercent(awayPt3Raw);
  const homePt2Raw = apiData.homePt2 ?? apiData.home_pt2;
  const homePt2: number | null = homePt2Raw == null ? null : normalizePercent(homePt2Raw);
  const awayPt2Raw = apiData.awayPt2 ?? apiData.away_pt2;
  const awayPt2: number | null = awayPt2Raw == null ? null : normalizePercent(awayPt2Raw);
  // Counting stats stay NULL when no banked stat line carries them -
  // the Form DNA panel renders "--" rather than a fabricated 0.
  const homeSteals: number | null = apiData.homeSteals == null ? null : parseNumber(apiData.homeSteals, 0);
  const awaySteals: number | null = apiData.awaySteals == null ? null : parseNumber(apiData.awaySteals, 0);
  const homeTurnovers: number | null = apiData.homeTurnovers == null ? null : parseNumber(apiData.homeTurnovers, 0);
  const awayTurnovers: number | null = apiData.awayTurnovers == null ? null : parseNumber(apiData.awayTurnovers, 0);
  const homeRebounds: number | null = apiData.homeRebounds == null ? null : parseNumber(apiData.homeRebounds, 0);
  const awayRebounds: number | null = apiData.awayRebounds == null ? null : parseNumber(apiData.awayRebounds, 0);
  const homeAssists: number | null = apiData.homeAssists == null ? null : parseNumber(apiData.homeAssists, 0);
  const awayAssists: number | null = apiData.awayAssists == null ? null : parseNumber(apiData.awayAssists, 0);
  const homeBlocks: number | null = apiData.homeBlocks == null ? null : parseNumber(apiData.homeBlocks, 0);
  const awayBlocks: number | null = apiData.awayBlocks == null ? null : parseNumber(apiData.awayBlocks, 0);
  const homeOffReb: number | null = apiData.homeOffReb == null ? null : parseNumber(apiData.homeOffReb, 0);
  const awayOffReb: number | null = apiData.awayOffReb == null ? null : parseNumber(apiData.awayOffReb, 0);
  const homeDefReb: number | null = apiData.homeDefReb == null ? null : parseNumber(apiData.homeDefReb, 0);
  const awayDefReb: number | null = apiData.awayDefReb == null ? null : parseNumber(apiData.awayDefReb, 0);
  const homeBiggestLead: number | null = apiData.homeBiggestLead == null ? null : parseNumber(apiData.homeBiggestLead, 0);
  const awayBiggestLead: number | null = apiData.awayBiggestLead == null ? null : parseNumber(apiData.awayBiggestLead, 0);
  const homeLeadChanges: number | null = apiData.homeLeadChanges == null ? null : parseNumber(apiData.homeLeadChanges, 0);
  const awayLeadChanges: number | null = apiData.awayLeadChanges == null ? null : parseNumber(apiData.awayLeadChanges, 0);
  const homeMaxRun: number | null = apiData.homeMaxRun == null ? null : parseNumber(apiData.homeMaxRun, 0);
  const awayMaxRun: number | null = apiData.awayMaxRun == null ? null : parseNumber(apiData.awayMaxRun, 0);
  const homeTimeouts: number | null = apiData.homeTimeouts == null ? null : parseNumber(apiData.homeTimeouts, 0);
  const awayTimeouts: number | null = apiData.awayTimeouts == null ? null : parseNumber(apiData.awayTimeouts, 0);
  const homeFastBreakPts: number | null = apiData.homeFastBreakPts == null ? null : parseNumber(apiData.homeFastBreakPts, 0);
  const awayFastBreakPts: number | null = apiData.awayFastBreakPts == null ? null : parseNumber(apiData.awayFastBreakPts, 0);
  const homePaintPts: number | null = apiData.homePaintPts == null ? null : parseNumber(apiData.homePaintPts, 0);
  const awayPaintPts: number | null = apiData.awayPaintPts == null ? null : parseNumber(apiData.awayPaintPts, 0);
  const homeTurnoverPts: number | null = apiData.homeTurnoverPts == null ? null : parseNumber(apiData.homeTurnoverPts, 0);
  const awayTurnoverPts: number | null = apiData.awayTurnoverPts == null ? null : parseNumber(apiData.awayTurnoverPts, 0);
  const homeArenaPPG = parseNumber(
    apiData.homeArenaPPG ?? apiData.home_arena_ppg ?? apiData.home_ppg,
    0,
  );
  const awayRoadPPG = parseNumber(
    apiData.awayRoadPPG ?? apiData.away_road_ppg ?? apiData.away_ppg,
    0,
  );
  // Fallback is 0 ("no H2H data"), NEVER home+away PPG: the old fallback
  // fabricated an H2H average from the arena splits, which then enabled
  // the 60/40 weighted PPG in runEngine on invented data.
  const h2hAvgTotal = parseNumber(
    apiData.h2hAvgTotal ?? apiData.h2h_avg_total ?? apiData.h2h_total,
    0,
  );
  const collapsePct = parseNumber(
    apiData.collapsePct ?? apiData.collapse_pct ?? apiData.collapse_probability,
    0,
  );
  const recentTotals = parseNumberArray(apiData.recentTotals ?? []);

  const seasonHomeInjuries = formatInjuryNotes(
    apiData.homeInjuries ?? apiData.home_injuries ?? apiData.home_injury_note,
    "No injury data — awaiting news scan or manual entry",
  );
  const seasonAwayInjuries = formatInjuryNotes(
    apiData.awayInjuries ?? apiData.away_injuries ?? apiData.away_injury_note,
    "No injury data — awaiting news scan or manual entry",
  );

  const homeLineup = getLineupFromPayload(
    apiData.homeLineup ?? apiData.home_lineup ?? apiData.home_lineup_players,
  );
  const awayLineup = getLineupFromPayload(
    apiData.awayLineup ?? apiData.away_lineup ?? apiData.away_lineup_players,
  );

  const totalFoulRate = homeFoulRate + awayFoulRate;
  const totalFtAttempts = homeFtAttempts + awayFtAttempts;
  const fatiguePoints =
    (homeRestDays === 0 ? 1 : homeRestDays === 1 ? 0.5 : 0) +
    (awayRestDays === 0 ? 1 : awayRestDays === 1 ? 0.5 : 0);
  const leagueFoulHigh = leagueFoulAverage > 40;
  const refStrict = refereeStrictness >= 7;
  const highVolatility =
    totalFtAttempts >= 45 || totalFoulRate >= 42 || leagueFoulHigh || refStrict;

  // With NO rest days, NO foul rates and NO league foul average, every
  // input is an unmeasured zero — the old code still printed LOW with a
  // "schedule profile stable" all-clear. UNKNOWN is the honest state.
  const hasFatigueData =
    homeRestDays != null || awayRestDays != null || totalFoulRate > 0 || leagueFoulAverage > 0;
  const fatigueRisk: "LOW" | "MODERATE" | "HIGH" | "UNKNOWN" = !hasFatigueData
    ? "UNKNOWN"
    : fatiguePoints >= 1 || leagueFoulHigh ? "HIGH" : totalFoulRate >= 38 ? "MODERATE" : "LOW";
  const fatigueNote =
    fatigueRisk === "UNKNOWN"
      ? `Fatigue not assessed — no rest days, foul rates or league foul average banked for either team.`
      : fatigueRisk === "HIGH"
      ? fatiguePoints >= 1 && leagueFoulHigh
        ? `Schedule stress detected: ${homeRestDays ?? "—"}d rest / ${awayRestDays ?? "—"}d rest. Back-to-back / 3-in-4 fatigue is amplifying foul pressure and pace collapse risk. League foul volume adds to it: ${leagueFoulAverage} fouls/game measured.`
        : fatiguePoints >= 1
        ? `Schedule stress detected: ${homeRestDays ?? "—"}d rest / ${awayRestDays ?? "—"}d rest. Back-to-back / 3-in-4 fatigue is amplifying foul pressure and pace collapse risk.`
        : `League foul volume is driving this risk, not the schedule: the league averages ${leagueFoulAverage} fouls/game (rest is ${homeRestDays ?? "—"}d / ${awayRestDays ?? "—"}d - no back-to-back stress measured). High foul volume amplifies foul pressure and pace collapse risk.`
      : fatigueRisk === "MODERATE"
      ? `Moderate rest imbalance. Monitor warmups and minutes management for late-game fatigue fouls.`
      : `Schedule profile stable. No critical back-to-back or 3-in-4 fatigue signal detected.`;

  const hasStallData =
    apiData.defStallRisk != null || totalFoulRate > 0 || totalFtAttempts > 0 || refereeStrictness > 0;
  const defStallRisk: "LOW" | "MODERATE" | "HIGH" | "UNKNOWN" = !hasStallData ? "UNKNOWN" : apiData.defStallRisk ?? (
    fatigueRisk === "HIGH" || totalFoulRate >= 42
      ? "HIGH"
      : totalFoulRate >= 36 || totalFtAttempts >= 40
      ? "MODERATE"
      : "LOW");
  const defStallNote = apiData.defStallNote ?? (
    defStallRisk === "UNKNOWN"
      ? `Stall risk not assessed — no quarter history, foul rates or free-throw data banked for either team.`
      : defStallRisk === "HIGH"
      ? `🚨 DEFENSIVE STALL TRIGGER: ${totalFoulRate.toFixed(1)} foul rate combined, ${totalFtAttempts} FT attempts, ${homeRestDays ?? "—"} / ${awayRestDays ?? "—"} rest. League avg ${leagueFoulAverage} fouls. Late-game clock stoppages likely.`
      : defStallRisk === "MODERATE"
      ? `⚠ MODERATE stall risk: team foul pressure elevated and schedules are tight. Live possession management will decide the 4th quarter pace.`
      : `✓ LOW stall risk: historical pace remains stable and neither team is deep in fatigue territory.`);

  const hasSurgeData =
    apiData.offSurgeRisk != null || totalFoulRate > 0 || totalFtAttempts > 0 || refereeStrictness > 0;
  const offSurgeRisk: "LOW" | "MODERATE" | "HIGH" | "UNKNOWN" = !hasSurgeData ? "UNKNOWN" : apiData.offSurgeRisk ?? (
    highVolatility && totalFtAttempts >= 38
      ? "HIGH"
      : totalFtAttempts >= 32 || totalFoulRate >= 36
      ? "MODERATE"
      : "LOW");
  const offSurgeNote = apiData.offSurgeNote ?? (
    offSurgeRisk === "UNKNOWN"
      ? `Surge risk not assessed — no foul rates or free-throw data banked for either team.`
      : offSurgeRisk === "HIGH"
      ? `High-offense surge risk: heavy free-throw volume and league foul intensity are already above 40 fouls/game. Watch for clock stoppage and artificial point inflation.`
      : offSurgeRisk === "MODERATE"
      ? `Moderate surge risk. Free throw volume and team foul rates are elevated enough to keep totals alive late.`
      : `Scoring surge risk is low. Game shape remains controlled with reasonable foul pacing.`);

  // The PPG-margin fallback fired on 0/0 PPG too: |0 - 0| <= 6 printed a
  // MODERATE close-finish claim for a matchup with no data at all.
  // OT risk is now measured, not guessed from closeness: the old
  // branch compared H2H TOTALS against (homeArenaPPG + awayRoadPPG)/2
  // — a per-team average, half the scale of a total — so its HIGH /
  // MODERATE shares were computed against the wrong target. The
  // pooled banked OT rate (prematch) is the primary signal; the PPG
  // margin heuristic remains only as the no-OT-data fallback.
  const otRateMeasured: number | null = apiData.otRate ?? null;
  const hasOtData = otRateMeasured != null || homeArenaPPG > 0 || awayRoadPPG > 0;
  const otRisk: "LOW" | "MODERATE" | "HIGH" | "UNKNOWN" = !hasOtData ? "UNKNOWN" :
    otRateMeasured != null
      ? otRateMeasured >= 0.15
        ? "HIGH"
        : otRateMeasured >= 0.07
        ? "MODERATE"
        : "LOW"
      : Math.abs(homeArenaPPG - awayRoadPPG) <= 6
      ? "MODERATE"
      : "LOW";
  const otNote =
    otRisk === "UNKNOWN"
      ? `OT risk not assessed — no banked scoring or H2H data for either team.`
      : otRateMeasured != null
      ? `Measured from banked games: ${(otRateMeasured * 100).toFixed(0)}% of the teams' banked games (H2H included) reached overtime — ${otRisk} OT possibility on real history, not a closeness guess.`
      : otRisk === "MODERATE"
      ? `Moderate OT possibility. Margin and totals suggest a late-game close finish is possible.`
      : `Low OT probability. Historical spread and pace show a cleaner regulation finish.`;

  const foulEngineStatus: "SAFE" | "HIGH RISK" | "UNKNOWN" =
    totalFoulRate === 0 && totalFtAttempts === 0 && leagueFoulAverage === 0 && refereeStrictness === 0
      ? "UNKNOWN"
      : highVolatility || fatigueRisk === "HIGH" || leagueFoulHigh || refStrict
      ? "HIGH RISK"
      : "SAFE";
  const foulEngineNote =
    foulEngineStatus === "UNKNOWN"
      ? "Foul engine not assessed — no foul, free-throw, rest or referee data available."
      : foulEngineStatus === "HIGH RISK"
      ? "Extreme free-throw volume detected. Clock stoppage will artificially inflate total points. UNDER bets severely compromised."
      : "Standard foul pacing. Regulation finish expected.";

  // Additional normalized metrics for compatibility with the UI ResearchData shape
  const homeFgPctRaw = apiData.homeFgPct ?? apiData.home_fg_pct ?? apiData.homeFieldGoalPct;
  const homeFgPct: number | null = homeFgPctRaw == null ? null : normalizePercent(homeFgPctRaw);
  const awayFgPctRaw = apiData.awayFgPct ?? apiData.away_fg_pct ?? apiData.awayFieldGoalPct;
  const awayFgPct: number | null = awayFgPctRaw == null ? null : normalizePercent(awayFgPctRaw);
  const homeOffPpg = parseNumber(apiData.homeOffPpg ?? apiData.home_off_ppg ?? apiData.homeOffensePpg ?? homeArenaPPG, 0);
  const awayOffPpg = parseNumber(apiData.awayOffPpg ?? apiData.away_off_ppg ?? apiData.awayOffensePpg ?? awayRoadPPG, 0);
  // Defensive PPG is the measured points-ALLOWED average or NOTHING.
  // The old fallback substituted the team's own OFFENSIVE PPG: the
  // panel printed "PPG DEFENSE 85.5" for a team whose real allowed
  // average was 74.2 - a fabricated defensive profile feeding the
  // point-diff rows below.
  const homeDefPpgRaw = apiData.homeDefPpg ?? apiData.home_def_ppg ?? apiData.homeDefensePpg;
  const homeDefPpg: number | null = homeDefPpgRaw == null ? null : parseNumber(homeDefPpgRaw, 0);
  const awayDefPpgRaw = apiData.awayDefPpg ?? apiData.away_def_ppg ?? apiData.awayDefensePpg;
  const awayDefPpg: number | null = awayDefPpgRaw == null ? null : parseNumber(awayDefPpgRaw, 0);
  const homePointDiff: number | null = awayDefPpg == null ? null : parseFloat((homeOffPpg - awayDefPpg).toFixed(1));
  const awayPointDiff: number | null = homeDefPpg == null ? null : parseFloat((awayOffPpg - homeDefPpg).toFixed(1));
  // No endpoint in the repo returns lead-time fields, so a missing value must
  // render as "no data" ("--", the UI's own placeholder) — never "0% in lead",
  // which would present an unmeasured zero as a measured one.
  const homeLeadTime = apiData.homeLeadTime ?? apiData.home_lead_time ?? (apiData.homeLeadPct != null ? `${Math.floor(apiData.homeLeadPct)}% in lead` : "--");
  const awayLeadTime = apiData.awayLeadTime ?? apiData.away_lead_time ?? (apiData.awayLeadPct != null ? `${Math.floor(apiData.awayLeadPct)}% in lead` : "--");

  return {
    homeTeam,
    awayTeam,
    homeArenaPPG,
    awayRoadPPG,
    h2hAvgTotal,
    homeFt,
    awayFt,
    homePt3,
    awayPt3,
    homePt2,
    awayPt2,
    collapsePct,
    homeInjuries: seasonHomeInjuries,
    awayInjuries: seasonAwayInjuries,
    homeLineup,
    awayLineup,
    defStallRisk,
    defStallNote,
    offSurgeRisk,
    offSurgeNote,
    otRisk,
    otNote,
    homeFoulRate,
    awayFoulRate,
    homeFtAttempts,
    awayFtAttempts,
    homeFoulWeightedAvg: weightedAverage(homeFoulRate50),
    awayFoulWeightedAvg: weightedAverage(awayFoulRate50),
    homeFtAttemptWeightedAvg: weightedAverage(homeFtAttempts50),
    awayFtAttemptWeightedAvg: weightedAverage(awayFtAttempts50),
    homeRestDays,
    awayRestDays,
    leagueFoulAverage,
    refereeStrictness,
    leagueDnaMeasured: leagueDnaMeasured ?? null,
    homeQuarters: apiData.homeQuarters ?? null,
    awayQuarters: apiData.awayQuarters ?? null,
    homeForm50,
    awayForm50,
    h2h50,
    h2hMeetings: apiData.h2hMeetings ?? null,
    h2hHomeWins: apiData.h2hHomeWins ?? null,
    h2hAwayWins: apiData.h2hAwayWins ?? null,
    homeSteals,
    awaySteals,
    homeTurnovers,
    awayTurnovers,
    homeRebounds,
    awayRebounds,
    homeAssists,
    awayAssists,
    homeBlocks,
    awayBlocks,
    homeOffReb,
    awayOffReb,
    homeDefReb,
    awayDefReb,
    homeBiggestLead,
    awayBiggestLead,
    homeLeadChanges,
    awayLeadChanges,
    homeMaxRun,
    awayMaxRun,
    homeTimeouts,
    awayTimeouts,
    homeFastBreakPts,
    awayFastBreakPts,
    homePaintPts,
    awayPaintPts,
    homeTurnoverPts,
    awayTurnoverPts,
    detectedGender: apiData.detectedGender ?? null,
    otRate: apiData.otRate ?? null,
    homeOtRate: apiData.homeOtRate ?? null,
    awayOtRate: apiData.awayOtRate ?? null,
    venue: apiData.venue ?? null,
    // The sync payload's live score was fetched on every research run
    // and discarded by every consumer. It is now carried through so
    // the UI can acknowledge a live fixture with its real score and
    // runEngine's Rule 1 can quote it in the audit.
    liveScore: apiData.score && typeof apiData.score.home === "number" && typeof apiData.score.away === "number" ? { home: apiData.score.home, away: apiData.score.away, status: String(apiData.statusDescription ?? apiData.status ?? ""), periods: apiData.periods ?? null, clock: apiData.clock ?? null } : null,
    officials: Array.isArray(apiData.officials) && apiData.officials.length ? apiData.officials : null,
    lineupStatus: apiData.lineupStatus ?? null,
    lineupSource: apiData.lineupSource ?? null,
    homeVsOtherForm: apiData.homeVsOtherForm ?? null,
    awayVsOtherForm: apiData.awayVsOtherForm ?? null,
    homeVsOtherGames: apiData.homeVsOtherGames ?? null,
    awayVsOtherGames: apiData.awayVsOtherGames ?? null,
    recentTotals,
    fatigueRisk,
    fatigueNote,
    foulEngineStatus,
    foulEngineNote,
    // Truthful scan accounting: endpoints that actually returned data in
    // THIS call, and the real elapsed time — the sync payload never
    // carried these fields, so the panel previously always showed 0 / 0ms.
    sourcesScanned,
    researchMs: Date.now() - researchStartedAt,
    // Compatibility fields expected by UI
    // No form string and no supplied form array means NO form data: the old
    // fallback invented a W/L sequence by comparing a dummy 1 against the
    // arena PPG (almost always five fabricated "L"s). Empty = honest.
    homeRecentForm: apiData.homeFormString ? String(apiData.homeFormString).split("") : (apiData.homeRecentForm ?? apiData.home_recent_form) || [],
    awayRecentForm: apiData.awayFormString ? String(apiData.awayFormString).split("") : (apiData.awayRecentForm ?? apiData.away_recent_form) || [],
    homeFreeThrowPct: homeFt,
    awayFreeThrowPct: awayFt,
    homeThreePtPct: homePt3,
    awayThreePtPct: awayPt3,
    homeFgPct: homeFgPct,
    awayFgPct: awayFgPct,
    homeOffPpg: homeOffPpg,
    awayOffPpg: awayOffPpg,
    homeDefPpg: homeDefPpg,
    awayDefPpg: awayDefPpg,
    homePointDiff: homePointDiff,
    awayPointDiff: awayPointDiff,
    homeLeadTime: homeLeadTime,
    awayLeadTime: awayLeadTime,
  };
}

// Cache-aware wrapper: checks localStorage first, obeys TTL, and supports forced refresh
export async function fetchResearchDataCached(
  homeTeam: string,
  awayTeam: string,
  league: string,
  gameId: string | undefined = undefined,
  bookmaker: string | undefined = undefined,
  forceRefresh = false,
  fixtureDate?: string,
): Promise<ResearchData> {
  const key = makeResearchCacheKey(league, homeTeam, awayTeam, gameId ?? "", bookmaker ?? "", fixtureDate ?? "");
  if (!forceRefresh) {
    const entry = loadResearchCache(key);
    if (isResearchCacheValid(entry)) {
      try {
        return entry!.payload as ResearchData;
      } catch (e) {
        // fallthrough to fetching
      }
    }
  }
  const fresh = await fetchResearchData(homeTeam, awayTeam, league, gameId, bookmaker, fixtureDate);
  try {
    saveResearchCache(key, fresh);
  } catch (e) {
    console.warn("Failed saving research cache after fetch", e);
  }
  return fresh;
}
