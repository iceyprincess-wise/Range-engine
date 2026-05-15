const fs = require('fs');
const path = require('path');

const filePath = path.join(process.cwd(), 'src/components/mockups/range-engine/RangeEngine.tsx');

if (!fs.existsSync(filePath)) {
    console.error(`🚨 FATAL ERROR: RangeEngine.tsx not found at ${filePath}`);
    process.exit(1);
}

const content = fs.readFileSync(filePath, 'utf8');
const lines = content.split('\n');

const scanTargets = {
    "HEADER_AND_UI_SECTOR": ['<header', '<nav', 'Splendor Hub', 'Coming Soon'],
    "AUTH_AND_STATE_SECTOR": ['const [', 'useState', 'owner', 'admin', 'role', 'isAdmin', 'isOwner'],
    "DATA_INTERFACE_SECTOR": ['interface', 'type ', 'bettingPercent', 'openingLine', 'currentLine'],
    "LOGIC_AND_RULE_SECTOR": ['Rule 1', 'Rule 13', 'Rule 14', 'Rule 16', 'HAMMER PLAY', 'decision', 'calculate', 'NO ACTION']
};

console.log('\n================================================================');
console.log('🚨 TASK 15 WIDE STRICT INSPECTION & DEEP ROOT SCAN 🚨');
console.log('================================================================\n');

Object.entries(scanTargets).forEach(([sector, terms]) => {
    console.log(`\n[🔍 SCANNING SECTOR]: ${sector}`);
    console.log('------------------------------------------------');
    terms.forEach(term => {
        let matchCount = 0;
        console.log(`\n>> Target: "${term}"`);
        lines.forEach((line, index) => {
            if (line.includes(term) && matchCount < 15) { 
                // Print a context buffer: 1 line above and the exact line
                if (index > 0 && matchCount === 0) console.log(`   ...`);
                console.log(`   Line ${index + 1}: ${line.trim()}`);
                matchCount++;
            }
        });
        if (matchCount >= 15) console.log(`   ... [WARNING: Output truncated to protect console buffer]`);
        if (matchCount === 0) console.log(`   [EMPTY] No matches found for "${term}".`);
    });
});

console.log('\n================================================================');
console.log('✅ INSPECTION COMPLETE. AWAITING SECOND ROUND VERIFICATION.');
console.log('================================================================\n');
