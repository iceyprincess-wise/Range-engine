const fs = require('fs');
const targetPath = './src/components/mockups/range-engine/RangeEngine.tsx';

let code = fs.readFileSync(targetPath, 'utf8');

console.log('======================================================');
console.log(' 🩹 INITIATING SURGICAL FIX: REACT FRAGMENT SHIELD');
console.log('======================================================\n');

const liveStartStr = '{tab === "live" && (';
const histStartStr = '{tab === "history" && (';

const liveStartIndex = code.indexOf(liveStartStr);
const histStartIndex = code.indexOf(histStartStr);

if (liveStartIndex !== -1 && histStartIndex !== -1) {
    let beforeLive = code.substring(0, liveStartIndex + liveStartStr.length);
    let liveContent = code.substring(liveStartIndex + liveStartStr.length, histStartIndex);
    
    const lastBracketIndex = liveContent.lastIndexOf(')}');
    
    if (lastBracketIndex !== -1) {
        // Wrap the entire block inside <> and </>
        liveContent = '\n<>\n' + liveContent.substring(0, lastBracketIndex) + '\n</>\n' + liveContent.substring(lastBracketIndex);
        
        code = beforeLive + liveContent + code.substring(histStartIndex);
        fs.writeFileSync(targetPath, code, 'utf8');
        console.log('✅ STATUS: React Fragment <>...</> applied. Adjacent JSX elements secured.');
    } else {
        console.log('❌ ERROR: Could not find the closing bracket for the Live tab.');
    }
} else {
    console.log('❌ ERROR: Could not locate tab boundaries.');
}

console.log('======================================================\n');
