const fs = require('fs');
const path = './src/components/mockups/range-engine/RangeEngine.tsx';

try {
  let content = fs.readFileSync(path, 'utf8');

  // The precise Ghost Engine target
  const oldLogicRegex = /useEffect\(\(\) => \{\s*let timeouts = \[\];\s*if \(homeTeam && awayTeam && !research\.done && !research\.scanning\) \{[\s\S]*?\}, \[homeTeam, awayTeam\]\);/m;

  const newEffect = `useEffect(() => {
  let active = true;
  let timeouts = [];
  let jitterInterval;

  if (homeTeam && awayTeam && !research.done && !research.scanning) {
    const timer = setTimeout(() => {
      if (!active) return;
      
      const cameos = [
        "> [PING] api.flashscore.com/matches/live_feed... 200 OK", 
        "> [SCRAPE] x.com/search?q=injury+report+live... 200 OK", 
        "> [PULL] pinnacle.com/odds/market_depth_v2... 200 OK", 
        "> [COMPUTE] internal_db: NEURAL_PATTERN_REC... 200 OK", 
        "> [SYNC] sofascore.com/basketball/feed... 200 OK", 
        "> [VERIFY] rotowire.com/nba/lineups_confirmed... 200 OK", 
        "> [ANALYZE] 82games.com/advanced_stats_matrix... 200 OK", 
        "> [AGGREGATE] reddit.com/r/sportsbook/sharp_money... 200 OK", 
        "> [FINALIZING] DEEP_SCAN_MATRIX_AGGREGATION... 200 OK" 
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
      
      // Node 4: Heavy Computation Stall
      const stall1 = 1200 + Math.random() * 1300; 
      scheduleNode(4, 900 + stall1);
      scheduleNode(5, 900 + stall1 + 400);
      scheduleNode(6, 900 + stall1 + 750);
      scheduleNode(7, 900 + stall1 + 1100);
      
      // Node 9: Micro-Jitter Stall at 99%
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

  if (oldLogicRegex.test(content)) {
    content = content.replace(oldLogicRegex, newEffect);
    fs.writeFileSync(path, content, 'utf8');
    console.log("✅ GHOST ENGINE LOGIC DESTROYED. TRUE 9-NODE WATERFALL ACTIVE.");
  } else {
    console.log("❌ REGEX FAILED: Ghost logic not found. Target might be formatted differently.");
  }
} catch (err) {
  console.error("❌ SCRIPT FAILED:", err);
}
