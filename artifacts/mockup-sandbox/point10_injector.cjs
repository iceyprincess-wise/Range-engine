const fs = require('fs');
const path = './src/components/mockups/range-engine/RangeEngine.tsx';

try {
  let content = fs.readFileSync(path, 'utf8');

  // 1. SURGICAL UPGRADE: Add 'confidence' to state
  content = content.replace(
    /const \[research, setResearch\] = useState\(\{ scanning: false, progress: 0, node: -1, done: false, cameo: "" \}\);/g,
    'const [research, setResearch] = useState({ scanning: false, progress: 0, node: -1, done: false, cameo: "", confidence: "0.00" });'
  );

  // 2. SURGICAL UPGRADE: Replace flat timer with Asynchronous Node Waterfall & Micro-Jitter
  const oldEffectRegex = /useEffect\(\(\) => \{\s*let timeouts = \[\];\s*if \(homeTeam && awayTeam && !research\.done && !research\.scanning\) \{[\s\S]*?\} else if \(!homeTeam \|\| !awayTeam\) \{\s*setResearch\(\{ scanning: false, progress: 0, node: -1, done: false, cameo: "" \}\);\s*\}\s*\}, \[homeTeam, awayTeam\]\);/m;
  
  const newEffect = `useEffect(() => {
  let active = true;
  let timeouts = [];
  let jitterInterval;

  if (homeTeam && awayTeam && !research.done && !research.scanning) {
    const timer = setTimeout(() => {
      if (!active) return;
      
      const cameos = [
        "> [PING] api.flashscore.com/matches/live_feed...", 
        "> [SCRAPE] x.com/search?q=injury+report+live...", 
        "> [PULL] pinnacle.com/odds/market_depth_v2...", 
        "> [COMPUTE] internal_db: NEURAL_PATTERN_REC...", 
        "> [SYNC] sofascore.com/basketball/feed...", 
        "> [VERIFY] rotowire.com/nba/lineups_confirmed...", 
        "> [ANALYZE] 82games.com/advanced_stats_matrix...", 
        "> [AGGREGATE] reddit.com/r/sportsbook/sharp_money...", 
        "> [FINALIZING] DEEP_SCAN_MATRIX_AGGREGATION..." 
      ];

      setResearch(r => ({ ...r, scanning: true, progress: 0, node: 0, done: false, cameo: cameos[0], confidence: "0.00" }));

      const scheduleNode = (nodeIndex, delay, progressOverride = null, isJitter = false) => {
        timeouts.push(setTimeout(() => {
          if (!active) return;
          const progress = progressOverride || Math.min((nodeIndex + 1) * 11, 99);
          
          if (isJitter) {
             jitterInterval = setInterval(() => {
                if (!active) return;
                const jitterVal = (98 + Math.random() * 1.5).toFixed(2);
                setResearch(r => ({ ...r, node: nodeIndex, progress: 99, cameo: cameos[nodeIndex], confidence: jitterVal }));
             }, 75);
          } else {
             setResearch(r => ({ ...r, node: nodeIndex, progress, cameo: cameos[nodeIndex] }));
          }
        }, delay));
      };

      // The Asynchronous Waterfall
      scheduleNode(1, 150);
      scheduleNode(2, 500);
      scheduleNode(3, 900);
      
      // Node 4: Heavy Computation Stall (1.2s to 2.5s)
      const stall1 = 1200 + Math.random() * 1300; 
      scheduleNode(4, 900 + stall1);
      scheduleNode(5, 900 + stall1 + 400);
      scheduleNode(6, 900 + stall1 + 750);
      scheduleNode(7, 900 + stall1 + 1100);
      
      // Node 9: Micro-Jitter Stall at 99% for 1.5s
      const node9Time = 900 + stall1 + 1600;
      scheduleNode(8, node9Time, 99, true); 
      
      // Final 100% Unlock
      timeouts.push(setTimeout(() => {
         if (!active) return;
         clearInterval(jitterInterval);
         setResearch(r => ({ ...r, scanning: false, progress: 100, node: 8, done: true, cameo: "> 1,000,000+ SOURCES SECURED - 100% OK", confidence: "100.00" }));
      }, node9Time + 1500));

    }, 1200);
    timeouts.push(timer);
  } else if (!homeTeam || !awayTeam) {
    setResearch({ scanning: false, progress: 0, node: -1, done: false, cameo: "", confidence: "0.00" });
  }

  return () => {
    active = false;
    timeouts.forEach(clearTimeout);
    clearInterval(jitterInterval);
  };
}, [homeTeam, awayTeam]);`;

  content = content.replace(oldEffectRegex, newEffect);

  // 3. SURGICAL UPGRADE: Lock Execute button during scan
  content = content.replace(
    /disabled=\{\!homeTeam \|\| \!awayTeam \|\| \!overLow \|\| \!underHigh \|\| \!tipOff\}/g,
    'disabled={!homeTeam || !awayTeam || !overLow || !underHigh || !tipOff || research.scanning || !research.done}'
  );

  fs.writeFileSync(path, content, 'utf8');
  console.log("✅ POINT 10 ENGINE LOGIC INJECTED SUCCESSFULLY.");
} catch (err) {
  console.error("❌ INJECTION FAILED:", err);
}
