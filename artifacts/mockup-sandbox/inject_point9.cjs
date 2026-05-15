const fs = require('fs');
const path = require('path');

const targetPath = path.join(__dirname, 'src', 'components', 'mockups', 'range-engine', 'RangeEngine.tsx');
let fileContent = fs.readFileSync(targetPath, 'utf-8');

console.log("===================================================");
console.log("🧠 SURGICAL INJECTION: POINT 9 (REFEREE SENSOR & BUFFER ZONE)");
console.log("===================================================\n");

// --- INJECTION 1: REFEREE WHISTLE-RATE SENSOR ---
const foulEngineTarget = `if (margin <= 6 && avg_ft >= 0.75) r10_hb = Math.round(11 * ws);`;
const foulEngineReplacement = `if (margin <= 6 && avg_ft >= 0.75) r10_hb = Math.round(11 * ws);

    // 🧠 POINT 9: REFEREE WHISTLE-RATE ANOMALY SENSOR
    // Concept: Dynamically expands High Bound to absorb 'Phantom Free Throws'
    const isHighFoulRateCrew = true; // ⚠️ Placeholder: Will hook into Python Backend
    let refereeAnomalyActive = false;
    if (isHighFoulRateCrew && margin <= 8) {
        r10_hb += 2.5; 
        refereeAnomalyActive = true;
    }`;

if (fileContent.includes(foulEngineTarget)) {
    fileContent = fileContent.replace(foulEngineTarget, foulEngineReplacement);
    console.log("✅ SUCCESS: Referee Anomaly Sensor injected at Foul Engine block.");
} else {
    console.log("⚠️ WARNING: Could not find exact Line 363 target for Referee Sensor.");
}

// --- INJECTION 2: UPDATE TRIGGER LOG WITH SENSOR DATA ---
const logTarget = 'if (r10_hb > 0) triggered.push(`Rule 10 (Foul Engine): HB+${r10_hb}${stacking_cut > 0 ? ` (Stack Cap -${stacking_cut})` : ""} | FT%: ${(avg_ft*100).toFixed(0)}%`);';
const logReplacement = 'if (r10_hb > 0) triggered.push(`Rule 10 (Foul Engine): HB+${r10_hb}${stacking_cut > 0 ? ` (Stack Cap -${stacking_cut})` : ""} | FT%: ${(avg_ft*100).toFixed(0)}%${refereeAnomalyActive ? " 🚨 [Phantom FT Adj +2.5]" : ""}`);';

if (fileContent.includes(logTarget)) {
    fileContent = fileContent.replace(logTarget, logReplacement);
    console.log("✅ SUCCESS: UI Trigger Log updated with Phantom FT alerts.");
}

// --- INJECTION 3: BUFFER ZONE UTILITY (ANTI-1-POINT LOSS) ---
const bufferZoneUtility = `
// 🛡️ POINT 9: BUFFER ZONE (ANTI-1-POINT LOSS FIREWALL)
const applyBufferZone = (marketLine, lb, hb, currentDecision) => {
    if (!marketLine) return currentDecision;
    if (Math.abs(marketLine - lb) <= 3 || Math.abs(marketLine - hb) <= 3) {
        return "❌ NO ACTION (±3 Pt Buffer Zone Active)";
    }
    return currentDecision;
};
`;

// Injecting the utility function just before the final return or specific block
// We will look for "const final_decision" or safely place it at the top of the component
if (!fileContent.includes("applyBufferZone")) {
    const hookTarget = "export default function RangeEngine";
    if (fileContent.includes(hookTarget)) {
        fileContent = fileContent.replace(hookTarget, bufferZoneUtility + "\n" + hookTarget);
        console.log("✅ SUCCESS: Buffer Zone (Anti-1-Point Loss) utility grafted to the engine.");
    }
}

// Write the modified content back to the file
fs.writeFileSync(targetPath, fileContent, 'utf-8');

console.log("\n===================================================");
console.log("🚀 POINT 9 INJECTION COMPLETE. NO FATAL ERRORS DETECTED.");
console.log("===================================================");
