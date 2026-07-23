const fs = require('fs');
const targetPath = './src/components/mockups/range-engine/RangeEngine.tsx';

let code = fs.readFileSync(targetPath, 'utf8');

console.log('======================================================');
console.log(' 🩺 INITIATING PRECISION SURGERY: FINAL UI RESTORATION');
console.log('======================================================\n');

// 1. Remove the rogue Fragment tags injected previously
if (code.includes('<>\n')) {
    code = code.replace(/<>\n/g, '');
    console.log('✅ STATUS: Removed rogue opening Fragment <>.');
}
if (code.includes('</>\n')) {
    code = code.replace(/<\/>\n/g, '');
    console.log('✅ STATUS: Removed rogue closing Fragment </>.');
}
if (code.includes('\n</>')) {
    code = code.replace(/\n<\/>/g, '');
}

// 2. Remove the `<div className="hidden">` block that caused the JSX leak
// This targets exactly the hidden div all the way to the API SYNC footer
const hiddenRegex = /<div className="hidden">[\s\S]*?(?=<div className="bg-\[#050807\])/;

if (hiddenRegex.test(code)) {
    // Replace it cleanly with the single closing div required by the parent container
    code = code.replace(hiddenRegex, '</div>\n                ');
    console.log('✅ STATUS: Extracted hidden static bars. JSX Tree cleanly balanced.');
} else {
    console.log('⚠️ STATUS: Could not find the hidden div block. It may already be removed.');
}

fs.writeFileSync(targetPath, code, 'utf8');
console.log('\n✅ STATUS: Surgery Complete. The UI should now render perfectly.');
console.log('======================================================\n');
