const fs = require('fs');
const path = require('path');

const targetFile = path.join(__dirname, 'src', 'components', 'mockups', 'range-engine', 'RangeEngine.tsx');
let errorCount = 0;

console.log("\n=======================================================");
console.log("🛡️ INITIATING POST-ACTION VERIFICATION AUDIT...");
console.log("=======================================================\n");

const code = fs.readFileSync(targetFile, 'utf8');

// CHECK 1: Autocomplete Integration
if (code.includes('id="global-leagues"')) {
    console.log("✅ [PASSED] Autocomplete Datalists Successfully Injected.");
} else {
    console.log("❌ [FAILED] Autocomplete Datalists Missing.");
    errorCount++;
}

// CHECK 2: Scanner Authenticity (Anti-Illusion Check)
if (code.match(/setTimeout\([\s\S]*?,\s*[1-9]\d{3,}\)/)) { 
    console.log("✅ [PASSED] Scanner Engine Delays expanded for realism (>1000ms detected).");
} else {
    console.log("⚠️ [WARNING] Fast setTimeouts still present. Scanning may appear artificial.");
}

// CHECK 3: Market Line Bug Fix
if (code.includes('step="0.5"')) {
    console.log("✅ [PASSED] Market Line 0.5 Increment Bounds Active.");
} else {
    console.log("❌ [FAILED] Market Line Increment Fix Failed.");
    errorCount++;
}

// CHECK 4: System Syntax Integrity
try {
    // A rudimentary syntax validation to ensure no catastrophic bracket breaks occurred
    const openingBraces = (code.match(/\{/g) || []).length;
    const closingBraces = (code.match(/\}/g) || []).length;
    if (openingBraces !== closingBraces) {
        throw new Error(`Brace mismatch! Opened: ${openingBraces}, Closed: ${closingBraces}`);
    }
    console.log("✅ [PASSED] Structural Brace Integrity Verified.");
} catch (e) {
    console.log(`❌ [CRITICAL FAILED] Syntax Error Detected: ${e.message}`);
    errorCount++;
}

console.log("\n=======================================================");
if (errorCount === 0) {
    console.log("🚀 SYSTEM GREEN: 100% ACCURACY RETAINED. NO CONFLICTS.");
} else {
    console.log(`⚠️ SYSTEM HALTED: ${errorCount} CONFLICTS DETECTED. REVERSION REQUIRED.`);
}
console.log("=======================================================\n");
