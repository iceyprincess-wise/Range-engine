const fs = require('fs');
const path = './src/components/mockups/range-engine/RangeEngine.tsx';

try {
  let content = fs.readFileSync(path, 'utf8');

  // 1. SURGICAL UPGRADE: The Extended Logic Timeline
  const logicRegex = /useEffect\(\(\) => \{\s*let active = true;\s*let timeouts = \[\];\s*let jitterInterval;[\s\S]*?\}, \[homeTeam, awayTeam\]\);/m;
  
  const newEffect = `useEffect(() => {
  let active = true;
  let timeouts = [];
  let jitterInterval;

  if (homeTeam && awayTeam) {
    // STRICT RESET: Forces the engine to completely reset if teams change
    setResearch(r => ({ ...r, scanning: false, progress: 0, node: -1, done: false, cameo: "", confidence: "0.00" }));
    
    const timer = setTimeout(() => {
      if (!active) return;
      
      setResearch(r => ({ ...r, scanning: true, progress: 0, node: 0, done: false, cameo: "> INITIATING 1,000,000+ SOURCE AGGREGATION...", confidence: "0.00" }));

      const scheduleNode = (nodeIndex, delay, progressOverride = null, isJitter = false) => {
        timeouts.push(setTimeout(() => {
          if (!active) return;
          const progress = progressOverride || Math.min((nodeIndex + 1) * 11, 99);
          
          if (isJitter) {
             jitterInterval = setInterval(() => {
                if (!active) return;
                const jitterVal = (98 + Math.random() * 1.5).toFixed(2);
                setResearch(r => ({ ...r, node: nodeIndex, progress: 99, cameo: "> RESOLVING NEURAL CONFLICTS...", confidence: jitterVal }));
             }, 75);
          } else {
             setResearch(r => ({ ...r, node: nodeIndex, progress, cameo: \`> PINGING SECURE NODE \${nodeIndex}...\` }));
          }
        }, delay));
      };

      // Phase 1: Initial Hookups (Slower)
      scheduleNode(1, 800);
      scheduleNode(2, 2000);
      scheduleNode(3, 3500);
      
      // Phase 2: The Deep Scrape Stall (Massive 4 to 6 second pause)
      const stall1 = 4000 + Math.random() * 2000; 
      scheduleNode(4, 3500 + stall1);
      scheduleNode(5, 3500 + stall1 + 1200);
      scheduleNode(6, 3500 + stall1 + 2400);
      scheduleNode(7, 3500 + stall1 + 3600);
      
      // Phase 3: The Agonizing Micro-Jitter (Holds at 99% for 4.5 seconds)
      const node9Time = 3500 + stall1 + 5000;
      scheduleNode(8, node9Time, 99, true); 
      
      // Phase 4: Final Unlock
      timeouts.push(setTimeout(() => {
         if (!active) return;
         clearInterval(jitterInterval);
         setResearch(r => ({ ...r, scanning: false, progress: 100, node: 8, done: true, cameo: "> 1,000,000+ SOURCES SECURED - 100% OK", confidence: "100.00" }));
      }, node9Time + 4500));

    }, 1500); // 1.5s debounce before scan starts
    timeouts.push(timer);
  } else {
    setResearch({ scanning: false, progress: 0, node: -1, done: false, cameo: "", confidence: "0.00" });
  }

  return () => {
    active = false;
    timeouts.forEach(clearTimeout);
    clearInterval(jitterInterval);
  };
}, [homeTeam, awayTeam]);`;

  // 2. SURGICAL UPGRADE: The 32-Node Phantom Terminal UI
  const uiRegex = /\{\/\*\s*---\s*DEEP SCAN INTELLIGENCE UI\s*---\s*\*\/\}[\s\S]*?\{\/\*\s*---\s*END DEEP SCAN INTELLIGENCE UI\s*---\s*\*\/\}/;
  
  const newUI = `
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

    {/* The 9 Primary Root Nodes */}
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

    {/* The Heavyweight Dynamic URL Terminal (32 Sources) */}
    <div className="bg-black/80 rounded p-2 border border-indigo-900/40 h-[140px] overflow-hidden relative mt-1 flex flex-col">
      <div className="absolute top-0 left-0 w-full h-4 bg-gradient-to-b from-black/80 to-transparent z-10 pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 w-full h-4 bg-gradient-to-t from-black/80 to-transparent z-10 pointer-events-none"></div>
      
      <ul className="text-[8px] text-zinc-500 space-y-1.5 font-mono overflow-y-auto scrollbar-none pb-4 pt-2">
        {[
          "https://www.flashscore.com/basketball/", "https://www.sofascore.com/basketball/", "https://www.basketball-reference.com/",
          "Team Official Social Handles (Lineups)", "Local Beat Reporter Live Feeds", "Pinnacle Market Odds API",
          "Bet365 Line Movement Tracker", "Internal DB: TEAM_MATCHUP_HISTORY", "Internal DB: NEURAL_AGGREGATION_MATRIX",
          "https://www.espn.com/nba/stats", "https://stats.nba.com/advanced", "https://www.rotowire.com/nba/news",
          "https://twitter.com/search?q=injury+report", "https://www.reddit.com/r/sportsbook", "https://www.covers.com/sports/nba/matchups",
          "https://www.oddsshark.com/nba/computer-picks", "https://hoopshype.com/rumors/", "https://www.actionnetwork.com/nba",
          "https://basketball.realgm.com/", "https://cleaningtheglass.com/stats/", "https://dunksandthrees.com/",
          "https://www.82games.com/", "Synergy Sports Tech API (Root Access)", "Second Spectrum Movement DB",
          "Vegas Insider Line Movement", "DraftKings API Endpoint", "FanDuel Odds XML Feed", "BetMGM Sharp Money Tracker",
          "Offshore Market Consensus Node", "Global Weather APIs (Arena Conditions)", "Referee Assignment Database", "Player Prop Edge Scanner"
        ]
        .slice(0, Math.max(1, Math.floor((research.progress / 100) * 32)))
        .reverse()
        .map((url, i, arr) => (
          <li key={url} className="flex items-center justify-between transition-all duration-300">
            <span className={i === 0 && !research.done ? 'text-indigo-300 animate-pulse' : 'text-zinc-500'}>[NODE {(arr.length - i).toString().padStart(2, '0')}] {url}</span> 
            <span className={i === 0 && !research.done ? 'text-amber-400' : 'text-emerald-500 font-bold'}>
              {i === 0 && !research.done ? 'SYNC...' : '200 OK'}
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

  if (logicRegex.test(content) && uiRegex.test(content)) {
    content = content.replace(logicRegex, newEffect);
    content = content.replace(uiRegex, newUI.trim());
    fs.writeFileSync(path, content, 'utf8');
    console.log("✅ V4 HEAVYWEIGHT WATERFALL INJECTED. SUSPENSE DELAYS ACTIVE.");
  } else {
    console.error("❌ FAILED TO LOCATE TARGETS. Ensure previous injections were not modified manually.");
  }
} catch (err) {
  console.error("❌ SCRIPT FAILED:", err);
}
