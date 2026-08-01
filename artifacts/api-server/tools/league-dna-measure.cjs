const fs = require("fs");
const s = JSON.parse(fs.readFileSync("data/store.json", "utf8"));
const games = Object.values(s.games || {});
const key = e => e?.tournament?.uniqueTournament?.name || e?.tournament?.name || "UNKNOWN";
const num = v => (typeof v === "number" && isFinite(v) ? v : null);
const hs = e => num(e?.homeScore?.current);
const as = e => num(e?.awayScore?.current);

let dup = 0, noScore = 0;
const seen = new Set(), byLeague = {};
for (const e of games) {
  if (seen.has(e.id)) { dup++; continue; }
  seen.add(e.id);
  if (hs(e) === null || as(e) === null) { noScore++; continue; }
  const k = key(e);
  (byLeague[k] = byLeague[k] || []).push(e);
}
console.log("store:", games.length, "| dup:", dup, "| missing final score:", noScore,
            "| SCORED:", games.length - dup - noScore);
console.log("");

const mean = a => a.reduce((x, v) => x + v, 0) / a.length;
const sd = a => { const m = mean(a); return Math.sqrt(a.reduce((x, v) => x + (v - m) ** 2, 0) / (a.length > 1 ? a.length - 1 : 1)); };
const q = (a, p) => { const b = [...a].sort((x, y) => x - y); const i = (b.length - 1) * p, lo = Math.floor(i), hi = Math.ceil(i); return lo === hi ? b[lo] : b[lo] + (b[hi] - b[lo]) * (i - lo); };
const r1 = v => Math.round(v * 10) / 10;

for (const [league, g] of Object.entries(byLeague).sort((a, b) => b[1].length - a[1].length)) {
  const totals = g.map(e => hs(e) + as(e));
  const homes = g.map(hs), aways = g.map(as);
  const margins = g.map(e => Math.abs(hs(e) - as(e)));
  const qtr = [];
  for (const e of g) for (const p of ["period1", "period2", "period3", "period4"]) {
    const h = num(e?.homeScore?.[p]), a = num(e?.awayScore?.[p]);
    if (h !== null && a !== null) qtr.push(h + a);
  }
  const ot = g.filter(e => num(e?.homeScore?.overtime) !== null || num(e?.awayScore?.overtime) !== null).length;
  console.log(JSON.stringify({
    league, n: g.length,
    lastGame: new Date(Math.max(...g.map(e => e.startTimestamp || 0)) * 1000).toISOString().slice(0, 10),
    avgTotal: r1(mean(totals)), sdTotal: r1(sd(totals)),
    p10: r1(q(totals, 0.1)), median: r1(q(totals, 0.5)), p90: r1(q(totals, 0.9)),
    min: Math.min(...totals), max: Math.max(...totals),
    avgHomePts: r1(mean(homes)), avgAwayPts: r1(mean(aways)),
    homeEdge: r1(mean(homes) - mean(aways)),
    homeWinPct: r1(100 * g.filter(e => hs(e) > as(e)).length / g.length),
    avgMargin: r1(mean(margins)),
    blowout20Pct: r1(100 * margins.filter(m => m >= 20).length / g.length),
    otPct: r1(100 * ot / g.length),
    avgQuarterTotal: qtr.length ? r1(mean(qtr)) : null, qtrSamples: qtr.length
  }));
}
