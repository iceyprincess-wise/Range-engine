import { build } from "esbuild";
import path from "node:path";

const here = path.dirname(new URL(import.meta.url).pathname);
const out = path.join(here, ".dna-bundle.mjs");
await build({
  entryPoints: [path.resolve(here, "../../../lib/range-engine/src/leagueDna.ts")],
  bundle: true, platform: "node", format: "esm", outfile: out, logLevel: "silent",
});
const { getLeagueDNA } = await import("file://" + out);

const names = ["WNBA", "The Basketball Tournament", "WNBA Preseason", "Big V", "LDA", "LDB",
  "Lebanese Basketball League", "Uruguay LUB", "PBA Commissioner's Cup", "PBA Philippine Cup",
  "PBA Governors' Cup", "Divisional Tercera de Ascenso", "CBI U15 Fem", "WASL West Asia",
  "U18 Paulista", "WNBA Commissioner\u2019s Cup", "Chile LNB"];

for (const n of names) {
  const d = getLeagueDNA(n);
  console.log(
    n.padEnd(30),
    "key=" + String(d.key).padEnd(18),
    "PPG=" + String(d.proxyPPG).padStart(6),
    "w=" + String(d.weight ?? "hand").padStart(5),
    "n=" + String(d.sample ?? "-").padStart(4),
    "width=" + String(d.maxWidth).padStart(3),
    "buf=" + String(d.buffer).padStart(4),
    d.stale ? "STALE" : ""
  );
}
