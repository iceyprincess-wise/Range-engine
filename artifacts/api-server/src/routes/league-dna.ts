import { Router, type Request, type Response } from "express";
import { store } from "../lib/warehouse";

const router = Router();
// D-2026-11-16-07: a fouls-per-game average needs a minimum sample.
// One high-foul game returned foulsPerGame: 47 with measured: true,
// and Rule 10 fires at > 40 — one game could tilt a whole league's
// pricing. Below the minimum the value is null (foulStatGames still
// reports the sample so callers can see why).
const MIN_FOUL_GAMES = 5;
// D-2026-11-19-92: NFD-strip diacritics first (same precedent as
// teamNames.ts normTeamName, D-2026-11-18-87) — without it "Žalgiris"
// normalised to "algiris" and never matched any stored league token.
const norm = (s: string) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]/g, " ").replace(/\s+/g, " ").trim();
const tokens = (s: string) => norm(s).split(" ").filter(Boolean);

// Measured league profile from banked games — zero API cost, grows daily
router.get("/v1/league-dna", (req: Request, res: Response) => {
  const league = String(req.query.league ?? "");
  if (!league) return res.status(400).json({ error: "league is required" });
  // Whole-word matching: the old substring test let "NBA" match "WNBA"
  // ("wnba".includes("nba")), and words of length <= 2 were dropped,
  // so "Big V" matched on "big" alone. Every query word must equal a
  // whole word of the stored "category tournament" name; a query with
  // no usable word is a 400 instead of a silent empty result.
  const qWords = tokens(league).filter((w) => w.length > 2);
  if (qWords.length === 0) return res.status(400).json({ error: "league query too short — use at least one word longer than 2 characters" });
  const totals: number[] = [];
  let foulTotal = 0, foulGames = 0;
  for (const g of Object.values(store.games) as any[]) {
    const name = tokens((g.tournament?.category?.name ?? "") + " " + (g.tournament?.name ?? ""));
    if (!qWords.every((w) => name.includes(w))) continue;
    const h = g.homeScore?.current, a = g.awayScore?.current;
    if (h != null && a != null) totals.push(h + a);
    const tf = store.stats[g.id]?.totalFouls;
    if (tf && typeof tf.hv === "number" && typeof tf.av === "number") { foulTotal += tf.hv + tf.av; foulGames++; }
  }
  if (totals.length === 0) return res.json({ measured: false, games: 0, note: "no banked games match this league yet — engine falls back to profile" });
  const avg = totals.reduce((s, v) => s + v, 0) / totals.length;
  // Sample SD (n-1), matching league-dna-measure.cjs, the generator of the DNA snapshot.
  const sd = totals.length > 1 ? Math.sqrt(totals.reduce((s, v) => s + (v - avg) ** 2, 0) / (totals.length - 1)) : 0;
  return res.json({ measured: true, games: totals.length, avgTotal: +avg.toFixed(1), sd: +sd.toFixed(1), minTotal: Math.min(...totals), maxTotal: Math.max(...totals), foulsPerGame: foulGames >= MIN_FOUL_GAMES ? +(foulTotal / foulGames).toFixed(1) : null, foulStatGames: foulGames, provenance: "warehouse" });
});
export default router;
