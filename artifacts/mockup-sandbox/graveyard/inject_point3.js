const fs = require('fs');
const path = 'src/components/mockups/range-engine/RangeEngine.tsx';

try {
    const content = fs.readFileSync(path, 'utf8');
    const lines = content.split('\n');
    
    // The precise block to inject
    const injection = `
        {/* ===================================================================== */}
        {/* 🎯 POINT 3: DEEP HISTORICAL MATRIX H2H & FORM (SPORTYBET PRE-MATCH)   */}
        {/* ===================================================================== */}
        <div className="mt-4 border border-indigo-900/60 bg-black/50 rounded-xl p-5 shadow-[0_0_20px_rgba(79,70,229,0.15)] relative overflow-hidden">
          <div className="absolute top-0 right-0 bg-indigo-900/40 text-indigo-300 text-[10px] px-2 py-1 rounded-bl-lg font-mono flex items-center gap-1 border-b border-l border-indigo-900/60">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse"></span>
            1000+ SOURCES AGGREGATED
          </div>

          <h3 className="text-indigo-400 font-bold tracking-[0.15em] mb-4 border-b border-indigo-900/60 pb-2 text-sm uppercase flex items-center">
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
            SportyBet Pre-Match Matrix: H2H & Form
          </h3>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="bg-zinc-900/50 rounded p-3 border border-zinc-800/50">
                <h4 className="text-xs text-zinc-400 font-mono mb-2 uppercase">Head-to-Head (Last 10 Matchups)</h4>
                <div className="flex justify-between items-center bg-black/40 p-2 rounded border border-zinc-800">
                  <span className="text-sky-400 font-bold text-sm">HOME TEAM</span>
                  <div className="flex gap-1 text-xs font-mono font-bold">
                    <span className="text-green-500">6W</span>
                    <span className="text-zinc-600">-</span>
                    <span className="text-red-500">4L</span>
                  </div>
                  <span className="text-amber-400 font-bold text-sm">AWAY TEAM</span>
                </div>
                <p className="text-[10px] text-zinc-500 mt-1 italic">* Includes Temporal Degradation Weights & [VACUUM VARIANCE] scans.</p>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="bg-zinc-900/50 rounded p-3 border border-zinc-800/50">
                  <h4 className="text-[10px] text-zinc-400 font-mono mb-1 uppercase">Home vs Other (L5)</h4>
                  <div className="text-sm font-mono font-bold flex gap-1">
                    <span className="text-green-500">W</span><span className="text-green-500">W</span><span className="text-red-500">L</span><span className="text-green-500">W</span><span className="text-red-500">L</span>
                  </div>
                </div>
                <div className="bg-zinc-900/50 rounded p-3 border border-zinc-800/50">
                  <h4 className="text-[10px] text-zinc-400 font-mono mb-1 uppercase">Away vs Other (L5)</h4>
                  <div className="text-sm font-mono font-bold flex gap-1">
                    <span className="text-red-500">L</span><span className="text-green-500">W</span><span className="text-red-500">L</span><span className="text-red-500">L</span><span className="text-green-500">W</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-zinc-900/50 rounded p-3 border border-zinc-800/50">
              <h4 className="text-xs text-zinc-400 font-mono mb-3 uppercase flex justify-between">
                <span>Advanced Form DNA</span>
                <span className="text-indigo-400">HOME vs AWAY</span>
              </h4>
              
              <div className="space-y-2 text-xs font-mono">
                <div className="flex justify-between items-center border-b border-zinc-800 pb-1">
                  <span className="text-sky-300 w-12 text-center">78.5%</span>
                  <span className="text-zinc-500 flex-1 text-center text-[10px]">FREE THROW %</span>
                  <span className="text-amber-300 w-12 text-center">81.2%</span>
                </div>
                <div className="flex justify-between items-center border-b border-zinc-800 pb-1">
                  <span className="text-sky-300 w-12 text-center">35.4%</span>
                  <span className="text-zinc-500 flex-1 text-center text-[10px]">3-POINT %</span>
                  <span className="text-amber-300 w-12 text-center">38.9%</span>
                </div>
                <div className="flex justify-between items-center border-b border-zinc-800 pb-1">
                  <span className="text-sky-300 w-12 text-center">46.8%</span>
                  <span className="text-zinc-500 flex-1 text-center text-[10px]">FIELD GOALS %</span>
                  <span className="text-amber-300 w-12 text-center">45.2%</span>
                </div>
                <div className="flex justify-between items-center bg-black/30 rounded py-1 px-2 mt-2">
                  <span className="text-sky-400 font-bold w-12 text-center">114.5</span>
                  <span className="text-zinc-400 flex-1 text-center text-[10px]">PPG OFFENSE</span>
                  <span className="text-amber-400 font-bold w-12 text-center">108.2</span>
                </div>
                <div className="flex justify-between items-center bg-black/30 rounded py-1 px-2">
                  <span className="text-sky-400 font-bold w-12 text-center">109.8</span>
                  <span className="text-zinc-400 flex-1 text-center text-[10px]">PPG DEFENSE</span>
                  <span className="text-amber-400 font-bold w-12 text-center">112.5</span>
                </div>
                <div className="flex justify-between items-center border-b border-zinc-800 pb-1 mt-1">
                  <span className="text-sky-300 w-12 text-center">+4.7</span>
                  <span className="text-zinc-500 flex-1 text-center text-[10px]">POINT DIFF</span>
                  <span className="text-amber-300 w-12 text-center">-4.3</span>
                </div>
                <div className="flex justify-between items-center pt-1 bg-indigo-900/20 rounded py-1 px-1">
                  <span className="text-sky-300 w-12 text-center">28m</span>
                  <span className="text-indigo-300 flex-1 text-center text-[10px] font-bold">TIME IN LEAD</span>
                  <span className="text-amber-300 w-12 text-center">15m</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        {/* ===================================================================== */}
`;

    // Locate the exact insertion point safely
    let targetIndex = -1;
    for (let i = 0; i < lines.length; i++) {
        if (lines[i].includes('INJURY') && (lines[i].includes('VACUUM') || lines[i].includes('BLOCK') || lines[i].includes('<h3'))) {
            targetIndex = i;
            break;
        }
    }

    if (targetIndex !== -1) {
        lines.splice(targetIndex, 0, injection);
        fs.writeFileSync(path, lines.join('\n'));
        console.log('✅ [SUCCESS]: Point 3 H2H Matrix successfully injected.');
    } else {
        console.log('❌ [ERROR]: Could not pinpoint the INJURY/VACUUM block. Script aborted.');
    }
} catch (error) {
    console.error('❌ [ERROR]: File read/write failure.', error);
}
