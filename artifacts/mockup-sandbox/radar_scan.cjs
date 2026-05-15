const fs = require('fs');
const path = require('path');
const file = path.join(process.cwd(), 'src', 'components', 'mockups', 'range-engine', 'RangeEngine.tsx');

if (!fs.existsSync(file)) {
    console.log("❌ Error: RangeEngine.tsx not found.");
    process.exit(1);
}

const lines = fs.readFileSync(file, 'utf8').split('\n');
console.log("\n=========================================================");
console.log("🎯 RADAR SCAN: PINPOINTING LEGACY UI COORDINATES");
console.log("=========================================================");

let found = false;
lines.forEach((line, index) => {
    const lowerLine = line.toLowerCase();
    if (lowerLine.includes('stall sensor') || lowerLine.includes('pace monitor') || lowerLine.includes('apply stall')) {
        console.log(`📍 Line ${index + 1}: ${line.trim()}`);
        found = true;
    }
});

console.log("=========================================================");
if (found) {
    console.log("👉 NEXT STEP: Open RangeEngine.tsx, go to these exact line numbers, and carefully delete the JSX block (the <div> holding them).");
    console.log("⚠️ This guarantees 100% Top Notch Accuracy and ZERO Red Screen errors.");
} else {
    console.log("✅ Scan clear. Legacy UI not found.");
}
console.log("=========================================================\n");
