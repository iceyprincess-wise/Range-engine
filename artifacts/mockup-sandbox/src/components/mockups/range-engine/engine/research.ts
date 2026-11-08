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
    const preResponse = await fetch(`${API_BASE}/api/v1/prematch?${preParams.toString()}`);
    if (preResponse.ok) { preData = await preResponse.json(); sourcesScanned++; }
    else { try { preErr = (await preResponse.json())?.error ?? null; } catch { /* ignore */ } }
  } catch (e) {
    preData = null;
  }

  let leagueDnaMeasured: any = null;
  try {
    const ldRes = await fetch(`${API_BASE}/api/v1/league-dna?league=${encodeURIComponent(league || "")}`);
    if (ldRes.ok) {
      sourcesScanned++;
      const ld = await ldRes.json();
      if (ld?.measured) leagueDnaMeasured = { games: ld.games, avgTotal: ld.avgTotal, sd: ld.sd };
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
    apiData.leagueFoulAverage ?? apiData.league_foul_average ?? apiData.leagueFouls,
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

  const homeRestDays = parseNumber(
    apiData.homeRestDays ?? apiData.home_rest_days ?? apiData.home_rest ?? 1,
    1,
  );
  const awayRestDays = parseNumber(
    apiData.awayRestDays ?? apiData.away_rest_days ?? apiData.away_rest ?? 1,
    1,
  );

  const homeFt = normalizePercent(
    apiData.homeFt ?? apiData.home_ft ?? apiData.homeFreeThrowPct,
  );
  const awayFt = normalizePercent(
    apiData.awayFt ?? apiData.away_ft ?? apiData.awayFreeThrowPct,
  );
  const homePt3 = normalizePercent(
    apiData.homePt3 ?? apiData.home_pt3 ?? apiData.homeThreePtPct,
  );
  const awayPt3 = normalizePercent(
    apiData.awayPt3 ?? apiData.away_pt3 ?? apiData.awayThreePtPct,
  );
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

  const fatigueRisk: "LOW" | "MODERATE" | "HIGH" =
    fatiguePoints >= 1 || leagueFoulHigh ? "HIGH" : totalFoulRate >= 38 ? "MODERATE" : "LOW";
  const fatigueNote =
    fatigueRisk === "HIGH"
      ? `Schedule stress detected: ${homeRestDays}d rest / ${awayRestDays}d rest. Back-to-back / 3-in-4 fatigue is amplifying foul pressure and pace collapse risk.`
      : fatigueRisk === "MODERATE"
      ? `Moderate rest imbalance. Monitor warmups and minutes management for late-game fatigue fouls.`
      : `Schedule profile stable. No critical back-to-back or 3-in-4 fatigue signal detected.`;

  const defStallRisk: "LOW" | "MODERATE" | "HIGH" = apiData.defStallRisk ?? (
    fatigueRisk === "HIGH" || totalFoulRate >= 42
      ? "HIGH"
      : totalFoulRate >= 36 || totalFtAttempts >= 40
      ? "MODERATE"
      : "LOW");
  const defStallNote = apiData.defStallNote ?? (
    defStallRisk === "HIGH"
      ? `🚨 DEFENSIVE STALL TRIGGER: ${totalFoulRate.toFixed(1)} foul rate combined, ${totalFtAttempts} FT attempts, ${homeRestDays} / ${awayRestDays} rest. League avg ${leagueFoulAverage} fouls. Late-game clock stoppages likely.`
      : defStallRisk === "MODERATE"
      ? `⚠ MODERATE stall risk: team foul pressure elevated and schedules are tight. Live possession management will decide the 4th quarter pace.`
      : `✓ LOW stall risk: historical pace remains stable and neither team is deep in fatigue territory.`);

  const offSurgeRisk: "LOW" | "MODERATE" | "HIGH" = apiData.offSurgeRisk ?? (
    highVolatility && totalFtAttempts >= 38
      ? "HIGH"
      : totalFtAttempts >= 32 || totalFoulRate >= 36
      ? "MODERATE"
      : "LOW");
  const offSurgeNote = apiData.offSurgeNote ?? (
    offSurgeRisk === "HIGH"
      ? `High-offense surge risk: heavy free-throw volume and league foul intensity are already above 40 fouls/game. Watch for clock stoppage and artificial point inflation.`
      : offSurgeRisk === "MODERATE"
      ? `Moderate surge risk. Free throw volume and team foul rates are elevated enough to keep totals alive late.`
      : `Scoring surge risk is low. Game shape remains controlled with reasonable foul pacing.`);

  const otRisk: "LOW" | "MODERATE" | "HIGH" =
    h2h50.length >= 10
      ? h2h50.filter((value) => Math.abs(value - (homeArenaPPG + awayRoadPPG) / 2) <= 2).length / h2h50.length >= 0.32
        ? "HIGH"
        : h2h50.filter((value) => Math.abs(value - (homeArenaPPG + awayRoadPPG) / 2) <= 2).length / h2h50.length >= 0.18
        ? "MODERATE"
        : "LOW"
      : Math.abs(homeArenaPPG - awayRoadPPG) <= 6
      ? "MODERATE"
      : "LOW";
  const otNote =
    otRisk === "HIGH"
      ? `High OT probability. Deep H2H body of work shows frequent close finish signatures and tight totals around projected average.`
      : otRisk === "MODERATE"
      ? `Moderate OT possibility. Margin and totals suggest a late-game close finish is possible.`
      : `Low OT probability. Historical spread and pace show a cleaner regulation finish.`;

  const foulEngineStatus: "SAFE" | "HIGH RISK" =
    highVolatility || fatigueRisk === "HIGH" || leagueFoulHigh || refStrict
      ? "HIGH RISK"
      : "SAFE";
  const foulEngineNote =
    foulEngineStatus === "HIGH RISK"
      ? "Extreme free-throw volume detected. Clock stoppage will artificially inflate total points. UNDER bets severely compromised."
      : "Standard foul pacing. Regulation finish expected.";

  // Additional normalized metrics for compatibility with the UI ResearchData shape
  const homeFgPct = normalizePercent(apiData.homeFgPct ?? apiData.home_fg_pct ?? apiData.homeFieldGoalPct ?? null);
  const awayFgPct = normalizePercent(apiData.awayFgPct ?? apiData.away_fg_pct ?? apiData.awayFieldGoalPct ?? null);
  const homeOffPpg = parseNumber(apiData.homeOffPpg ?? apiData.home_off_ppg ?? apiData.homeOffensePpg ?? homeArenaPPG, 0);
  const awayOffPpg = parseNumber(apiData.awayOffPpg ?? apiData.away_off_ppg ?? apiData.awayOffensePpg ?? awayRoadPPG, 0);
  const homeDefPpg = parseNumber(apiData.homeDefPpg ?? apiData.home_def_ppg ?? apiData.homeDefensePpg ?? homeArenaPPG, 0);
  const awayDefPpg = parseNumber(apiData.awayDefPpg ?? apiData.away_def_ppg ?? apiData.awayDefensePpg ?? awayRoadPPG, 0);
  const homePointDiff = parseFloat((homeOffPpg - awayDefPpg).toFixed(1));
  const awayPointDiff = parseFloat((awayOffPpg - homeDefPpg).toFixed(1));
  // No endpoint in the repo returns lead-time fields, so a missing value must
  // render as "no data" ("--", the UI's own placeholder) — never "0% in lead",
  // which would present an unmeasured zero as a measured one.
  const homeLeadTime = apiData.homeLeadTime ?? apiData.home_lead_time ?? (apiData.homeLeadPct != null ? `${Math.floor(apiData.homeLeadPct)}% in lead` : "--");
  const awayLeadTime = apiData.awayLeadTime ?? apiData.away_lead_time ?? (apiData.awayLeadPct != null ? `${Math.floor(apiData.awayLeadPct)}% in lead` : "--");

  return {
    homeArenaPPG,
    awayRoadPPG,
    h2hAvgTotal,
    homeFt,
    awayFt,
    homePt3,
    awayPt3,
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
): Promise<ResearchData> {
  const key = makeResearchCacheKey(league, homeTeam, awayTeam, gameId ?? "", bookmaker ?? "");
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
  const fresh = await fetchResearchData(homeTeam, awayTeam, league, gameId, bookmaker);
  try {
    saveResearchCache(key, fresh);
  } catch (e) {
    console.warn("Failed saving research cache after fetch", e);
  }
  return fresh;
}
