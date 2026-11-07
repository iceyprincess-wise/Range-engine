const fs = require("fs"), path = require("path");
const archivePath = path.join(__dirname, "..", "data", "analysis-archive-export.json");
if (!fs.existsSync(archivePath)) { console.error("missing archive export:", archivePath); process.exit(1); }
const x = JSON.parse(fs.readFileSync(archivePath, "utf8"));
const hist = x.history || [];
console.log("history entries:", hist.length, "| unique ids:", new Set(hist.map(h => h.id)).size);
for (const h of hist) {
  const r = h.result || {};
  console.log("=".repeat(72));
  console.log(`[${h.id}] ${h.date} analyzed ${h.timestamp} | KO ${h.koTime} | ${h.league}`);
  console.log(`${h.homeTeam} vs ${h.awayTeam} | ${h.bookmaker ?? ""}`);
  console.log(`range ${r.lb}-${r.hb} mid ${r.midpoint} | ${r.decision} | ${r.confidence}`);
  console.log(`reliability: ${r.reliability} — ${r.reliability_reason}`);
  console.log(`OUTCOME=${h.outcome} | actualTotal=${h.actualTotal ?? "-"} | ft=${JSON.stringify(h.ftScore ?? null)}`);
  console.log(`postMatch: ${h.postMatch ? JSON.stringify(h.postMatch).slice(0, 220) : "none"}`);
  console.log(`reval: req=${h.revalidationRequested ?? "-"} status=${h.revalidationStatus ?? "-"} msg=${h.lastRevalidationMsg ?? "-"}`);
  console.log(`homeSnap: ${JSON.stringify(h.homeInfoSnap ?? null).slice(0, 380)}`);
  console.log(`awaySnap: ${JSON.stringify(h.awayInfoSnap ?? null).slice(0, 380)}`);
}
