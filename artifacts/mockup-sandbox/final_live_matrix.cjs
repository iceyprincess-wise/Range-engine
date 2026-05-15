const fs = require('fs');
const targetPath = './src/components/mockups/range-engine/RangeEngine.tsx';

let code = fs.readFileSync(targetPath, 'utf8');

console.log('======================================================');
console.log(' ⚡ INITIATING FINAL SURGICAL STRIKE: LIVE BAR MATRIX');
console.log('======================================================\n');

// 1. Upgrade the API Engine to the Two-Stage Radar & Mapping System
const startMarker = '// ─── BASKETAPI LIVE ENGINE';
const endMarker = '// ──────────────────────────────────────────────';
const startIndex = code.indexOf(startMarker);
const endIndex = code.indexOf(endMarker) + endMarker.length;

if (startIndex !== -1 && endIndex !== -1) {
    const newEngine = `// ─── BASKETAPI LIVE ENGINE (FINAL MATRIX) ───
  const [liveStats, setLiveStats] = useState<any>(null);
  const [isFetchingLive, setIsFetchingLive] = useState(false);
  const [apiError, setApiError] = useState("");

  const triggerLiveSync = async () => {
    setIsFetchingLive(true);
    setApiError("");
    try {
      const hSearch = (homeTeam || "").toLowerCase();
      const aSearch = (awayTeam || "").toLowerCase();
      
      if (!hSearch || !aSearch) {
          throw new Error("Missing Teams: Please enter the Home and Away team names in the Analyzer first.");
      }

      // Step 1: Global Radar Scan
      const radarRes = await fetch('https://basketapi1.p.rapidapi.com/api/basketball/matches/live', {
        headers: {
          'x-rapidapi-key': 'f0f8830be9msh33c27594430acdbp174a46jsn212686e527a0', 
          'x-rapidapi-host': 'basketapi1.p.rapidapi.com'
        }
      });
      const radarText = await radarRes.text();
      if (!radarRes.ok) throw new Error(\`Radar Error: \${radarRes.status}\`);
      if (!radarText) throw new Error("API empty: No games are live globally right now.");
      
      const radarData = JSON.parse(radarText);
      
      // Target Lock (Fuzzy Match)
      const target = (radarData.events || []).find((e:any) => 
         e.homeTeam.name.toLowerCase().includes(hSearch) || 
         e.awayTeam.name.toLowerCase().includes(aSearch) ||
         hSearch.includes(e.homeTeam.name.toLowerCase())
      );

      if (!target) throw new Error(\`Target Lost: "\${homeTeam}" vs "\${awayTeam}" is not actively playing right now.\`);

      // Step 2: Deep-Dive Statistics Extraction
      const statsRes = await fetch(\`https://basketapi1.p.rapidapi.com/api/basketball/match/\${target.id}/statistics\`, {
        headers: {
          'x-rapidapi-key': 'f0f8830be9msh33c27594430acdbp174a46jsn212686e527a0', 
          'x-rapidapi-host': 'basketapi1.p.rapidapi.com'
        }
      });
      const statsText = await statsRes.text();
      if (!statsRes.ok) throw new Error(\`Stats Error: \${statsRes.status}\`);
      
      const statsData = JSON.parse(statsText);
      
      setLiveStats({ radar: target, stats: statsData });
      console.log("🔥 Live Matrix Connected & Mapped");
    } catch (err: any) {
      setApiError(err.message || "API Connection Failed");
      console.error(err);
    } finally {
      setIsFetchingLive(false);
    }
  };
  
  // Mathematical Extractor
  const getLiveStat = (key: string) => {
      if (!liveStats?.stats?.statistics?.[0]?.groups) return null;
      for (const g of liveStats.stats.statistics[0].groups) {
          const item = g.statisticsItems.find((i:any) => i.key === key);
          if (item) return item;
      }
      return null;
  };

  const LiveStatBar = ({ label, statKey }: { label: string, statKey: string }) => {
      const item = getLiveStat(statKey);
      if (!item) return (
          <div className="mb-3 opacity-50">
              <div className="flex justify-between text-[10px] font-mono text-zinc-500 mb-1">
                  <span>-</span><span className="uppercase tracking-widest text-emerald-500/30">{label}</span><span>-</span>
              </div>
              <div className="flex h-1.5 w-full bg-zinc-900 rounded-full overflow-hidden">
                  <div className="bg-emerald-900/50 w-[50%]"></div>
                  <div className="bg-red-900/50 w-[50%] ml-auto"></div>
              </div>
          </div>
      );

      let hVal = item.homeValue || 0;
      let aVal = item.awayValue || 0;
      let total = hVal + aVal;
      let hPct = total === 0 ? 50 : (hVal / total) * 100;
      let aPct = total === 0 ? 50 : (aVal / total) * 100;

      return (
          <div className="mb-3">
              <div className="flex justify-between text-[10px] font-mono text-zinc-200 mb-1">
                  <span>{item.home || hVal}</span>
                  <span className="uppercase tracking-widest text-emerald-400 font-bold">{label}</span>
                  <span>{item.away || aVal}</span>
              </div>
              <div className="flex h-1.5 w-full bg-zinc-900 rounded-full overflow-hidden">
                  <div className="bg-emerald-500 transition-all duration-1000 ease-out" style={{ width: \`\${hPct}%\` }}></div>
                  <div className="bg-red-600 transition-all duration-1000 ease-out" style={{ width: \`\${aPct}%\` }}></div>
              </div>
          </div>
      );
  };
  // ──────────────────────────────────────────────`;

    code = code.substring(0, startIndex) + newEngine + code.substring(endIndex);
    console.log('✅ STATUS: Two-Stage Fetch Engine & Mathematical UI Extractor Injected.');
}

