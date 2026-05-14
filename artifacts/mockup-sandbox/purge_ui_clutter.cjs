const fs = require('fs');
const targetPath = './src/components/mockups/range-engine/RangeEngine.tsx';

console.log('======================================================');
console.log(' 🧹 INITIATING UI PURGE: CLEARING VISUAL CLUTTER');
console.log('======================================================\n');

let code = fs.readFileSync(targetPath, 'utf8');

const startStr = '{tab === "live" && (';
const endStr = '{tab === "history" && (';

const startIndex = code.indexOf(startStr);
const endIndex = code.indexOf(endStr);

if (startIndex !== -1 && endIndex !== -1) {
    const perfectLiveUI = `{tab === "live" && (
        <div className="flex-1 overflow-y-auto px-5 py-4">
          <div className="max-w-2xl mx-auto">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
              <h3 className="text-emerald-500 font-black tracking-widest text-xs uppercase">Splendor Live Engine & Auto-Logger</h3>
            </div>

            <div className="text-[10px] text-zinc-400 font-mono mb-5 mt-3 leading-relaxed">
              &gt; SYSTEM STANDBY. Matches analyzed in the Pre-Match engine will automatically route here at Tip-Off.<br/>
              &gt; Live pacing and stall risks are tracked dynamically.<br/>
              <span className="text-emerald-500/70">&gt; Upon final whistle, completed game data is automatically compiled and pushed to the HISTORY matrix. Zero manual entry required.</span>
            </div>

            {/* SMART THROTTLE SYNC BUTTON */}
            <div className="flex items-center justify-between bg-zinc-900/50 border border-zinc-800 p-3 rounded-lg mb-4">
              <div>
                <span className="text-emerald-400 text-[11px] font-bold tracking-widest uppercase block">BasketAPI Sync Engine</span>
                <span className="text-zinc-500 text-[9px] uppercase">Manual Throttle Active (Protects Free Quota)</span>
              </div>
              <button 
                onClick={triggerLiveSync}
                disabled={isFetchingLive}
                className={\`px-4 py-2 rounded text-[10px] font-black tracking-widest uppercase transition-all \${isFetchingLive ? "bg-zinc-800 text-zinc-500 cursor-not-allowed" : "bg-emerald-600 hover:bg-emerald-500 text-white shadow-[0_0_10px_rgba(5,150,105,0.4)]"}\`}
              >
                {isFetchingLive ? "Syncing..." : "Sync Live Data"}
              </button>
            </div>
            {apiError && <p className="text-red-400 text-[10px] mb-3 border border-red-900/50 bg-red-950/30 p-2 rounded">{apiError}</p>}

            {liveStats ? (
              <div className="mt-4 border border-zinc-800/50 p-5 rounded-xl bg-black/40 shadow-2xl relative overflow-hidden">
                {/* Background glow */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-32 bg-emerald-500/10 blur-3xl rounded-full pointer-events-none"></div>
                
                <div className="flex justify-between items-center mb-6 border-b border-zinc-800/50 pb-5 relative z-10">
                    <div className="flex items-center gap-3">
                        <span className="px-2 py-1 bg-zinc-800 rounded text-[10px] font-bold text-zinc-400 shadow-inner">H</span>
                        <span className="text-[13px] font-black tracking-widest text-white uppercase">{homeTeam || "HOME"}</span>
                    </div>
                    <div className="text-center px-4">
                        <span className="text-[8px] bg-emerald-950 text-emerald-400 px-2 py-0.5 rounded border border-emerald-800/50 uppercase tracking-widest shadow-[0_0_8px_rgba(5,150,105,0.3)]">LIVE MATCH</span>
                        <div className="text-3xl font-black text-white mt-1.5 tracking-tighter drop-shadow-md">
                           {liveStats?.radar?.homeScore?.current ?? "-"} <span className="text-zinc-700 mx-1">:</span> {liveStats?.radar?.awayScore?.current ?? "-"}
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <span className="text-[13px] font-black tracking-widest text-white uppercase">{awayTeam || "AWAY"}</span>
                        <span className="px-2 py-1 bg-zinc-800 rounded text-[10px] font-bold text-zinc-400 shadow-inner">A</span>
                    </div>
                </div>

                <div className="text-center mb-5 relative z-10">
                   <span className="text-[9px] text-zinc-500 font-mono tracking-widest uppercase bg-zinc-900/50 px-3 py-1 rounded-full border border-zinc-800">Match Statistics</span>
                </div>

                <div className="relative z-10">
                    <LiveStatBar label="Field Goals" statKey="fieldGoalsScored" />
                    <LiveStatBar label="2 Points" statKey="twoPointersScored" />
                    <LiveStatBar label="3 Points" statKey="threePointersScored" />
                    <LiveStatBar label="Free Throws" statKey="freeThrowsScored" />
                    <div className="my-5 border-t border-zinc-800/50"></div>
                    <LiveStatBar label="Rebounds" statKey="rebounds" />
                    <LiveStatBar label="Fouls" statKey="totalFouls" />
                </div>
              </div>
            ) : (
              <div className="border border-zinc-800 border-dashed rounded-xl p-8 text-center mt-4 bg-black/20">
                <div className="text-zinc-500 font-mono text-[10px] uppercase tracking-widest">No Active Match Synced</div>
              </div>
            )}

            <div className="bg-[#050807] p-3 border-t border-emerald-900/30 flex justify-between items-center mt-4 rounded-b-xl">
                <div className="text-[10px] font-mono text-zinc-500 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span> API SYNC: ACTIVE MATRIX
                </div>
            </div>
          </div>
        </div>
      )}

      `;

    code = code.substring(0, startIndex) + perfectLiveUI + code.substring(endIndex);
    fs.writeFileSync(targetPath, code, 'utf8');
    
    console.log('✅ STATUS: GHOST UI ANNIHILATED.');
    console.log('✅ STATUS: TOP-NOTCH DESIGN DEPLOYED.');
} else {
    console.log('❌ ERROR: Could not locate UI boundaries.');
}

console.log('======================================================\n');
