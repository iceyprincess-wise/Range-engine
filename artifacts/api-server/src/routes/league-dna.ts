import { Router, type Request, type Response } from "express";
import { store } from "../lib/warehouse";

const router = Router();
const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, " ").replace(/\s+/g, " ").trim();

// Measured league profile from banked games — zero API cost, grows daily
router.get("/v1/league-dna", (req: Request, res: Response) => {
  const league = String(req.query.league ?? "");
  if (!league) return res.status(400).json({ error: "league is required" });
  const qWords = norm(league).split(" ").filter((w) => w.length > 2);
  const totals: number[] = [];
  for (const g of Object.values(store.games) as any[]) {
    const name = norm((g.tournament?.category?.name ?? "") + " " + (g.tournament?.name ?? ""));
    if (qWords.length === 0 || !qWords.every((w) => name.includes(w))) continue;
    const h = g.homeScore?.current, a = g.awayScore?.current;
    if (h != null && a != null) totals.push(h + a);
  }
  if (totals.length === 0) return res.json({ measured: false, games: 0, note: "no banked games match this league yet — engine falls back to profile" });
  const avg = totals.reduce((s, v) => s + v, 0) / totals.length;
  const sd = Math.sqrt(totals.reduce((s, v) => s + (v - avg) ** 2, 0) / totals.length);
  return res.json({ measured: true, games: totals.length, avgTotal: +avg.toFixed(1), sd: +sd.toFixed(1), minTotal: Math.min(...totals), maxTotal: Math.max(...totals), provenance: "warehouse" });
});
export default router;
