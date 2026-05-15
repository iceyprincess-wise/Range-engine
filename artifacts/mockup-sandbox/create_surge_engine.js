import fs from 'fs';
import path from 'path';

const targetDir = path.join(process.cwd(), 'src', 'utils');
const targetFile = path.join(targetDir, 'SurgeEngine.ts');

// Ensure directory exists
if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
}

const surgeEngineCode = `
/**
 * 🚀 RANGE ENGINE V2: OFFENSIVE SURGE RISK SCANNER
 * Strictly authentic calculations. No hallucinated data.
 */

export interface TeamDNA {
    expectedFTPercent: number;
    baseDefensiveRating: number;
    benchPaceFactor: number; // Represents how fast the bench plays (usually > 1.0)
}

export interface LiveMatchData {
    currentMargin: number;
    liveFTPercent: number;
    quarter: number;
    minutesRemaining: number;
    currentHighBound: number;
    currentLowBound: number;
}

export interface SurgeAnalysisReport {
    riskLevel: 'LOW' | 'MODERATE' | 'CRITICAL' | 'PENDING';
    adjustedHighBound: number;
    adjustedLowBound: number;
    flags: string[];
    meanRegressionAlert: boolean;
    garbageTimeActive: boolean;
}

export const analyzeOffensiveSurgeRisk = (
    liveData: LiveMatchData,
    dnaData: TeamDNA
): SurgeAnalysisReport => {
    let newHB = liveData.currentHighBound;
    let newLB = liveData.currentLowBound;
    let surgeRisk: 'LOW' | 'MODERATE' | 'CRITICAL' | 'PENDING' = 'LOW';
    const activeFlags: string[] = [];
    let positiveRegression = false;
    let blowoutGarbageTime = false;

    // 1️⃣ THE "MEAN-REGRESSION" LIVE SURGE PREDICTOR
    // If a team is shooting poorly from FT line compared to their DNA, expect a late-game correction.
    if (liveData.quarter >= 3) {
        const ftDiscrepancy = dnaData.expectedFTPercent - liveData.liveFTPercent;
        if (ftDiscrepancy >= 15) {
            positiveRegression = true;
            surgeRisk = 'MODERATE';
            activeFlags.push("🚨 POSITIVE REGRESSION ALERT: Live FT% is artificially low. Expect late-game FT surge mathematically converging to DNA average.");
            // Slight bump to HB to account for incoming free throws
            newHB += 3; 
        }
    }

    // 2️⃣ THE "BLOWOUT GARBAGE-TIME PROTECTOR" (The Stall Fix Override)
    // > 18 points is a definitive blowout. Starters sit, bench players run fast-breaks with zero defense.
    if (Math.abs(liveData.currentMargin) >= 18 && liveData.quarter === 4) {
        blowoutGarbageTime = true;
        surgeRisk = 'CRITICAL';
        activeFlags.push("⚠️ GARBAGE TIME OVERRIDE: Margin > 18. Bench units activated. Zero-defense fast breaks expected.");
        
        // Lower the LB (Stall Risk for starters) but aggressively widen the HB specifically for bench scoring.
        newLB -= 4; 
        newHB += 5; // Absorbs the 4th quarter bench surge to protect UNDER bets from faking out.
    }

    // 3️⃣ ENDGAME FOUL ENGINE SHIELD (Close Games)
    if (Math.abs(liveData.currentMargin) <= 6 && liveData.minutesRemaining <= 3) {
        surgeRisk = 'CRITICAL';
        activeFlags.push("🔥 CLUTCH SURGE ALERT: Tight margin detected. Tactical fouling and clock-stopping protocol engaged.");
        newHB += 4; // Expand HB to protect against late FT bursts.
    }

    return {
        riskLevel: surgeRisk,
        adjustedHighBound: newHB,
        adjustedLowBound: newLB,
        flags: activeFlags,
        meanRegressionAlert: positiveRegression,
        garbageTimeActive: blowoutGarbageTime
    };
};
`;

fs.writeFileSync(targetFile, surgeEngineCode.trim(), 'utf8');
console.log('✅ SUCCESS: src/utils/SurgeEngine.ts has been perfectly generated and injected.');
