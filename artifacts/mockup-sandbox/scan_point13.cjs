const fs = require('fs');

const targetPath = './src/components/mockups/range-engine/RangeEngine.tsx';

console.log('======================================================');
console.log(' 🔍 INITIATING DEEP SCAN: < POINT 13 > ARCHITECTURE');
console.log('======================================================\n');

if (!fs.existsSync(targetPath)) {
    console.error(`❌ ERROR: File not found at ${targetPath}`);
    process.exit(1);
}

const content = fs.readFileSync(targetPath, 'utf-8');
const lines = content.split('\n');

// Target keywords for Live UI Hub & Momentum Avalanche
const targets = [
    'Live', 'Hub', 'Momentum', 'Avalanche', 'Phantom', 
    'Delta', 'usePreviousState', 'Possession', 'FT%', 
    'FG%', 'Lead', 'Bleed', 'PPG'
];

let matchCount = 0;

console.log('--- SCAN RESULTS ---');
lines.forEach((line, index) => {
    const lowerLine = line.toLowerCase();
    const isMatch = targets.some(target => lowerLine.includes(target.toLowerCase()));
    
    if (isMatch) {
        // Filter out generic React/HTML matches that might flood the console
        if (!lowerLine.includes('<div>') && !lowerLine.includes('className=')) {
            console.log(`[Line ${index + 1}] => ${line.trim()}`);
            matchCount++;
        }
    }
});

console.log('\n======================================================');
if (matchCount === 0) {
    console.log('✅ STATUS: ZERO CONFLICTS DETECTED.');
    console.log('✅ ANALYSIS: Clean slate confirmed. Ready for full Phantom-Delta injection.');
} else {
    console.log(`⚠️ STATUS: ${matchCount} POTENTIAL CONFLICTS/FRAGMENTS DETECTED.`);
    console.log('⚠️ ANALYSIS: Review lines above before proceeding with injection.');
}
console.log('======================================================\n');
