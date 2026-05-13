const fs = require('fs');

const targetPath = './src/components/mockups/range-engine/RangeEngine.tsx';

console.log('======================================================');
console.log(' 🔍 DEEP SCAN: BASKETAPI (RECODEX) & LIVE UI ARCHITECTURE');
console.log('======================================================\n');

if (!fs.existsSync(targetPath)) {
    console.error(`❌ ERROR: File not found at ${targetPath}`);
    process.exit(1);
}

const content = fs.readFileSync(targetPath, 'utf-8');
const lines = content.split('\n');

const targets = [
    'rapidapi', 'basketapi', 'x-rapidapi-key', 'fetch(', 'axios', 
    'Caneros', 'Metros', 'Field Goals', 'Rebounds', 'Fouls', 'liveStats'
];

let matchCount = 0;

console.log('--- SCAN RESULTS ---');
lines.forEach((line, index) => {
    const lowerLine = line.toLowerCase();
    const isMatch = targets.some(target => lowerLine.includes(target.toLowerCase()));
    
    if (isMatch) {
        // Filter out extreme noise, keep the core logic
        if (!lowerLine.includes('className=') || lowerLine.includes('fetch') || lowerLine.includes('rapidapi')) {
            console.log(`[Line ${index + 1}] => ${line.trim()}`);
            matchCount++;
        }
    }
});

console.log('\n======================================================');
console.log(`✅ STATUS: ${matchCount} API & UI fragments located.`);
console.log('======================================================\n');
