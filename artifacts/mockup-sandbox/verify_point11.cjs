const fs = require('fs');
const path = require('path');

// Target the main engine file
const filePath = path.join(process.cwd(), 'src/components/mockups/range-engine/RangeEngine.tsx');

if (!fs.existsSync(filePath)) {
    console.log("❌ [ ERROR ]: RangeEngine.tsx not found at " + filePath);
    console.log("Check your directory path and try again.");
    process.exit(1);
}

const content = fs.readFileSync(filePath, 'utf8');
const lines = content.split('\n');

console.log("===============================================================");
console.log("🔍 [ DEEP SCAN INITIATED ]: Point 11 - 60-Second Auto-Sync Timer");
console.log("===============================================================\n");

// Targeted regex variables for countdown and sync logic
const keywords = [
    /countdown/i, 
    /setInterval/i, 
    /clearInterval/i, 
    /autoSync/i, 
    /autoUpdate/i, 
    /timer/i,
    /timeLeft/i
];

let matchCount = 0;

lines.forEach((line, index) => {
    if (keywords.some(regex => regex.test(line))) {
        // Filter out basic React imports to keep terminal clean
        if (!line.includes("import") && !line.includes("export")) {
            console.log(`[ Line ${index + 1} ] > ${line.trim()}`);
            matchCount++;
        }
    }
});

console.log("\n===============================================================");
if (matchCount === 0) {
    console.log("⚠️ [ STATUS ]: NO FRAGMENTS DETECTED. YET TO BE DONE.");
    console.log("Engine is clear. Ready for fresh Top Notch injection.");
} else {
    console.log(`✅ [ STATUS ]: FOUND ${matchCount} LINES OF RELEVANT LOGIC.`);
    console.log("Review required to determine if Halfway Done or Needs Fixing.");
}
console.log("===============================================================");
