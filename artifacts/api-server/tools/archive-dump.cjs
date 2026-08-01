const fs = require("fs"), path = require("path");
const dir = path.join(process.cwd(), "data");
const predKeys = ["recommendation","pick","verdict","predictedRange","finalRange","range","betLine","line","confidence"];
const teamKeys = ["homeTeam","home","teams","matchup","fixture"];
const looksLikeAnalysis = o => o && typeof o === "object" && !Array.isArray(o)
  && predKeys.some(k => k in o) && teamKeys.some(k => k in o);
const found = [];
const walk = (v, src, depth) => {
  if (depth > 6 || !v) return;
  if (Array.isArray(v)) { v.forEach(x => walk(x, src, depth + 1)); return; }
  if (typeof v === "object") {
    if (looksLikeAnalysis(v)) { found.push({ src, entry: v }); return; }
    Object.values(v).forEach(x => walk(x, src, depth + 1));
  }
};
for (const f of fs.readdirSync(dir).filter(f => f.endsWith(".json"))) {
  try { walk(JSON.parse(fs.readFileSync(path.join(dir, f), "utf8")), f, 0); } catch {}
}
console.log("archive-like entries found:", found.length);
for (const { src, entry } of found.slice(0, 40)) {
  console.log("=".repeat(70));
  console.log("[" + src + "]");
  console.log(JSON.stringify(entry).slice(0, 1400));
}
