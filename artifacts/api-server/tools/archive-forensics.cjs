const fs = require("fs"), path = require("path");
const p = path.join(__dirname, "..", "data", "analysis-archive-export.json");
if (!fs.existsSync(p)) { console.error("missing archive export:", p); process.exit(1); }
const x = JSON.parse(fs.readFileSync(p, "utf8"));
const hist = x.history || [], arch = x.archive || [];
console.log("exportedAt:", x.exportedAt, "| history:", hist.length, "| archive:", arch.length);

const keys = a => [...new Set(a.flatMap(e => Object.keys(e || {})))].join(",");
console.log("\nHISTORY keys:", keys(hist));
console.log("ARCHIVE keys:", keys(arch));

console.log("\n=== FIRST HISTORY ENTRY (structure sample) ===");
console.log(JSON.stringify(hist[0] ?? null).slice(0, 3000));

const g = (o, ...ks) => { for (const k of ks) { const v = k.split(".").reduce((a, b) => a?.[b], o); if (v !== undefined && v !== null) return v; } return "?"; };
console.log("\n=== COMPACT LEDGER ===");
for (const e of [...arch].sort((a, b) => String(g(a,"analyzedAt","createdAt","ts")).localeCompare(String(g(b,"analyzedAt","createdAt","ts"))))) {
  console.log([
    g(e, "analyzedAt", "createdAt", "ts", "date"),
    g(e, "league", "leagueName"),
    g(e, "matchup", "teams") !== "?" ? g(e, "matchup", "teams") : g(e, "homeTeam") + " v " + g(e, "awayTeam"),
    "line=" + g(e, "line", "betLine", "bookLine"),
    "pick=" + JSON.stringify(g(e, "pick", "recommendation", "verdict")).slice(0, 60),
    "range=" + JSON.stringify(g(e, "predictedRange", "finalRange", "range")).slice(0, 40),
    "final=" + JSON.stringify(g(e, "finalScore", "actualTotal", "settledTotal")).slice(0, 30),
    "outcome=" + g(e, "outcome"),
  ].join(" | "));
}
