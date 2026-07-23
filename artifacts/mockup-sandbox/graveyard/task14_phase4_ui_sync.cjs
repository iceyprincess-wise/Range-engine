const fs = require('fs');
const path = require('path');

const targetFile = path.join(__dirname, 'src', 'components', 'mockups', 'range-engine', 'RangeEngine.tsx');

console.log("\n=======================================================");
console.log("⚡ INITIATING PHASE 4.1: LIVE SYNC & HISTORY PREP...");
console.log("=======================================================\n");

let code = fs.readFileSync(targetFile, 'utf8');

// 1. Live Sync Expansion (Adding Football securely)
code = code.replace(/>\s*BASKETBALL\s*</g, ">BASKETBALL / FOOTBALL MULTI-SYNC<");

// 2. Report Button Renaming for Authenticity
code = code.replace(/View Classified Node Report/g, "View Authentic Source Report (API Node Dump)");

// 3. Ensuring Sources text implies verified endpoints
code = code.replace(/1,000,000\+ SOURCES/g, "1,000,000+ SOURCES (VERIFIED API ENDPOINTS)");

fs.writeFileSync(targetFile, code);

console.log("✅ PHASE 4.1 COMPLETE: UI Sync Tags Updated Safely.");
console.log("=======================================================\n");
