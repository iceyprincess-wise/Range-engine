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

  return {
    ...info,
    stats: { ...info.stats, avg_pts: +(+scored).toFixed(1), avg_allowed: allowed, games },
    source: "WAREHOUSE",
    proxyCapped: false,
    capValue: 0,
  };
}
