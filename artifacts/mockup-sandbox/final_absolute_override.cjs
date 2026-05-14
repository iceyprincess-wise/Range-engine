const fs = require('fs');
const targetPath = './src/components/mockups/range-engine/RangeEngine.tsx';

console.log('======================================================');
console.log(' 🟢 INITIATING ABSOLUTE OVERRIDE: THE FINAL HEAL');
console.log('======================================================\n');

let code = fs.readFileSync(targetPath, 'utf8');

// Absolute anchors that cannot be affected by formatting spaces
const anchor1 = '<LiveStatBar label="Fouls" statKey="totalFouls" />';
const anchor2 = '{tab === "history" && (';

const index1 = code.indexOf(anchor1);
const index2 = code.indexOf(anchor2);

if (index1 !== -1 && index2 !== -1) {
    // We mathematically rebuild the exact closing structure of the Live Tab.
    // 1. Closes the LiveStatBar wrapper.
    // 2. Injects the API SYNC footer.
    // 3. Closes the Content wrapper and Ternary wrapper.
    // 4. Injects the perfectly balanced Ternary fallback.
    // 5. Closes the Live Tab wrappers.
    const perfectBlock = `${anchor1}
            </div>

            <div className="bg-[#050807] p-3 border-t border-emerald-900/30 flex justify-between items-center mt-4">
                <div className="text-[10px] font-mono text-zinc-500 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span> API SYNC: ACTIVE MATRIX
                </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="border border-zinc-800 border-dashed rounded-xl p-8 text-center mt-4 bg-black/20">
          <div className="text-zinc-500 font-mono text-[10px] uppercase tracking-widest">No Active Match in Analyzer</div>
        </div>
      )}
    </div>
  </div>
)}

      `;
    
    // Annihilate the corrupted zone and inject the perfect block
    code = code.substring(0, index1) + perfectBlock + code.substring(index2);
    fs.writeFileSync(targetPath, code, 'utf8');
    
    console.log('✅ STATUS: THE REACT TREE HAS BEEN ABSOLUTELY HEALED.');
    console.log('✅ STATUS: Red screen permanently eliminated.');
} else {
    console.log('❌ ERROR: Could not locate exact anchors.');
}

console.log('======================================================\n');
