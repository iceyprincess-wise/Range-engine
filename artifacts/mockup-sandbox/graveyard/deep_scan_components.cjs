const fs = require('fs');
const path = require('path');

const targetFile = path.join(process.cwd(), 'src/components/mockups/range-engine/RangeEngine.tsx');
const content = fs.readFileSync(targetFile, 'utf-8').split('\n');

console.log("\n=======================================================");
console.log("🔍 PHASE 2: DEEP ROOT CHECK & BOUNDARY INSPECTION 🔍");
console.log("=======================================================\n");

function scanComponentSignature(name, lineNum) {
    console.log(`\n▶️ TARGET: ${name} (Near Line ${lineNum})`);
    const start = Math.max(0, lineNum - 3);
    const end = Math.min(content.length, lineNum + 15);
    
    console.log(`--- Code Snippet (${start + 1} to ${end}) ---`);
    for (let i = start; i < end; i++) {
        console.log(`${i + 1}: ${content[i]}`);
    }
    console.log("------------------------------------------");
}

scanComponentSignature("RangeEngine (Main)", 1741);
scanComponentSignature("LiveStatBar", 1830);
scanComponentSignature("PhantomLiveHub", 5018);

console.log("\n=======================================================");
console.log("✅ SECOND ROUND INSPECTION READY. AWAITING OUTPUT.");
console.log("=======================================================\n");
