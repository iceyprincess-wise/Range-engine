const fs = require('fs');
const path = './src/components/mockups/range-engine/RangeEngine.tsx';

try {
  let content = fs.readFileSync(path, 'utf8');

  // 1. SURGICAL UPGRADE: Inject the Report State
  const stateRegex = /(const \[research, setResearch\] = useState\[\^;\]+;|\n\s*const \[research, setResearch\] = useState\(\{[\s\S]*?\}\);)/;
  if (!content.includes('isReportOpen')) {
    content = content.replace(
      /(const \[research, setResearch\] = useState\(\{[\s\S]*?\}\);)/,
      '$1\n  const [isReportOpen, setIsReportOpen] = useState(false);'
    );
  }

  // 2. SURGICAL UPGRADE: Inject the View Report Button inside the Blue UI
  const buttonRegex = /(CONFIDENCE INTERVAL: <span className=\{research\.progress >= 98 \? 'text-yellow-400 font-bold' : ''\}>\{research\.confidence\}%<\/span>\n\s*<\/div>\n\s*\)\}\n\s*<\/div>)/;
  
  const buttonBlock = `$1\n      {research.done && (
        <button 
          onClick={() => setIsReportOpen(true)} 
          className="mt-3 w-full py-2 bg-indigo-600/20 hover:bg-indigo-600/40 border border-indigo-500/50 rounded text-[10px] text-indigo-300 font-bold tracking-widest uppercase transition-all duration-300 flex justify-center items-center gap-2"
        >
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
          View Classified Node Report
        </button>
      )}`;
  
  if (!content.includes('View Classified Node Report')) {
    content = content.replace(buttonRegex, buttonBlock);
  }

  // 3. SURGICAL UPGRADE: Inject the Top Notch Modal UI
  const modalRegex = /(\{\/\*\s*---\s*END DEEP SCAN INTELLIGENCE UI\s*---\s*\*\/\})/;
  
  const modalBlock = `$1

{/* --- CLASSIFIED REPORT MODAL --- */}
{isReportOpen && (
  <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
    <div className="bg-[#05080f] border border-indigo-500/50 rounded-xl w-full max-w-lg max-h-[85vh] flex flex-col shadow-[0_0_50px_rgba(79,70,229,0.15)] relative overflow-hidden">
      
      {/* Modal Header */}
      <div className="bg-indigo-950/40 border-b border-indigo-500/30 p-4 flex justify-between items-center">
        <div>
          <h3 className="text-xs font-black tracking-widest text-indigo-400 uppercase flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_#10b981]"></span>
            Post-Scan Extraction Report
          </h3>
          <p className="text-[9px] text-zinc-500 font-mono mt-1">1,000,000+ SOURCES COMPUTED // 100% ACCURACY LOCK</p>
        </div>
        <button onClick={() => setIsReportOpen(false)} className="text-zinc-500 hover:text-red-400 transition">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
        </button>
      </div>

      {/* Modal Body - The Data Readout */}
      <div className="p-4 overflow-y-auto scrollbar-thin scrollbar-thumb-indigo-900/50 space-y-3 font-mono">
        
        <div className="bg-black/50 border border-zinc-800 rounded p-3">
          <div className="flex justify-between items-center mb-1">
            <span className="text-[10px] text-emerald-400 font-bold">[NODE 01-03] Global Live Feeds</span>
            <span className="text-[8px] bg-emerald-900/50 text-emerald-300 px-1.5 py-0.5 rounded">DATA SECURED</span>
          </div>
          <p className="text-[9px] text-zinc-400 leading-relaxed">
            EXTRACTED: Base possession count stabilized at 98.4 Pace. True Shooting % (TS%) variance detected (+2.1% above season baseline). Free throw attempt rate increasing.
          </p>
        </div>

        <div className="bg-black/50 border border-zinc-800 rounded p-3">
          <div className="flex justify-between items-center mb-1">
            <span className="text-[10px] text-zinc-300 font-bold">[NODE 06-07] Market Odds APIs</span>
            <span className="text-[8px] bg-sky-900/50 text-sky-300 px-1.5 py-0.5 rounded">SHARP MOVEMENT</span>
          </div>
          <p className="text-[9px] text-zinc-400 leading-relaxed">
            EXTRACTED: Pinnacle and Bet365 show massive sharp money accumulation. Total line shifted +1.5 points in the last 14 minutes. Heavy volume flagged on the OVER.
          </p>
        </div>

        <div className="bg-black/50 border border-zinc-800 rounded p-3">
          <div className="flex justify-between items-center mb-1">
            <span className="text-[10px] text-zinc-500 font-bold opacity-70">[NODE 12-13] X/Reddit Injury Scrapes</span>
            <span className="text-[8px] bg-zinc-800 text-zinc-400 px-1.5 py-0.5 rounded opacity-70">NO DATA YIELD</span>
          </div>
          <p className="text-[9px] text-zinc-500 leading-relaxed opacity-70">
            NULL: Scan of 14,200 recent social queries returned no severe rotational alerts, late scratches, or locker room leaks. Roster health stable.
          </p>
        </div>

        <div className="bg-black/50 border border-zinc-800 rounded p-3">
          <div className="flex justify-between items-center mb-1">
            <span className="text-[10px] text-amber-400 font-bold">[NODE 24] Second Spectrum DB</span>
            <span className="text-[8px] bg-amber-900/50 text-amber-300 px-1.5 py-0.5 rounded">FATIGUE ANOMALY</span>
          </div>
          <p className="text-[9px] text-zinc-400 leading-relaxed">
            EXTRACTED: Defensive close-out speed has dropped by 0.4 seconds compared to Q1. Weak-side rotation is stalling. High probability of late-game defensive collapse (Rule 7 Factor).
          </p>
        </div>
        
        <div className="bg-black/50 border border-zinc-800 rounded p-3">
          <div className="flex justify-between items-center mb-1">
            <span className="text-[10px] text-zinc-500 font-bold opacity-70">[NODE 30] Global Weather / Arena</span>
            <span className="text-[8px] bg-zinc-800 text-zinc-400 px-1.5 py-0.5 rounded opacity-70">BASELINE NORMAL</span>
          </div>
          <p className="text-[9px] text-zinc-500 leading-relaxed opacity-70">
            NULL: Indoor arena humidity levels within standard deviation. No HVAC anomalies detected affecting ball pressure or flight metrics.
          </p>
        </div>

      </div>
      
      {/* Modal Footer */}
      <div className="bg-indigo-950/20 border-t border-indigo-900/50 p-3">
        <button onClick={() => setIsReportOpen(false)} className="w-full bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-black tracking-widest uppercase py-2.5 rounded transition">
          Acknowledge & Close Report
        </button>
      </div>

    </div>
  </div>
)}
{/* --- END CLASSIFIED REPORT MODAL --- */}
`;

  if (!content.includes('CLASSIFIED REPORT MODAL')) {
    content = content.replace(modalRegex, modalBlock);
    fs.writeFileSync(path, content, 'utf8');
    console.log("✅ CLASSIFIED REPORT MATRIX INJECTED. ACCOUNTABILITY PROTOCOL ACTIVE.");
  } else {
    console.log("⚠️ Report matrix already present.");
  }

} catch (err) {
  console.error("❌ SCRIPT FAILED:", err);
}
