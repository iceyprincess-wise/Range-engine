const fs = require('fs');
const targetPath = './src/components/mockups/range-engine/RangeEngine.tsx';
const lines = fs.readFileSync(targetPath, 'utf8').split('\n');

console.log('======================================================');
console.log(' 🔍 DIAGNOSTIC DUMP: LINES 1225 - 1255');
console.log('======================================================\n');

for (let i = 1225; i <= 1255; i++) {
    if (lines[i] !== undefined) {
        console.log(`${i + 1} | ${lines[i]}`);
    }
}
console.log('\n======================================================');
