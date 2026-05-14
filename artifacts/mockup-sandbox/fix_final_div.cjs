const fs = require('fs');
const targetPath = './src/components/mockups/range-engine/RangeEngine.tsx';

let code = fs.readFileSync(targetPath, 'utf8');

console.log('======================================================');
console.log(' ⚖️ INITIATING SURGICAL FIX: REACT TREE BALANCER');
console.log('======================================================\n');

// Safely target the excess divs at the exact boundary of the Live tab
const fallbackRegex = /<\/div>\s*<\/div>\s*<\/div>\s*\)\}/;

if (fallbackRegex.test(code)) {
    // Replace 3 closing divs with 2, perfectly balancing the wrappers
    code = code.replace(fallbackRegex, '</div>\n        </div>\n\n)}');
    fs.writeFileSync(targetPath, code, 'utf8');
    console.log('✅ STATUS: Excess </div> evaporated. React Tree perfectly balanced.');
} else {
    // Failsafe 2: Look for 4 closing divs if the unbalance is deeper
    const deepRegex = /<\/div>\s*<\/div>\s*<\/div>\s*<\/div>\s*\)\}/;
    if (deepRegex.test(code)) {
        code = code.replace(deepRegex, '</div>\n        </div>\n        </div>\n\n)}');
        fs.writeFileSync(targetPath, code, 'utf8');
        console.log('✅ STATUS: Excess </div> evaporated via deep scan.');
    } else {
        console.log('❌ ERROR: Could not find the unbalanced boundary.');
    }
}

console.log('======================================================\n');
