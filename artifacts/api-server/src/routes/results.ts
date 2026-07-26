import { Router, type Request, type Response } from "express";
import { store } from "../lib/warehouse";

const router = Router();
const norm = (s: string) => s.trim().toLowerCase();

// Settle from warehouse: zero upstream calls — finished games arrive via normal scans/browsing
router.get("/v1/result", (req: Request, res: Response) => {
  const { homeTeam, awayTeam } = req.query as Record<string, string>;
  if (!homeTeam || !awayTeam) return res.status(400).json({ error: "homeTeam and awayTeam required" });
  const h = norm(homeTeam), a = norm(awayTeam);
  const hits = Object.values(store.games)
    .filter((g: any) => norm(g.homeTeam?.name ?? "").includes(h) && norm(g.awayTeam?.name ?? "").includes(a))
    .sort((x: any, y: any) => (y.startTimestamp ?? 0) - (x.startTimestamp ?? 0));
  const g: any = hits[0];
  if (!g) return res.json({ settled: false, note: "not in warehouse yet — will appear after next scan touching these teams" });
  const home = g.homeScore?.current ?? null, away = g.awayScore?.current ?? null;
  return res.json({
    settled: home != null && away != null,
    home, away, total: home != null && away != null ? home + away : null,
    quarters: { home: [1,2,3,4].map((q) => g.homeScore?.["period" + q] ?? null), away: [1,2,3,4].map((q) => g.awayScore?.["period" + q] ?? null) },
    startTimestamp: g.startTimestamp ?? null, provenance: "warehouse",
  });
});
export default router;
