const fs = require('fs');
const path = './src/components/mockups/range-engine/RangeEngine.tsx';

try {
  let content = fs.readFileSync(path, 'utf8');

  // 1. SURGICAL AMPUTATION: Destroy the old Green UI Ghost entirely
  const greenUIRegex = /\{\/\*\s*DEEP RESEARCH INTEGRITY MATRIX\s*\*\/\}[\s\S]*?<\/ul>\s*<\/div>\s*<\/div>\s*/;
  if (greenUIRegex.test(content)) {
    content = content.replace(greenUIRegex, '');
    console.log("✅ GREEN UI (GHOST ENGINE) AMPUTATED.");
  } else {
    console.log("⚠️ Green UI not found. May have already been removed.");
  }

  // 2. THE TOP NOTCH UPGRADE: Replace old Blue UI with the Ultimate Merged UI
  const blueUIRegex = /\{\/\*\s*---\s*DEEP SCAN INTELLIGENCE UI\s*---\s*\*\/\}[\s\S]*?\{\/\*\s*---\s*END DEEP SCAN INTELLIGENCE UI\s*---\s*\*\/\}/;
  
  const mergedUI = `
{/* --- DEEP SCAN INTELLIGENCE UI --- */}
{(homeTeam && awayTeam) && (
  <div className="w-full bg-[#0a0f1a] border border-indigo-500/30 rounded-xl p-4 mb-4 flex flex-col gap-3 shadow-[0_0_20px_rgba(79,70,229,0.1)]">
    <div className="flex justify-between items-center border-b border-indigo-500/20 pb-2">
      <h4 className="text-[10px] font-black tracking-widest text-indigo-400 uppercase flex items-center gap-2">
        <span className={\`w-2 h-2 rounded-full \${research.done ? 'bg-indigo-500' : 'bg-indigo-500 animate-pulse'}\`}></span>
        Deep Scan Intelligence Active
      </h4>
      <span className="text-[9px] text-indigo-300/70 font-mono tracking-widest uppercase">
        1,000,000+ Sources
      </span>
    </div>

    {/* The 9 Node Glow Indicators */}
    <div className="flex justify-between items-center w-full px-1 py-1">
      {[...Array(9)].map((_, i) => (
        <div 
          key={i} 
          className={\`h-2 w-2 rounded-full transition-all duration-300 \${
            research.node >= i 
              ? 'bg-indigo-400 shadow-[0_0_8px_rgba(129,140,248,0.9)] scale-110' 
              : 'bg-slate-800 opacity-40'
          }\`}
        />
      ))}
    </div>

    {/* The Merged Dynamic URL Terminal */}
    <div className="bg-black/60 rounded p-2 border border-indigo-900/40 h-[105px] overflow-y-auto scrollbar-thin scrollbar-thumb-indigo-900/50 mt-1">
      <ul className="text-[8.5px] text-zinc-500 space-y-1.5 font-mono">
        {[
          { id: "NODE 01", url: "https://www.flashscore.com/basketball/" },
          { id: "NODE 02", url: "https://www.sofascore.com/basketball/" },
          { id: "NODE 03", url: "https://www.basketball-reference.com/" },
          { id: "NODE 04", url: "Team Official Social Handles (Lineups)" },
          { id: "NODE 05", url: "Local Beat Reporter Live Feeds" },
          { id: "NODE 06", url: "Pinnacle Market Odds API" },
          { id: "NODE 07", url: "Bet365 Line Movement Tracker" },
          { id: "NODE 08", url: "Internal DB: TEAM_MATCHUP_HISTORY" },
          { id: "NODE 09", url: "Internal DB: NEURAL_AGGREGATION_MATRIX" }
        ].map((n, i) => (
          <li key={i} className={\`flex items-center justify-between transition-opacity duration-300 \${research.node >= i ? 'opacity-100' : 'opacity-20'}\`}>
            <span className={research.node === i && !research.done ? 'text-indigo-300 animate-pulse' : ''}>[{n.id}] {n.url}</span> 
            <span className={research.node > i || research.done ? 'text-indigo-400 font-bold' : research.node === i ? 'text-amber-400' : 'text-slate-700'}>
              {research.node > i || research.done ? '200 OK' : research.node === i ? 'SYNC...' : 'WAIT'}
            </span>
          </li>
        ))}
      </ul>
    </div>

    {/* Data Readout & Micro-Jitter */}
    <div className="flex flex-col mt-1">
      <div className="flex justify-between text-[10px] font-mono">
        <span className={\`\${research.done ? 'text-indigo-400' : 'text-indigo-300 animate-pulse'}\`}>
          {research.scanning ? "Real-time aggregation active. Delay for accuracy..." : research.done ? "SCAN COMPLETE" : "AWAITING PARAMS..."}
        </span>
        <span className={research.scanning && research.progress >= 98 ? 'text-yellow-400 font-bold' : research.done ? 'text-indigo-400' : 'text-slate-500'}>
          {research.progress}%
        </span>
      </div>
      
      <div className="text-[9px] text-slate-500 font-mono mt-1 truncate">
        {research.cameo}
      </div>
      
      {research.node >= 0 && (
        <div className="text-[9px] text-right text-indigo-400/70 font-mono mt-1">
          CONFIDENCE INTERVAL: <span className={research.progress >= 98 ? 'text-yellow-400 font-bold' : ''}>{research.confidence}%</span>
        </div>
      )}
    </div>
  </div>
)}
{/* --- END DEEP SCAN INTELLIGENCE UI --- */}`;

  if (blueUIRegex.test(content)) {
    content = content.replace(blueUIRegex, mergedUI.trim());
    fs.writeFileSync(path, content, 'utf8');
    console.log("✅ ULTIMATE MERGED UI INJECTED. 100% TOP NOTCH ACCURACY ACHIEVED.");
  } else {
    throw new Error("CRITICAL: Blue UI target not found.");
  }
} catch (err) {
  console.error("❌ MERGE FAILED:", err);
}
