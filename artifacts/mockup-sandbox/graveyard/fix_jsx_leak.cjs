const fs = require('fs');
const targetPath = './src/components/mockups/range-engine/RangeEngine.tsx';

let code = fs.readFileSync(targetPath, 'utf8');

console.log('======================================================');
console.log(' 🔧 INITIATING SURGICAL FIX: SEALING JSX LEAK');
console.log('======================================================\n');

// Safely split the file at the start of the History Tab
const parts = code.split('{tab === "history" && (');

if (parts.length >= 2) {
    let firstPart = parts[0];
    
    // Find the closing bracket of the Live Tab just before the History Tab
    const lastBracketIndex = firstPart.lastIndexOf(')}');
    
    if (lastBracketIndex !== -1) {
        // Inject the missing closing div
        firstPart = firstPart.substring(0, lastBracketIndex) + '</div>\n' + firstPart.substring(lastBracketIndex);
        
        // Reassemble the file
        const finalCode = firstPart + '{tab === "history" && (' + parts.slice(1).join('{tab === "history" && (');
        
        fs.writeFileSync(targetPath, finalCode, 'utf8');
        console.log('✅ STATUS: JSX Containment Leak sealed. React tree balanced.');
    } else {
        console.log('⚠️ ERROR: Could not find the closing bracket of the Live Tab.');
    }
} else {
    console.log('⚠️ ERROR: Could not locate the History Tab boundary.');
}

console.log('======================================================\n');
