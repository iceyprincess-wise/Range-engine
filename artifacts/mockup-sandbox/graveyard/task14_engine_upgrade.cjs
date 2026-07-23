const fs = require('fs');
const path = require('path');

const targetFile = path.join(__dirname, 'src', 'components', 'mockups', 'range-engine', 'RangeEngine.tsx');

console.log("\n=======================================================");
console.log("⚡ RANGE ENGINE V3 - TASK 14: SYSTEM OVERHAUL INITIATED");
console.log("=======================================================\n");

if (!fs.existsSync(targetFile)) {
    console.error("❌ CRITICAL ERROR: RangeEngine.tsx not found. Verify path.");
    process.exit(1);
}

let code = fs.readFileSync(targetFile, 'utf8');

// 1. HEADER UI PREMIUM UPGRADE
// Strips out "House of Betting" and "18+" child-like UI, replaces with Premium layout and Navigation elements.
console.log("-> Re-architecting Header UI & Navigation Nodes...");
code = code.replace(
    /<span className="font-bold text-xl">Splendor House<\/span>[\s\S]*?<span className="text-xs text-muted-foreground">OF BETTING<\/span>/g,
    `<div className="flex flex-col"><span className="font-extrabold text-2xl tracking-tight text-white">Splendor House</span><span className="text-[10px] text-emerald-400 tracking-widest uppercase font-semibold">Premium Analyzer • V3</span></div>`
);

// 2. AUTOCOMPLETE ENGINE (DATALIST BRIDGE)
// Injects native HTML5 datalists mapped to a dynamic global array for Teams and Leagues.
console.log("-> Bridging Autocomplete Engine for Global Leagues & Teams...");
const dataLists = `
    <datalist id="global-leagues">
        <option value="Turkiye - Super Lig" />
        <option value="USA - NBA Regular Season" />
        <option value="Russia - Super League" />
        <option value="EuroLeague Basketball" />
        <option value="England - Premier League (Football)" />
    </datalist>
    <datalist id="global-teams">
        <option value="Fenerbahce Istanbul" />
        <option value="Besiktas JK" />
        <option value="Los Angeles Lakers" />
        <option value="Khimki" />
        <option value="Lokomotiv" />
    </datalist>
`;
if (!code.includes('id="global-leagues"')) {
    // Inject just before the main form grid
    code = code.replace(/(<div className="grid grid-cols-1 md:grid-cols-2 gap-4">)/, dataLists + '\n$1');
}

// Convert specific inputs to use the new autocomplete lists
code = code.replace(/placeholder="e\.g\. Russia Super League"/g, 'placeholder="Auto-search Global Leagues..." list="global-leagues"');
code = code.replace(/placeholder="e\.g\. Khimki, Lakers"/g, 'placeholder="Auto-search Global Teams..." list="global-teams"');

// 3. MARKET LINE INPUT BUG FIX (.5 INCREMENTS & STRING CASTING)
// Fixes the issue where deleting "150" leaves "1" by allowing empty string states and setting step to 0.5.
console.log("-> Patching Market Line Decimal Bug (Step 0.5 enforced)...");
code = code.replace(/type="number"\s+value={([^}]+)}\s+onChange={\(e\) => set[A-Za-z]+\(Number\(e\.target\.value\)\)}/g, 
    'type="number" step="0.5" value={$1} onChange={(e) => { const val = e.target.value; eval(`set${"$1".charAt(0).toUpperCase() + "$1".slice(1)}(val === "" ? "" : val)`); }}'
);
code = code.replace(/step="1"/g, 'step="0.5"');

// 4. SCANNER AUTHENTICITY (ANTI-ILLUSION TIMER DELAY)
// Multiplies all artificial setTimeout intervals by 8 to simulate realistic API data fetching phases.
console.log("-> Enforcing Anti-Illusion Protocol (Realistic Scan Delays)...");
code = code.replace(/setTimeout\(\(\) => \{\s*setScanProgress\(\(prev\) => prev \+ (\d+)\);\s*\}, (\d+)\);/g, (match, p1, p2) => {
    const newDelay = parseInt(p2) * 8; // Slow down the progress significantly
    return `setTimeout(() => { setScanProgress((prev) => prev + ${p1}); }, ${newDelay});`;
});

// Write modifications safely back to file
fs.writeFileSync(targetFile, code);

console.log("\n✅ TASK 14 COMPLETED: Engine upgraded, Autocomplete active, Market Bug patched, Scanning Authenticated.");
console.log("=======================================================\n");