// 2. Erase the Raw Dump Box
const dumpRegex = /\{liveStats && \([\s\S]*?<textarea[\s\S]*?\/>\s*<\/div>\s*\)\}/;
if (dumpRegex.test(code)) {
    code = code.replace(dumpRegex, '');
    console.log('✅ STATUS: Raw UI Dump Box removed for pristine layout.');
}

// 3. Mount the dynamic bars over the static ones
const staticBarsAnchor = /<div className="flex justify-between text-\[10px\] font-mono text-zinc-400 mb-1"><span>0\.0% \(0\/0\)<\/span><span className="uppercase tracking-widest text-emerald-500\/50">Field Goals<\/span>[\s\S]*?(?=<\/div>\s*<\/div>\s*<\/div>)/;

// Just target the general stats area to inject the dynamic components safely
const replaceTarget = '<span>0.0% (0/0)</span><span className="uppercase tracking-widest text-emerald-500/50">Field Goals</span><span>0.0% (0/0)</span></div><div className="flex h-1.5 w-full bg-zinc-900 rounded-full overflow-hidden"><div className="bg-emerald-500 w-[50%]"></div><div className="bg-red-600 w-[50%] ml-auto"></div></div></div>';

if (code.includes(replaceTarget)) {
    // Replace the first hardcoded chunk with our dynamic React components
    code = code.replace(replaceTarget, `</div>
        <div className="mt-4 border border-zinc-800/50 p-4 rounded bg-black/40">
            <LiveStatBar label="Field Goals" statKey="fieldGoalsScored" />
            <LiveStatBar label="2 Points" statKey="twoPointersScored" />
            <LiveStatBar label="3 Points" statKey="threePointersScored" />
            <LiveStatBar label="Free Throws" statKey="freeThrowsScored" />
            <div className="my-4 border-t border-zinc-800/50"></div>
            <LiveStatBar label="Rebounds" statKey="rebounds" />
            <LiveStatBar label="Fouls" statKey="totalFouls" />
        </div>
    <div className="hidden">`); 
    // Hiding the rest of the old hardcoded bars beneath it to prevent UI clutter without breaking JSX tags
    console.log('✅ STATUS: Dynamic Live Bars Successfully Anchored to UI.');
}

fs.writeFileSync(targetPath, code, 'utf8');
console.log('\n✅ STATUS: TOP-NOTCH LIVE MATRIX DEPLOYED. SYSTEM SECURED.');
console.log('======================================================\n');
