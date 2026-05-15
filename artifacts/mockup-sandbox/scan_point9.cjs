const fs = require('fs');
const path = require('path');

const targetPath = path.join(__dirname, 'src', 'components', 'mockups', 'range-engine', 'RangeEngine.tsx');

console.log("===================================================");
console.log("🧠 DEEP SCAN INTELLIGENCE: POINT 9 VERIFICATION");
console.log("===================================================\n");

if (!fs.existsSync(targetPath)) {
    console.error(`❌ ERROR: Target file not found at ${targetPath}`);
    console.log("Please verify the directory structure.\n");
    process.exit(1);
}

const fileContent = fs.readFileSync(targetPath, 'utf-8');
const lines = fileContent.split('\n');

const searchTerms = {
    "Buffer Zone (Anti-1-Point Loss)": [/buffer\s*zone/i, /anti-?1-?point/i, /\+\/?-\s*3\s*point\s*protection/i],
    "Foul Engine (Endgame/Overtime)": [/foul\s*engine/i, /margin\s*<=\s*6/i, /high\s*bound\s*\+\s*1[02]/i],
    "Referee Whistle-Rate Sensor": [/referee\s*whistle/i, /anomaly\s*sensor/i, /phantom\s*free\s*throws/i, /2\.5\s*points/i]
};

let allClear = true;

for (const [feature, regexes] of Object.entries(searchTerms)) {
    let found = false;
    for (let i = 0; i < lines.length; i++) {
        for (const regex of regexes) {
            if (regex.test(lines[i])) {
                console.log(`⚠️  FOUND [${feature}] at Line ${i + 1}:`);
                console.log(`   👉 ${lines[i].trim()}`);
                found = true;
                allClear = false;
                break;
            }
        }
    }
    if (!found) {
        console.log(`❌ MISSING: [${feature}] is completely absent from the engine.`);
    }
}

console.log("\n===================================================");
if (allClear) {
    console.log("STATUS: CLEAN SLATE. Ready for Top Notch Injection.");
} else {
    console.log("STATUS: PARTIAL DATA FOUND. Requires surgical update.");
}
console.log("===================================================");
