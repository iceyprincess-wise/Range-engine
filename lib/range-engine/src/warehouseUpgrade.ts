import type { ResearchData } from "./types";
import { lookupTeam } from "./teamDb";

type TeamInfo = ReturnType<typeof lookupTeam>;

/** Lift the proxy cap ONLY when the warehouse holds enough real games (>=10).
 *  Fewer games = cap stays, honestly labeled. */
export function upgradeWithWarehouse(
  info: TeamInfo,
  side: "home" | "away",
  research: ResearchData | null | undefined,
): TeamInfo {
  if (!research || info.source === "DB") return info;
  const r = research as any;
  const quarters = side === "home" ? r.homeQuarters : r.awayQuarters;
  const games = quarters?.gamesWithQuarters ?? 0;
  const scored = side === "home" ? r.homeArenaPPG : r.awayRoadPPG;
  if (games < 10 || !scored) return info;

  const q = quarters?.avgCombined;
  const quarterValues = q ? [q.q1, q.q2, q.q3, q.q4] : [];
  const totalAvg =
    quarterValues.length === 4 && quarterValues.every(Number.isFinite)
      ? quarterValues.reduce((sum, value) => sum + value, 0)
      : null;
  const allowed =
    totalAvg != null ? +(totalAvg - scored).toFixed(1) : info.stats.avg_allowed;

  const stats = {
    ...info.stats,
    avg_pts: +(+scored).toFixed(1),
    avg_allowed: allowed,
    games,
  };
  // Replace the shooting rates too when the warehouse measured them
  // (research carries them percent-scale; team stats are fractions).
  // Zero means "no shooting data", not a real 0%.
  const ftPct = side === "home" ? r.homeFt : r.awayFt;
  const pt3Pct = side === "home" ? r.homePt3 : r.awayPt3;
  if (typeof ftPct === "number" && ftPct > 0) stats.ft_pct = +(ftPct / 100).toFixed(3);
  if (typeof pt3Pct === "number" && pt3Pct > 0) stats.pt3_pct = +(pt3Pct / 100).toFixed(3);

  const upgraded = {
    ...info,
    stats,
    source: "WAREHOUSE" as const,
    proxyCapped: false,
    capValue: 0,
  };
  // Pace and defensive rating have NO warehouse source — they remain
  // the league proxy constants even after the lift. Mark the profile
  // partial so runEngine cannot present the matchup as fully measured
  // ("Strong / DB data — no cap required") while Rules 5/6/10 still
  // run on those invented inputs.
  (upgraded as any).statsPartial = true;
  return upgraded;
}
