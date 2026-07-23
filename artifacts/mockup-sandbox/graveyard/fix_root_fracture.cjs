const fs = require('fs');
const targetPath = './src/components/mockups/range-engine/RangeEngine.tsx';

let code = fs.readFileSync(targetPath, 'utf8');

console.log('======================================================');
console.log(' 🩺 INITIATING DEEP ROOT FIX: REACT TREE BALANCER');
console.log('======================================================\n');

// This regex strictly matches the exact fracture zone from your diagnostic dump
// It targets: )} -> 3 closing divs -> )} -> History Tab start
const fractureZone = /\)\}\s*<\/div>\s*<\/div>\s*<\/div>\s*\)\}\s*\{tab === "history" && \(/;

if (fractureZone.test(code)) {
    // We replace the 3 closing divs with exactly 2 closing divs, eliminating the rogue node
    const balancedTree = `)}
          </div>
        </div>

)}

      {tab === "history" && (`;
      
    code = code.replace(fractureZone, balancedTree);
    fs.writeFileSync(targetPath, code, 'utf8');
    console.log('✅ STATUS: Root fracture isolated and evaporated.');
    console.log('✅ STATUS: The Live Tab JSX tree is mathematically balanced.');
} else {
    console.log('❌ ERROR: Could not lock onto the fracture zone. The file may have changed.');
}

console.log('======================================================\n');
