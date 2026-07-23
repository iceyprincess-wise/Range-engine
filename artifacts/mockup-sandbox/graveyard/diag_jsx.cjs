const fs = require('fs');
const targetPath = './src/components/mockups/range-engine/RangeEngine.tsx';
const lines = fs.readFileSync(targetPath, 'utf8').split('\n');

console.log('======================================================');
console.log(' 🔍 DIAGNOSTIC DUMP: LINES 1230 - 1265');
console.log('======================================================\n');

const start = 1230;
const end = 1265;

for (let i = start; i <= end; i++) {
    if (lines[i] !== undefined) {
        console.log(`${i + 1} | ${lines[i]}`);
    }
}
console.log('\n======================================================');
