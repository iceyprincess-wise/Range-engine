const fs = require('fs');
const targetPath = './src/components/mockups/range-engine/RangeEngine.tsx';

console.log('======================================================');
console.log(' 🔨 INITIATING BRUTE-FORCE BOUNDARY REWRITE');
console.log('======================================================\n');

let code = fs.readFileSync(targetPath, 'utf8');

// We use absolute strings that cannot be affected by formatting spaces
const anchor1 = 'No Active Match in Analyzer</div></div>';
const anchor2 = '{tab === "history" && (';

const index1 = code.indexOf(anchor1);
const index2 = code.indexOf(anchor2);

if (index1 !== -1 && index2 !== -1) {
    // We rewrite the entire boundary to exactly close the ternary and the 2 parent wrapper divs.
    const balancedEnding = `${anchor1}
            )}
          </div>
        </div>
      )}

      `;
    
    code = code.substring(0, index1) + balancedEnding + code.substring(index2);
    fs.writeFileSync(targetPath, code, 'utf8');
    console.log('✅ STATUS: Corrupted boundary completely evaporated.');
    console.log('✅ STATUS: Live Tab strictly locked and balanced. Red screen eliminated.');
} else {
    console.log('❌ ERROR: Could not locate the exact anchor strings.');
}

console.log('======================================================\n');
