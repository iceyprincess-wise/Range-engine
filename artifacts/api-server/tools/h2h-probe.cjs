const fs = require("fs");
const s = JSON.parse(fs.readFileSync("data/store.json", "utf8"));
const g = Object.values(s.games || {});
const has = (e, n) => (e.homeTeam?.name + " " + e.awayTeam?.name).toLowerCase().includes(n);
const hits = g.filter(e => has(e, "portland") && (has(e, "fever") || has(e, "indiana")));
console.log("Portland x Indiana meetings banked:", hits.length);
for (const e of hits.sort((a, b) => (a.startTimestamp ?? 0) - (b.startTimestamp ?? 0))) {
  const h = e.homeScore?.current, a = e.awayScore?.current;
  console.log(new Date((e.startTimestamp ?? 0) * 1000).toISOString(), "|",
    e.homeTeam?.name, h, "-", a, e.awayTeam?.name, "| total", (h ?? 0) + (a ?? 0),
    "|", e.status?.type, "| id", e.id);
}
