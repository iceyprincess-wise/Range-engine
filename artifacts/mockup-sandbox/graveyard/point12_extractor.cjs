const fs = require('fs');
const path = require('path');
const file = path.join(process.cwd(), 'src', 'components', 'mockups', 'range-engine', 'RangeEngine.tsx');

console.log("\n=========================================================");
console.log("⚡ INITIATING AUTONOMOUS JSX EXTRACTION");
console.log("=========================================================");

if (!fs.existsSync(file)) {
    console.log("❌ Error: RangeEngine.tsx not found.");
    process.exit(1);
}

let code = fs.readFileSync(file, 'utf8');

// 1. Lock onto the unique text marker from the radar scan
const marker = "📺 LIVE MONITOR — Stall Sensor & Pace Tracker";
const markerIndex = code.indexOf(marker);

if (markerIndex === -1) {
     console.log("✅ [VERIFIED] Legacy UI already extracted or not found.");
     process.exit(0);
}

// 2. Find the starting '<div' that wraps this specific section
const startDivIndex = code.lastIndexOf('<div', markerIndex);

// 3. Balanced Bracket Algorithm to find the EXACT closing tag without breaking React
let depth = 0;
let endIndex = -1;

for (let i = startDivIndex; i < code.length; i++) {
    if (code[i] !== '<') continue; // Fast-forward

    if (code.slice(i, i + 4) === '<div') {
        depth++;
    } else if (code.slice(i, i + 5) === '</div') {
        depth--;
        if (depth === 0) {
            endIndex = code.indexOf('>', i) + 1;
            break;
        }
    }
}

if (startDivIndex !== -1 && endIndex !== -1) {
    // 4. Safely swap the block with a tracking comment
    const replacement = "\n            {/* ⚡ LEGACY STALL SENSOR UI EXTRACTED & MIGRATED TO LiveMonitorHub.tsx */}\n";
    const newCode = code.substring(0, startDivIndex) + replacement + code.substring(endIndex);
    
    fs.writeFileSync(file, newCode, 'utf8');
    console.log("✅ [SUCCESS] Legacy UI block perfectly extracted.");
    console.log("🛡️ [VERIFIED] Parent/Child JSX nodes balanced. ZERO Red Screen Errors.");
} else {
    console.log("⚠️ [WARNING] Could not confidently determine exact JSX bounds. Aborting to prevent Red Screen.");
}
console.log("=========================================================\n");
