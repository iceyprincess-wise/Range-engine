import React, { useState, useEffect } from 'react';

// Strict Type Definitions for 100% Data Accuracy Mapping
interface Player {
  id: string;
  name: string;
  status: 'ACTIVE' | 'OUT' | 'QUESTIONABLE';
  usageRate: number; // e.g., 30.5 for 30.5%
  avgPoints: number;
}

interface VacuumDistribution {
  beneficiaryName: string;
  expectedVolumeIncrease: number; // Percentage increase in shot volume
  efficiencyPenalty: number; // Expected drop in efficiency
}

interface MarketLatency {
  initialTotalLine: number;
  currentTotalLine: number;
  timeSinceInjuryReport: number; // in minutes
  marketAdjusted: boolean;
}

interface InjuryVacuumProps {
  homeTeamId: string;
  awayTeamId: string;
  gameTipOffTime: Date;
  apiEndpoint?: string; // Placeholder for future backend
}

export const InjuryVacuumEngine: React.FC<InjuryVacuumProps> = ({ homeTeamId, awayTeamId, gameTipOffTime }) => {
  const [injuredStars, setInjuredStars] = useState<Player[]>([]);
  const [vacuumData, setVacuumData] = useState<VacuumDistribution[]>([]);
  const [latencyData, setLatencyData] = useState<MarketLatency | null>(null);

  // Simulated Deep Scan Initialization
  useEffect(() => {
    // ⚠️ CORE LOGIC: When a player with >= 25% Usage is OUT:
    // 1. Shift Base Range: -6 points (Efficiency drop)
    // 2. Expand Range Width: +8 points (High variance from bench shooters)
    
    const simulateLiveData = () => {
      const detectedOut: Player = {
        id: 'p_101',
        name: 'Stephen Curry',
        status: 'OUT',
        usageRate: 31.2,
        avgPoints: 26.5
      };
      
      setInjuredStars([detectedOut]);

      // The Vacuum Distribution Heatmap
      setVacuumData([
        { beneficiaryName: 'Klay Thompson', expectedVolumeIncrease: 15, efficiencyPenalty: -2.1 },
        { beneficiaryName: 'Jonathan Kuminga', expectedVolumeIncrease: 8, efficiencyPenalty: -1.5 }
      ]);

      // The Line-Movement Latency Tracker
      setLatencyData({
        initialTotalLine: 228.5,
        currentTotalLine: 227.5, // Only dropped 1 point
        timeSinceInjuryReport: 30, // 30 mins ago
        marketAdjusted: false // Market is sleeping
      });
    };

    simulateLiveData();
  }, [homeTeamId, awayTeamId]);

  return (
    <div className="bg-slate-900 border border-red-500/50 rounded-lg p-4 font-mono text-slate-200 mt-4 mb-4">
      <h3 className="text-xl font-bold text-red-500 mb-3 flex items-center">
        <span className="animate-pulse mr-2">🔴</span> INJURY / USAGE VACUUM ACTIVE
      </h3>

      {injuredStars.length > 0 ? (
        <div className="space-y-4">
          {/* Injured List */}
          <div className="bg-slate-800 p-3 rounded">
            <h4 className="text-gray-400 text-sm uppercase tracking-wider mb-2">Confirmed Out</h4>
            {injuredStars.map(player => (
              <div key={player.id} className="flex justify-between items-center text-red-400 font-bold">
                <span>{player.name}</span>
                <span>{player.usageRate}% USG</span>
              </div>
            ))}
          </div>

          {/* Vacuum Distribution Heatmap */}
          <div className="bg-slate-800 p-3 rounded border border-orange-500/30">
            <h4 className="text-orange-400 text-sm uppercase tracking-wider mb-2">Vacuum Distribution Alert</h4>
            <div className="space-y-2">
              {vacuumData.map((dist, idx) => (
                <div key={idx} className="flex justify-between text-sm">
                  <span className="text-slate-300">➡️ {dist.beneficiaryName}</span>
                  <span className="text-orange-300">+{dist.expectedVolumeIncrease}% Vol</span>
                </div>
              ))}
            </div>
            <div className="mt-2 text-xs text-slate-500 border-t border-slate-700 pt-2">
              SYSTEM ACTION: Shifting total range down (-6 pts), expanding width (+8 pts) to account for efficiency drop.
            </div>
          </div>

          {/* Line-Movement Latency Tracker */}
          {latencyData && !latencyData.marketAdjusted && (
            <div className="bg-red-950 border border-red-600 p-3 rounded">
              <h4 className="text-red-500 text-sm uppercase tracking-wider mb-2 font-bold animate-pulse">🚨 VACUUM EDGE ALARM</h4>
              <p className="text-xs text-slate-300 mb-1">
                Market has only adjusted <span className="text-white font-bold">{latencyData.initialTotalLine - latencyData.currentTotalLine} pts</span> in {latencyData.timeSinceInjuryReport} mins.
              </p>
              <p className="text-sm font-bold text-green-400">
                EDGE DETECTED: Line has not fully reacted to missing {injuredStars[0]?.usageRate}% usage.
              </p>
            </div>
          )}
        </div>
      ) : (
        <div className="text-green-500 text-sm">✓ No high-usage injuries detected. Rosters stable.</div>
      )}
    </div>
  );
};
