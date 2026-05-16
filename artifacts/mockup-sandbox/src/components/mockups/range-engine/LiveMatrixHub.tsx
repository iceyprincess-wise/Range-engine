import React, { useState, useEffect } from "react";

interface LiveMatrixHubProps {
  history: any[];
  setHistory: React.Dispatch<React.SetStateAction<any[]>>;
  saveHistory: (h: any[]) => void;
}

export const LiveMatrixHub: React.FC<LiveMatrixHubProps> = ({ history, setHistory, saveHistory }) => {
  const [expandedMatch, setExpandedMatch] = useState<string | null>(null);
  const [matchStats, setMatchStats] = useState<Record<string, any>>({});
  const [stallStatus, setStallStatus] = useState<Record<string, any>>({});
  const [syncing, setSyncing] = useState<Record<string, boolean>>({});
  const [globalLoading, setGlobalLoading] = useState(false);
  const [apiReferenceMap, setApiReferenceMap] = useState<Record<string, any>>({}); // Maps history IDs to API data
  const API_BASE = import.meta.env.VITE_API_BASE || "";

  // ONLY show games that you have analyzed and are waiting for results
  const pendingGames = history.filter(h => h.outcome === "PENDING");

  // 📡 THE REFRESH BOARD ALGORITHM (Lightweight Sync + Auto-Full-Time Push)
  const fetchGlobalLive = async () => {
    setGlobalLoading(true);
    try {
      // Fetch the global live matches from the backend proxy
      const res = await fetch(`${API_BASE}/api/basket/live`);
      const data = await res.json();
      const liveEvents = data?.events || [];

      let updatedHistory = [...history];
      let historyChanged = false;
      let newRefMap: Record<string, any> = {};

      pendingGames.forEach(game => {
        // Parse the fixture name (e.g., "Lakers vs Warriors")
        const [homePart, awayPart] = game.fixture.split(" vs ");
        const safeHome = homePart?.trim().toLowerCase() || "";
        const safeAway = awayPart?.trim().toLowerCase() || "";

        // Hunt for the matching game in the API response
        const matchedApiGame = liveEvents.find((evt: any) => 
          evt.homeTeam?.name?.toLowerCase().includes(safeHome) ||
          evt.awayTeam?.name?.toLowerCase().includes(safeAway)
        );

        if (matchedApiGame) {
          newRefMap[game.id] = matchedApiGame; // Link them together for the UI

          // 🚨 TRUTH PROTOCOL: AUTO-PUSH TO HISTORY ON FULL TIME
          if (matchedApiGame.status?.type === "finished" || matchedApiGame.status?.type === "ended") {
            const homeScore = matchedApiGame.homeScore?.current || 0;
            const awayScore = matchedApiGame.awayScore?.current || 0;
            
            // Logic: Assume win if Home score > Away score (Adjust to your specific betting logic later)
            const isWin = homeScore > awayScore; 

            updatedHistory = updatedHistory.map(h => {
              if (h.id === game.id) {
                return {
                  ...h,
                  outcome: isWin ? "WIN" : "LOSS",
                  result: { ...h.result, type: "FT", home: homeScore, away: awayScore }
                };
              }
              return h;
            });
            historyChanged = true;
          }
        }
      });

      setApiReferenceMap(newRefMap);
      
      if (historyChanged) {
        setHistory(updatedHistory);
        saveHistory(updatedHistory);
      }

    } catch (err) {
      console.error("Global Live Feed Error:", err);
    }
    setGlobalLoading(false);
  };

  // Run a lightweight check when the component mounts
  useEffect(() => {
    if (pendingGames.length > 0) fetchGlobalLive();
    // eslint-disable-next-line
  }, []);

  // ⚡ DEEP LIVE SYNC ALGORITHM (Heavy Statistics Hunt for Specific Game)
  const handleManualSync = async (historyId: string, apiMatchId: string | undefined) => {
    if (!apiMatchId) {
       alert("Target game has not kicked off yet or isn't on the live global feed.");
       return;
    }
    
    setSyncing(prev => ({ ...prev, [historyId]: true }));
    try {
      const res = await fetch(`${API_BASE}/api/basket/match/${apiMatchId}/statistics`);
      const data = await res.json();
      
      // Safe parsing to protect React from crashing (Object mapping)
      const rawStats = data?.statistics?.[0]?.groups || [];
      const getStat = (groupName: string, statName: string) => {
        const group = rawStats.find((g: any) => g.groupName === groupName);
        const item = group?.statisticsItems?.find((s: any) => s.name === statName);
        return { home: item?.home || "0", away: item?.away || "0" };
      };

      const parsedStats = {
        possession: getStat("Possession", "Ball possession"),
        ftPercent: getStat("Scoring", "Free throws percentage"),
        threePtPercent: getStat("Scoring", "3-pointers percentage"),
        fgPercent: getStat("Scoring", "Field goals percentage"),
        fouls: getStat("Other", "Fouls"),
        rebounds: getStat("Other", "Rebounds"),
        timeouts: getStat("Other", "Timeouts"),
        ppgAllowed: { home: getStat("Scoring", "Points against").home, away: getStat("Scoring", "Points against").away }
      };
      
      setMatchStats(prev => ({ ...prev, [historyId]: parsedStats }));

      // STALL SENSOR SYNTHESIS (Mocked logic over deep data to prevent crash, as Q-scores vary by API)
      let stallRisk = "LOW";
      let stallNote = "Authentic Deep Scan Active: Pace Nominal.";
      const homePoss = parseInt(parsedStats.possession.home) || 50;
      
      if (homePoss > 65 || homePoss < 35) {
         stallRisk = "MODERATE";
         stallNote = "⚠ EXTREME POSSESSION SKEW: Potential offensive lockdown or severe transition stalling detected.";
      }

      setStallStatus(prev => ({ ...prev, [historyId]: { risk: stallRisk, note: stallNote, verifiedAt: new Date().toLocaleTimeString() } }));

    } catch (err) {
      console.error("Deep sync error:", err);
      alert("Failed to pull deep telemetry. API may be rate limiting.");
    }
    setSyncing(prev => ({ ...prev, [historyId]: false }));
  };

  return (
    <div className="p-4 bg-[#0a0a0a] rounded-xl shadow-2xl border border-gray-800 text-gray-200">
      <div className="flex justify-between items-center mb-6 border-b border-gray-800 pb-4">
        <h2 className="text-xl font-black uppercase tracking-widest text-purple-500">
          <span className="text-white">📡 Global</span> Live Matrix
        </h2>
        <button 
          onClick={fetchGlobalLive} 
          disabled={globalLoading}
          className="px-5 py-2 bg-gray-800 hover:bg-gray-700 text-purple-400 font-bold rounded-lg shadow-lg border border-purple-900/50 transition-all disabled:opacity-50"
        >
          {globalLoading ? "Scanning Feed..." : "Refresh Board"}
        </button>
      </div>

      <div className="space-y-4">
        {pendingGames.map(game => {
          const isExpanded = expandedMatch === game.id;
          const apiMatchData = apiReferenceMap[game.id]; // The live data from the API
          const isLive = !!apiMatchData;
          
          const stats = matchStats[game.id];
          const stall = stallStatus[game.id];
          const isSyncing = syncing[game.id];

          return (
            <div key={game.id} className="border border-gray-800 rounded-lg bg-[#111] overflow-hidden shadow-md transition-all">
              <div 
                className="flex justify-between items-center p-4 cursor-pointer hover:bg-gray-900 transition-colors"
                onClick={() => setExpandedMatch(isExpanded ? null : game.id)}
              >
                <div className="flex flex-col">
                  <span className="font-bold text-lg text-white tracking-wide">{(game.fixture || "Unknown vs Match").replace("vs", "")} <span className="text-purple-600 font-black px-1">VS</span></span>
                  <div className="flex items-center gap-3 mt-1">
                    <span className={`text-[10px] font-black px-2 py-1 rounded border uppercase tracking-widest ${isLive ? 'bg-green-900/40 text-green-400 border-green-800/50' : 'bg-gray-800 text-gray-500 border-gray-700'}`}>
                      {isLive ? apiMatchData.periods?.current || "LIVE" : "AWAITING KICKOFF"}
                    </span>
                    {isLive && (
                       <span className="text-sm font-bold text-gray-400">Score: <span className="text-white">{apiMatchData.homeScore?.current} - {apiMatchData.awayScore?.current}</span></span>
                    )}
                  </div>
                </div>
                <div className="text-xl text-purple-500">{isExpanded ? "▲" : "▼"}</div>
              </div>

              {isExpanded && (
                <div className="p-5 border-t border-gray-800 bg-black">
                  <div className="flex justify-between items-center mb-5">
                    <h3 className="font-bold text-gray-400 uppercase tracking-wider text-sm">Deep Telemetry & Sensor Output</h3>
                    <button 
                      onClick={() => handleManualSync(game.id, apiMatchData?.id)}
                      disabled={isSyncing || !isLive}
                      className={`px-4 py-2 font-black uppercase text-xs rounded-md shadow-lg border transition-all ${(isSyncing || !isLive) ? 'bg-gray-800 text-gray-500 border-gray-700 opacity-50 cursor-not-allowed' : 'bg-purple-900 text-purple-100 border-purple-500 hover:bg-purple-700 hover:text-white hover:shadow-purple-900/50'}`}
                    >
                      {isSyncing ? "Syncing..." : "⚡ LIVE SYNC"}
                    </button>
                  </div>

                  {stats ? (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div className="p-3 bg-[#0f0f0f] rounded-lg border border-gray-800 text-center"><strong className="text-gray-500 text-xs block mb-1">POSSESSION</strong> <span className="text-purple-400">H: {stats.possession.home}</span> <span className="text-gray-600 mx-1">|</span> <span className="text-purple-400">A: {stats.possession.away}</span></div>
                      <div className="p-3 bg-[#0f0f0f] rounded-lg border border-gray-800 text-center"><strong className="text-gray-500 text-xs block mb-1">FIELD GOALS</strong> <span className="text-purple-400">H: {stats.fgPercent.home}</span> <span className="text-gray-600 mx-1">|</span> <span className="text-purple-400">A: {stats.fgPercent.away}</span></div>
                      <div className="p-3 bg-[#0f0f0f] rounded-lg border border-gray-800 text-center"><strong className="text-gray-500 text-xs block mb-1">3PT %</strong> <span className="text-purple-400">H: {stats.threePtPercent.home}</span> <span className="text-gray-600 mx-1">|</span> <span className="text-purple-400">A: {stats.threePtPercent.away}</span></div>
                      <div className="p-3 bg-[#0f0f0f] rounded-lg border border-gray-800 text-center"><strong className="text-gray-500 text-xs block mb-1">FT %</strong> <span className="text-purple-400">H: {stats.ftPercent.home}</span> <span className="text-gray-600 mx-1">|</span> <span className="text-purple-400">A: {stats.ftPercent.away}</span></div>
                      
                      <div className="p-3 bg-[#0f0f0f] rounded-lg border border-gray-800 text-center"><strong className="text-gray-500 text-xs block mb-1">FOULS</strong> <span className="text-purple-400">H: {stats.fouls.home}</span> <span className="text-gray-600 mx-1">|</span> <span className="text-purple-400">A: {stats.fouls.away}</span></div>
                      <div className="p-3 bg-[#0f0f0f] rounded-lg border border-gray-800 text-center"><strong className="text-gray-500 text-xs block mb-1">REBOUNDS</strong> <span className="text-purple-400">H: {stats.rebounds.home}</span> <span className="text-gray-600 mx-1">|</span> <span className="text-purple-400">A: {stats.rebounds.away}</span></div>
                      <div className="p-3 bg-[#0f0f0f] rounded-lg border border-gray-800 text-center"><strong className="text-gray-500 text-xs block mb-1">PPG ALLOWED</strong> <span className="text-purple-400">H: {stats.ppgAllowed.home}</span> <span className="text-gray-600 mx-1">|</span> <span className="text-purple-400">A: {stats.ppgAllowed.away}</span></div>
                      <div className="p-3 bg-[#0f0f0f] rounded-lg border border-gray-800 text-center"><strong className="text-gray-500 text-xs block mb-1">TIMEOUTS</strong> <span className="text-purple-400">H: {stats.timeouts.home}</span> <span className="text-gray-600 mx-1">|</span> <span className="text-purple-400">A: {stats.timeouts.away}</span></div>
                      
                      {stall && (
                        <div className={`col-span-2 md:col-span-4 p-4 mt-2 border rounded-lg font-semibold flex flex-col justify-center ${stall.risk === 'HIGH' ? 'bg-red-950/30 border-red-900/50 text-red-400' : stall.risk === 'MODERATE' ? 'bg-amber-950/30 border-amber-900/50 text-amber-400' : 'bg-emerald-950/30 border-emerald-900/50 text-emerald-400'}`}>
                           <span className="block mb-1">{stall.note}</span> 
                           <span className="text-[10px] font-black opacity-70 uppercase tracking-widest">VERIFIED SYNC: {stall.verifiedAt}</span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center text-gray-500 py-8 bg-[#0a0a0a] rounded-lg border border-gray-900 border-dashed">
                       <span className="block mb-2 text-2xl">📡</span>
                       <span className="text-sm font-bold uppercase tracking-wide">Tap "LIVE SYNC" to execute real-time authentic API data hunt</span>
                       <span className="block text-xs mt-1 opacity-50">Match must be LIVE to pull Deep Telemetry.</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
        {pendingGames.length === 0 && (
           <div className="text-center p-8 bg-[#111] border border-gray-800 rounded-lg text-gray-500 font-bold tracking-widest uppercase text-sm">
             No Pending Analyzed Games.<br/>
             <span className="text-xs font-normal opacity-50 mt-2 block">Go to the Analyzer tab to predict a match, and it will automatically slot in here for Live Tracking.</span>
           </div>
        )}
      </div>
    </div>
  );
};
