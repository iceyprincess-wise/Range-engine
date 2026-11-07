const fs = require("fs"), path = require("path");
const storePath = path.join(__dirname, "..", "data", "store.json");
if (!fs.existsSync(storePath)) { console.error("missing store:", storePath); process.exit(1); }
const s = JSON.parse(fs.readFileSync(storePath, "utf8"));
const g = Object.values(s.games || {});
// Usage: node h2h-probe.cjs [home-substring] [away-substring]  (defaults: portland fever)
const homeNeed = (process.argv[2] || "portland").toLowerCase();
const awayNeed = (process.argv[3] || "fever").toLowerCase();
const has = (e, n) => (e.homeTeam?.name + " " + e.awayTeam?.name).toLowerCase().includes(n);
const hits = g.filter(e => has(e, homeNeed) && has(e, awayNeed));
const scored = hits.filter(e => e.homeScore?.current != null && e.awayScore?.current != null);
console.log(homeNeed + " x " + awayNeed + " meetings banked:", hits.length, "| scored:", scored.length, "| unscored skipped:", hits.length - scored.length);
for (const e of scored.sort((a, b) => (a.startTimestamp ?? 0) - (b.startTimestamp ?? 0))) {
  const h = e.homeScore?.current, a = e.awayScore?.current;
  console.log(new Date((e.startTimestamp ?? 0) * 1000).toISOString(), "|",
    e.homeTeam?.name, h, "-", a, e.awayTeam?.name, "| total", h + a,
    "|", e.status?.type, "| id", e.id);
}
