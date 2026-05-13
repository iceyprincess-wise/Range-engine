import React from 'react';
import { useGhostClock } from './useGhostClock';

/**
 * ⚡ LIVE MONITOR HUB (50+ Games Capacity)
 * Auto-Updates Scores | Applies Auto-Stall Sensor
 */
interface LiveGameProps {
    gameId: string;
    homeTeam: string;
    awayTeam: string;
    score: string;
    lastApiUpdateTimestamp: number; // Unix Epoch
}

const LiveGameCard: React.FC<LiveGameProps> = ({ homeTeam, awayTeam, score, lastApiUpdateTimestamp }) => {
    // Autonomous Global Ghost-Clock attached to every single game feed
    const isStalled = useGhostClock(lastApiUpdateTimestamp, 45000);

    return (
        <div className={`p-4 mb-2 border rounded shadow-md transition-all ${isStalled ? 'border-red-600 bg-red-50' : 'border-green-500 bg-white'}`}>
            <div className="flex justify-between items-center">
                <span className="font-bold text-lg">{homeTeam} vs {awayTeam}</span>
                <span className="text-xl font-mono">{score}</span>
            </div>
            
            {/* Auto-Halt Protocol UI Lock */}
            {isStalled ? (
                <div className="mt-2 p-2 bg-red-600 text-white font-bold text-center rounded animate-pulse">
                    ⚠️ STALL SENSOR TRIGGERED: DATA STALE
                </div>
            ) : (
                <div className="mt-2 p-2 bg-green-100 text-green-800 text-center rounded">
                    ✅ Data Feed Synced & Accurate
                </div>
            )}

            <button 
                disabled={isStalled}
                className={`w-full mt-2 py-2 font-bold rounded ${isStalled ? 'bg-gray-400 cursor-not-allowed opacity-50' : 'bg-purple-600 hover:bg-purple-700 text-white'}`}
            >
                Execute Analysis
            </button>
        </div>
    );
};

export const LiveMonitorHub: React.FC = () => {
    // Placeholder for 50+ game Rollover API Feed array
    const dummyFeed: LiveGameProps[] = [
        { gameId: "G1", homeTeam: "Team A", awayTeam: "Team B", score: "88 - 84", lastApiUpdateTimestamp: Date.now() },
        { gameId: "G2", homeTeam: "Team C", awayTeam: "Team D", score: "102 - 99", lastApiUpdateTimestamp: Date.now() - 50000 }, // Intentionally stale to trigger sensor
    ];

    return (
        <div className="w-full max-w-6xl mx-auto p-4">
            <h2 className="text-2xl font-black mb-4 uppercase tracking-wider text-gray-800">Live Global Monitor (Rollover Capacity)</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {dummyFeed.map(game => (
                    <LiveGameCard key={game.gameId} {...game} />
                ))}
            </div>
        </div>
    );
};
