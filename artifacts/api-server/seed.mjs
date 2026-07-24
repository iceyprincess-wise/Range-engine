import fs from "node:fs";
const probe = JSON.parse(fs.readFileSync("probe.json", "utf8"));
const store = { teams: {}, games: {} };
store.teams["indiana fever"] = { id: 3452, name: "Indiana Fever" };
store.teams["chicago sky"] = { id: 35546, name: "Chicago Sky" };
let kept = 0;
for (const e of probe.events || []) {
  if (e?.id && e?.status?.type === "finished" && e.homeScore?.current != null) {
    store.games[e.id] = e; kept++;
  }
}
fs.mkdirSync("data", { recursive: true });
fs.writeFileSync("data/store.json", JSON.stringify(store));
console.log("seeded:", kept, "games,", Object.keys(store.teams).length, "teams");
