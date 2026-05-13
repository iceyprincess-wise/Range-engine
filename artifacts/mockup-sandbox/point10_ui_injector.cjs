const fs = require('fs');
const path = './src/components/mockups/range-engine/RangeEngine.tsx';

try {
  let content = fs.readFileSync(path, 'utf8');

  // Pre-flight check to prevent double injection
  if (content.includes('DEEP SCAN INTELLIGENCE UI')) {
    console.log("⚠️ DEEP SCAN UI ALREADY DETECTED. ABORTING TO PREVENT DUPLICATION.");
    process.exit(0);
  }

  const uiBlock = `
{/* --- DEEP SCAN INTELLIGENCE UI --- */}
{(homeTeam && awayTeam) && (
  <div className="w-full bg-slate-900/50 border border-indigo-500/20 rounded-xl p-4 mb-4 flex flex-col gap-3">
    <div className="flex justify-between items-center">
      <h4 className="text-xs font-black tracking-widest text-indigo-400 uppercase">
        Deep Scan Intelligence Active
      </h4>
      <span className="text-[10px] text-slate-400 font-mono">
        1,000,000+ Sources
      </span>
    </div>

    {/* The 9 Node Glow Indicators */}
    <div className="flex justify-between items-center w-full px-1">
      {[...Array(9)].map((_, i) => (
        <div 
          key={i} 
          className={\`h-2 w-2 rounded-full transition-all duration-300 \${
            research.node >= i 
              ? 'bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.8)] scale-110' 
              : 'bg-slate-700 opacity-30'
          }\`}
        />
      ))}
    </div>

    {/* Data Readout & Micro-Jitter */}
    <div className="flex flex-col mt-1">
      <div className="flex justify-between text-xs font-mono">
        <span className={\`\${research.done ? 'text-green-400' : 'text-indigo-300 animate-pulse'}\`}>
          {research.scanning ? "Real-time aggregation active. Delay for accuracy..." : research.done ? "SCAN COMPLETE" : "AWAITING PARAMS..."}
        </span>
        <span className={research.scanning && research.progress === 99 ? 'text-yellow-400 font-bold' : research.done ? 'text-green-400' : 'text-slate-500'}>
          {research.progress}%
        </span>
      </div>
      
      {/* Dynamic Cameo Stream */}
      <div className="text-[10px] text-slate-500 font-mono mt-1 h-3 overflow-hidden">
        {research.cameo}
      </div>
      
      {/* Micro-Jitter Confidence Readout */}
      {research.node >= 0 && (
        <div className="text-[10px] text-right text-indigo-400/70 font-mono mt-1">
          CONFIDENCE INTERVAL: <span className={research.progress === 99 ? 'text-yellow-400 font-bold' : ''}>{research.confidence}%</span>
        </div>
      )}
    </div>
  </div>
)}
{/* --- END DEEP SCAN INTELLIGENCE UI --- */}
`;

  // Locate the precise injection point right above the Execute Analysis button
  const targetRegex = /(<button\s+onClick=\{handleAnalyze\})/g;
  
  if (!targetRegex.test(content)) {
    throw new Error("CRITICAL: Target 'handleAnalyze' button not found. Aborting injection.");
  }

  // Inject the block exactly before the button
  content = content.replace(targetRegex, uiBlock + '$1');

  fs.writeFileSync(path, content, 'utf8');
  console.log("✅ CLASSIFIED POINT 10 UI BLOCK INJECTED SUCCESSFULLY.");
} catch (err) {
  console.error("❌ UI INJECTION FAILED:", err);
}
