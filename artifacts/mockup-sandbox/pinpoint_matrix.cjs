const fs = require('fs');
const path = './src/components/mockups/range-engine/RangeEngine.tsx';
let code = fs.readFileSync(path, 'utf8');

const searchString = '🚑 INJURY / VACUUM - Rule 11';
const anchorIndex = code.indexOf(searchString);

if (anchorIndex !== -1) {
    // Find the wrapper div exactly before the paragraph
    const divIndex = code.lastIndexOf('<div', anchorIndex);
    
    // Safety check to avoid double-injecting
    if (code.includes('SPORTYBET PRE-MATCH MATRIX')) {
        console.log("⚠️ Matrix is already in the file. Delete the old one first or Undo (Ctrl+Z).");
        process.exit(0);
    }

    const matrixCode = `
            {/* SPORTYBET PRE-MATCH MATRIX */}
            <div className="px-4 py-4 space-y-3 border-b border-zinc-800/50 bg-zinc-950/30">
              <div className="flex items-center justify-between">
                <p className="text-[9px] font-bold uppercase tracking-widest text-emerald-400 flex items-center gap-2">
                  <span>🎯</span> SPORTYBET PRE-MATCH MATRIX
                </p>
                <span className="text-[8px] text-zinc-500 uppercase tracking-widest border border-zinc-800 px-1.5 py-0.5 rounded">Pre-Match DNA</span>
              </div>
              
              <div className="grid grid-cols-2 gap-3 text-[10px] text-zinc-300">
                {/* Home Stats */}
                <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-lg p-3 shadow-inner space-y-1">
                  <p className="text-[9px] font-bold uppercase tracking-widest text-zinc-400 mb-2 border-b border-zinc-800/80 pb-1">{homeTeam || "HOME TEAM"} AVERAGES</p>
                  <div className="flex justify-between py-0.5"><span>Field Goals %</span> <span className="font-mono text-zinc-100">46.5%</span></div>
                  <div className="flex justify-between py-0.5"><span>2-Pointers %</span> <span className="font-mono text-zinc-100">52.1%</span></div>
                  <div className="flex justify-between py-0.5"><span>3-Pointers %</span> <span className="font-mono text-zinc-100">35.2%</span></div>
                  <div className="flex justify-between py-0.5"><span>Free Throws %</span> <span className="font-mono text-emerald-400 font-bold">78.1%</span></div>
                  <div className="flex justify-between py-0.5 mt-1 border-t border-zinc-800/50 pt-1"><span>PPG Scored</span> <span className="font-mono text-emerald-400">112.4</span></div>
                  <div className="flex justify-between py-0.5"><span>PPG Allowed</span> <span className="font-mono text-amber-400">109.1</span></div>
                  <div className="flex justify-between py-0.5"><span>Point Diff</span> <span className="font-mono text-emerald-400">+3.3</span></div>
                  <div className="flex justify-between py-0.5 mt-1 border-t border-zinc-800/50 pt-1"><span>Avg Rebounds</span> <span className="font-mono text-zinc-300">42.1</span></div>
                  <div className="flex justify-between py-0.5"><span>Avg Fouls</span> <span className="font-mono text-amber-400/80">19.5</span></div>
                  <div className="flex justify-between py-0.5"><span>Time in Lead</span> <span className="font-mono text-zinc-300">22m 14s</span></div>
                </div>
                
                {/* Away Stats */}
                <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-lg p-3 shadow-inner space-y-1">
                  <p className="text-[9px] font-bold uppercase tracking-widest text-zinc-400 mb-2 border-b border-zinc-800/80 pb-1">{awayTeam || "AWAY TEAM"} AVERAGES</p>
                  <div className="flex justify-between py-0.5"><span>Field Goals %</span> <span className="font-mono text-zinc-100">44.8%</span></div>
                  <div className="flex justify-between py-0.5"><span>2-Pointers %</span> <span className="font-mono text-zinc-100">49.9%</span></div>
                  <div className="flex justify-between py-0.5"><span>3-Pointers %</span> <span className="font-mono text-zinc-100">33.9%</span></div>
                  <div className="flex justify-between py-0.5"><span>Free Throws %</span> <span className="font-mono text-emerald-400 font-bold">81.0%</span></div>
                  <div className="flex justify-between py-0.5 mt-1 border-t border-zinc-800/50 pt-1"><span>PPG Scored</span> <span className="font-mono text-emerald-400">108.2</span></div>
                  <div className="flex justify-between py-0.5"><span>PPG Allowed</span> <span className="font-mono text-amber-400">111.5</span></div>
                  <div className="flex justify-between py-0.5"><span>Point Diff</span> <span className="font-mono text-amber-400">-3.3</span></div>
                  <div className="flex justify-between py-0.5 mt-1 border-t border-zinc-800/50 pt-1"><span>Avg Rebounds</span> <span className="font-mono text-zinc-300">39.5</span></div>
                  <div className="flex justify-between py-0.5"><span>Avg Fouls</span> <span className="font-mono text-amber-400/80">21.2</span></div>
                  <div className="flex justify-between py-0.5"><span>Time in Lead</span> <span className="font-mono text-zinc-300">18m 45s</span></div>
                </div>
              </div>
            </div>\n`;

    code = code.substring(0, divIndex) + matrixCode + code.substring(divIndex);
    fs.writeFileSync(path, code);
    console.log("🎯 PINPOINT HIT: Matrix successfully injected!");
} else {
    console.log("❌ ERROR: Could not find 'Rule 11'");
}
