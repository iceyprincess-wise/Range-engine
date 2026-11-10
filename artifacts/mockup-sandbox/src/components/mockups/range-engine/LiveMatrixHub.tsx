import React, { useState } from "react";
import { minutesToTipoff } from "@workspace/range-engine";
import { Button } from "@/components/ui/button";

interface LiveMatrixHubProps {
  history: any[];
  setHistory: React.Dispatch<React.SetStateAction<any[]>>;
  saveHistory: (h: any[]) => void;
  // Called after any action that may have spent provider quota, so the
  // parent can re-read the quota snapshot and the header stays accurate.
  onSpend?: () => void;
}

export const LiveMatrixHub: React.FC<LiveMatrixHubProps> = ({ history, setHistory, saveHistory, onSpend }) => {
  const [expandedMatch, setExpandedMatch] = useState<string | null>(null);
  const [matchStats, setMatchStats] = useState<Record<string, any>>({});
  const [stallStatus, setStallStatus] = useState<Record<string, any>>({});
  const [syncing, setSyncing] = useState<Record<string, boolean>>({});
  const [globalLoading, setGlobalLoading] = useState(false);
  const [apiReferenceMap, setApiReferenceMap] = useState<Record<string, any>>({}); // Maps history IDs to API data
  const API_BASE = (import.meta.env.VITE_API_BASE || "").replace(/\/+$/, "");

  // Date-aware: history entries carry their fixture `date`, so a
  // tomorrow 01:00 game at 23:50 today reads as +70 min (EARLY READ
  // stays on) instead of -1370 min (badge wrongly dropped).
  const getTipoffMinutes = (koTime: string, fixtureDate?: string) => {
    const now = new Date();
    const current = String(now.getHours()).padStart(2, "0") + ":" + String(now.getMinutes()).padStart(2, "0");
    const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
    const mins = minutesToTipoff(koTime, current, fixtureDate, today);
    return mins ?? NaN;
  };

  const getEarlyReadBadge = (game: any) => {
    const minutes = game.koTime ? getTipoffMinutes(game.koTime, game.date) : Infinity;
    if (game.earlyRead || minutes > 45) {
      return (
        <span className="px-2 py-1 rounded-full text-[9px] font-black uppercase tracking-widest text-red-300 bg-red-950/60 border border-red-800">
          EARLY READ
        </span>
      );
    }
    return null;
  };

  // Safety: ensure history is an array before filtering
  const safeHistory = Array.isArray(history) ? history : [];
  // ONLY show games that you have analyzed and are waiting for results
  const pendingGames = safeHistory.filter((h) => h && h.outcome === "PENDING");

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
        // History entries carry homeTeam/awayTeam as separate fields —
        // there is no `fixture` string on them, so the old parse produced
        // two empty strings and the board could NEVER match a live game
        // (live display + auto-settlement were dead for every current
        // entry). The legacy fixture string stays as a fallback for old
        // saved entries.
        const fixture = String(game.fixture || "");
        const [fixtureHome, fixtureAway] = fixture.split(" vs ");
        const safeHome = String(game.homeTeam || fixtureHome || "").trim().toLowerCase();
        const safeAway = String(game.awayTeam || fixtureAway || "").trim().toLowerCase();

        // Hunt for the matching game in the API response.
        // BOTH sides must match (either direction per side, as in the
        // server's safeMatch): the old OR test linked the first live game
        // involving EITHER team — a wrong game could settle this entry.
        const sideMatch = (stored: string, query: string) =>
          stored.length > 0 && query.length > 0 && (stored.includes(query) || query.includes(stored));
        const matchedApiGame = liveEvents.find((evt: any) =>
          sideMatch((evt.homeTeam?.name || "").toLowerCase(), safeHome) &&
          sideMatch((evt.awayTeam?.name || "").toLowerCase(), safeAway)
        );

        if (matchedApiGame) {
          newRefMap[game.id] = matchedApiGame; // Link them together for the UI

          // 🚨 TRUTH PROTOCOL: AUTO-PUSH TO HISTORY ON FULL TIME
          // Settles with the entry's OWN decision + lines (same rule as
          // RangeEngine settleAndGrade): OVER wins above best_over_line,
          // UNDER wins below best_under_line, exact line is a PUSH. A home-team
          // win says nothing about a totals range, so it must never decide WIN/LOSS.
          if (matchedApiGame.status?.type === "finished" || matchedApiGame.status?.type === "ended") {
            const homeScore = matchedApiGame.homeScore?.current || 0;
            const awayScore = matchedApiGame.awayScore?.current || 0;
            const total = homeScore + awayScore;
            const dec: string = game.result?.decision ?? "";
            const overLine = game.result?.best_over_line;
            const underLine = game.result?.best_under_line;
            let outcome: string | null = null;
            if (dec.includes("OVER") && typeof overLine === "number") {
              outcome = total > overLine ? "WIN" : total === overLine ? "PUSH" : "LOSS";
            } else if (dec.includes("UNDER") && typeof underLine === "number") {
              outcome = total < underLine ? "WIN" : total === underLine ? "PUSH" : "LOSS";
            }

            updatedHistory = updatedHistory.map(h => {
              if (h.id === game.id) {
                return {
                  ...h,
                  ...(outcome ? { outcome, actualTotal: total, ftScore: `${homeScore}-${awayScore}` } : {}),
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
    onSpend?.();
    setGlobalLoading(false);
  };

  // TASK D: Auto-fetch DISABLED to prevent silent API rate-limit draining
  // Manual triggering via "Refresh Board" button only
  // ⚠️ SECURITY: Prevents background fetching loops
  // useEffect(() => {
  //   if (pendingGames.length > 0) fetchGlobalLive();
  //   // eslint-disable-next-line
  // }, [pendingGames.length]);

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
      const homePoss = parseInt(parsedStats.possession.home) || 50;
      // Possession-skew heuristic only (one signal, not a full scan): the
      // previous label claimed an "Authentic Deep Scan", which overstated it.
      let stallNote = `Possession-skew check: home possession ${homePoss}% — within the normal band.`;
      
      if (homePoss > 65 || homePoss < 35) {
         stallRisk = "MODERATE";
         stallNote = "⚠ EXTREME POSSESSION SKEW: Potential offensive lockdown or severe transition stalling detected.";
      }

      setStallStatus(prev => ({ ...prev, [historyId]: { risk: stallRisk, note: stallNote, verifiedAt: new Date().toLocaleTimeString() } }));

    } catch (err) {
      console.error("Deep sync error:", err);
      alert("Failed to pull deep telemetry. API may be rate limiting.");
    }
    onSpend?.();
    setSyncing(prev => ({ ...prev, [historyId]: false }));
  };

  return (
    <div className="p-5 bg-gradient-to-b from-slate-950 to-zinc-950 rounded-2xl shadow-2xl border border-yellow-500/10" style={{ background: 'linear-gradient(180deg, rgba(24, 23, 37, 0.6) 0%, rgba(24, 23, 37, 0.4) 100%)', backdropFilter: 'blur(12px)' }}>
      <div className="flex justify-between items-center mb-6 border-b border-yellow-500/20 pb-4">
        <h2 className="text-xl font-black uppercase tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-yellow-300">
          <span className="text-white">📡 Global</span> Live Matrix
        </h2>
        <Button
          onClick={fetchGlobalLive} 
          disabled={globalLoading}
          className="px-5 py-2 bg-gradient-to-r from-yellow-600 to-yellow-600 hover:from-yellow-500 hover:to-yellow-500 text-white font-bold rounded-lg shadow-lg border border-yellow-400/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-base h-auto min-h-0 disabled:pointer-events-auto"
        >
          {globalLoading ? "Scanning Feed..." : "Refresh Board"}
        </Button>
      </div>

      <div className="space-y-4">
        {!safeHistory.length && (
          <div className="text-center p-8 bg-black/40 backdrop-blur-sm border border-yellow-500/20 rounded-xl text-zinc-400 font-bold tracking-widest uppercase text-sm">
            Awaiting Active Match Streams
            <br />
            <span className="text-xs font-normal opacity-50 mt-2 block">Server returned no history — check API bridge or create an analyzed fixture in Analyzer.</span>
          </div>
        )}

        {pendingGames.map(game => {
          const isExpanded = expandedMatch === game.id;
          const apiMatchData = apiReferenceMap[game.id]; // The live data from the API
          const isLive = !!(apiMatchData && Object.keys(apiMatchData).length > 0);
          
          const stats = matchStats[game.id];
          const stall = stallStatus[game.id];
          const isSyncing = syncing[game.id];

          return (
            <div key={game.id} className="border border-yellow-500/20 rounded-lg bg-black/40 backdrop-blur-sm overflow-hidden shadow-md hover:border-yellow-500/40 transition-all">
              <div 
                className="flex justify-between items-center p-4 cursor-pointer hover:bg-zinc-900/50 transition-colors"
                onClick={() => setExpandedMatch(isExpanded ? null : game.id)}
              >
                  <div className="flex flex-col">
                  <span className="font-bold text-lg text-yellow-300 tracking-wide">
                    {isLive
                      ? `${apiMatchData.homeTeam?.name || 'Home'} vs ${apiMatchData.awayTeam?.name || 'Away'}`
                      : `${game.homeTeam || String(game.fixture || "").split(' vs ')[0] || 'Home'} vs ${game.awayTeam || String(game.fixture || "").split(' vs ')[1] || 'Away'}`}
                    <span className="text-yellow-400 font-black px-1">VS</span>
                  </span>
                  <div className="flex items-center gap-3 mt-1">
                    <span className={`text-[10px] font-black px-2 py-1 rounded border uppercase tracking-widest ${isLive ? 'bg-yellow-900/40 text-yellow-300 border-yellow-500/50' : 'bg-zinc-800/40 text-zinc-400 border-zinc-600/50'}`}>
                      {isLive ? apiMatchData.periods?.current || "LIVE" : "AWAITING KICKOFF"}
                    </span>
                    {getEarlyReadBadge(game)}
                    {isLive && (
                       <span className="text-sm font-bold text-zinc-300">Score: <span className="text-yellow-300">{apiMatchData.homeScore?.current} - {apiMatchData.awayScore?.current}</span></span>
                    )}
                  </div>
                </div>
                <div className="text-xl text-yellow-400">{isExpanded ? "▲" : "▼"}</div>
              </div>

              {isExpanded && (
                <div className="p-5 border-t border-yellow-500/20 bg-black/30 backdrop-blur-sm">
                  <div className="flex justify-between items-center mb-5">
                    <h3 className="font-bold text-zinc-300 uppercase tracking-wider text-sm">Deep Telemetry & Sensor Output</h3>
                    <Button
                      onClick={() => handleManualSync(game.id, apiMatchData?.id)}
                      disabled={isSyncing || !isLive}
                      className={`px-4 py-2 font-black uppercase text-xs rounded-md shadow-lg border transition-all ${(isSyncing || !isLive) ? 'bg-zinc-800/30 text-zinc-500 border-zinc-600/30 opacity-50 cursor-not-allowed' : 'bg-gradient-to-r from-yellow-600 to-yellow-600 text-white border-yellow-400/50 hover:from-yellow-500 hover:to-yellow-500 hover:shadow-yellow-500/20'} h-auto min-h-0 disabled:pointer-events-auto`}
                    >
                      {isSyncing ? "Syncing..." : "⚡ LIVE SYNC"}
                    </Button>
                  </div>

                  {stats ? (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div className="p-3 bg-black/40 backdrop-blur-sm rounded-lg border border-yellow-500/20 text-center"><strong className="text-zinc-400 text-xs block mb-1">POSSESSION</strong> <span className="text-yellow-400">H: {stats.possession.home}</span> <span className="text-zinc-600 mx-1">|</span> <span className="text-yellow-400">A: {stats.possession.away}</span></div>
                      <div className="p-3 bg-black/40 backdrop-blur-sm rounded-lg border border-yellow-500/20 text-center"><strong className="text-zinc-400 text-xs block mb-1">FIELD GOALS</strong> <span className="text-yellow-400">H: {stats.fgPercent.home}</span> <span className="text-zinc-600 mx-1">|</span> <span className="text-yellow-400">A: {stats.fgPercent.away}</span></div>
                      <div className="p-3 bg-black/40 backdrop-blur-sm rounded-lg border border-yellow-500/20 text-center"><strong className="text-zinc-400 text-xs block mb-1">3PT %</strong> <span className="text-yellow-400">H: {stats.threePtPercent.home}</span> <span className="text-zinc-600 mx-1">|</span> <span className="text-yellow-400">A: {stats.threePtPercent.away}</span></div>
                      <div className="p-3 bg-black/40 backdrop-blur-sm rounded-lg border border-yellow-500/20 text-center"><strong className="text-zinc-400 text-xs block mb-1">FT %</strong> <span className="text-yellow-400">H: {stats.ftPercent.home}</span> <span className="text-zinc-600 mx-1">|</span> <span className="text-yellow-400">A: {stats.ftPercent.away}</span></div>
                      
                      <div className="p-3 bg-black/40 backdrop-blur-sm rounded-lg border border-yellow-500/20 text-center"><strong className="text-zinc-400 text-xs block mb-1">FOULS</strong> <span className="text-yellow-400">H: {stats.fouls.home}</span> <span className="text-zinc-600 mx-1">|</span> <span className="text-yellow-400">A: {stats.fouls.away}</span></div>
                      <div className="p-3 bg-black/40 backdrop-blur-sm rounded-lg border border-yellow-500/20 text-center"><strong className="text-zinc-400 text-xs block mb-1">REBOUNDS</strong> <span className="text-yellow-400">H: {stats.rebounds.home}</span> <span className="text-zinc-600 mx-1">|</span> <span className="text-yellow-400">A: {stats.rebounds.away}</span></div>
                      <div className="p-3 bg-black/40 backdrop-blur-sm rounded-lg border border-yellow-500/20 text-center"><strong className="text-zinc-400 text-xs block mb-1">PPG ALLOWED</strong> <span className="text-yellow-400">H: {stats.ppgAllowed.home}</span> <span className="text-zinc-600 mx-1">|</span> <span className="text-yellow-400">A: {stats.ppgAllowed.away}</span></div>
                      <div className="p-3 bg-black/40 backdrop-blur-sm rounded-lg border border-yellow-500/20 text-center"><strong className="text-zinc-400 text-xs block mb-1">TIMEOUTS</strong> <span className="text-yellow-400">H: {stats.timeouts.home}</span> <span className="text-zinc-600 mx-1">|</span> <span className="text-yellow-400">A: {stats.timeouts.away}</span></div>
                      
                      {stall && (
                        <div className={`col-span-2 md:col-span-4 p-4 mt-2 border rounded-lg font-semibold flex flex-col justify-center ${stall.risk === 'HIGH' ? 'bg-red-950/30 border-red-600/50 text-red-300' : stall.risk === 'MODERATE' ? 'bg-yellow-950/30 border-yellow-600/50 text-yellow-300' : 'bg-yellow-950/30 border-yellow-600/50 text-yellow-300'}`}>
                           <span className="block mb-1">{stall.note}</span> 
                           <span className="text-[10px] font-black opacity-70 uppercase tracking-widest">VERIFIED SYNC: {stall.verifiedAt}</span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center text-zinc-400 py-8 bg-black/40 rounded-lg border border-zinc-700/30 border-dashed">
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
           <div className="text-center p-8 bg-black/40 backdrop-blur-sm border border-yellow-500/20 rounded-lg text-zinc-400 font-bold tracking-widest uppercase text-sm">
             No Pending Analyzed Games.<br/>
             <span className="text-xs font-normal opacity-50 mt-2 block">Go to the Analyzer tab to predict a match, and it will automatically slot in here for Live Tracking.</span>
           </div>
        )}
      </div>
    </div>
  );
};
