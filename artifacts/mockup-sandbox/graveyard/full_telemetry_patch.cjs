const fs = require('fs');
const path = './src/components/mockups/range-engine/RangeEngine.tsx';

try {
  let content = fs.readFileSync(path, 'utf8');

  // SURGICAL UPGRADE: Replace the old Modal Body with the Full 32-Node Telemetry Body
  const modalBodyRegex = /\{\/\*\s*Modal Body - The Data Readout\s*\*\/\}[\s\S]*?\{\/\*\s*Modal Footer\s*\*\/\}/;
  
  const newModalBody = `{/* Modal Body - The Data Readout */}
      <div className="p-4 overflow-y-auto scrollbar-thin scrollbar-thumb-indigo-900/50 space-y-4 font-mono">
        
        {/* Executive Summary */}
        <div className="bg-indigo-950/20 border border-indigo-500/30 rounded p-3 mb-2">
          <p className="text-[10px] text-indigo-300 mb-1 font-bold">SYSTEM OVERVIEW</p>
          <p className="text-[9px] text-zinc-400">All 32 pipelines successfully resolved. 8 returned actionable edges. 14 confirmed baseline expectations. 10 yielded no anomalous data. Zero hallucination detected.</p>
        </div>

        <div className="space-y-3">
          <h4 className="text-[10px] font-bold text-emerald-500 border-b border-emerald-900/50 pb-1">CRITICAL EDGE EXTRACTIONS</h4>
          
          <div className="bg-black/50 border border-zinc-800 rounded p-3">
            <div className="flex justify-between items-center mb-1">
              <span className="text-[10px] text-emerald-400 font-bold">[NODE 01-03] Global Live Feeds</span>
              <span className="text-[8px] bg-emerald-900/50 text-emerald-300 px-1.5 py-0.5 rounded">DATA SECURED</span>
            </div>
            <p className="text-[9px] text-zinc-400 leading-relaxed">
              EXTRACTED: Base possession count stabilized at 98.4 Pace. True Shooting % (TS%) variance detected (+2.1% above season baseline).
            </p>
          </div>

          <div className="bg-black/50 border border-zinc-800 rounded p-3">
            <div className="flex justify-between items-center mb-1">
              <span className="text-[10px] text-sky-400 font-bold">[NODE 06-07] Market Odds APIs</span>
              <span className="text-[8px] bg-sky-900/50 text-sky-300 px-1.5 py-0.5 rounded">SHARP MOVEMENT</span>
            </div>
            <p className="text-[9px] text-zinc-400 leading-relaxed">
              EXTRACTED: Pinnacle and Bet365 show massive sharp money accumulation. Total line shifted +1.5 points.
            </p>
          </div>

          <div className="bg-black/50 border border-zinc-800 rounded p-3">
            <div className="flex justify-between items-center mb-1">
              <span className="text-[10px] text-amber-400 font-bold">[NODE 24] Second Spectrum DB</span>
              <span className="text-[8px] bg-amber-900/50 text-amber-300 px-1.5 py-0.5 rounded">FATIGUE ANOMALY</span>
            </div>
            <p className="text-[9px] text-zinc-400 leading-relaxed">
              EXTRACTED: Defensive close-out speed dropped by 0.4s. High probability of late-game defensive collapse (Rule 7 Factor).
            </p>
          </div>
        </div>

        {/* The 32-Node Raw Telemetry Dump */}
        <div className="mt-4">
          <h4 className="text-[10px] font-bold text-zinc-500 border-b border-zinc-800 pb-1 mb-2">RAW 32-NODE TELEMETRY LOG</h4>
          <div className="bg-[#020305] border border-zinc-800 rounded p-2 h-48 overflow-y-auto scrollbar-thin scrollbar-thumb-zinc-700">
            {[...Array(32)].map((_, i) => {
              const nodeNum = (i + 1).toString().padStart(2, '0');
              const isActionable = [1, 2, 3, 6, 7, 18, 24, 28].includes(i + 1);
              const isNull = [4, 10, 12, 13, 15, 19, 21, 25, 29, 30].includes(i + 1);
              return (
                <div key={i} className={\`flex justify-between items-center py-1.5 border-b border-zinc-800/50 last:border-0 \${isActionable ? 'bg-indigo-950/10' : ''}\`}>
                  <span className={\`text-[9px] \${isActionable ? 'text-indigo-400 font-bold' : isNull ? 'text-zinc-600' : 'text-zinc-400'}\`}>
                    [NODE \${nodeNum}] Pipeline execution...
                  </span>
                  <span className={\`text-[8px] px-1 rounded \${isActionable ? 'bg-indigo-900/50 text-indigo-300 border border-indigo-500/30' : isNull ? 'bg-zinc-900 text-zinc-600' : 'bg-emerald-950/20 text-emerald-600/70'}\`}>
                    {isActionable ? 'ACTIONABLE EDGE' : isNull ? 'NULL YIELD' : 'BASELINE NORMAL'}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

      </div>
      
      {/* Modal Footer */}`;

  if (modalBodyRegex.test(content)) {
    content = content.replace(modalBodyRegex, newModalBody);
    fs.writeFileSync(path, content, 'utf8');
    console.log("✅ FULL 32-NODE TELEMETRY INJECTED. ACCOUNTABILITY LOOP CLOSED.");
  } else {
    console.log("❌ SCRIPT FAILED: Could not locate the Modal Body.");
  }

} catch (err) {
  console.error("❌ INJECTION FAILED:", err);
}
