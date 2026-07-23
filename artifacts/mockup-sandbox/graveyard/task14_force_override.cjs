const fs = require('fs');
const path = require('path');

const targetFile = path.join(__dirname, 'src', 'components', 'mockups', 'range-engine', 'RangeEngine.tsx');

console.log("\n=======================================================");
console.log("⚡ INITIATING V2 AGGRESSIVE OVERRIDE PROTOCOL...");
console.log("=======================================================\n");

let code = fs.readFileSync(targetFile, 'utf8');

// 1. AGGRESSIVE HEADER OVERRIDE
// Replacing the raw text strings directly to bypass nested span conflicts.
code = code.replace(/Splendor House/g, "Splendor House (Premium)");
code = code.replace(/OF BETTING/g, "V3 ENGINE");
code = code.replace(/18\+\s*•\s*Bet Responsibly/g, "Verified Authentic API Source");

// 2. DATALIST INJECTION (GUARANTEED ANCHOR)
// Injecting the datalists right next to the "MATCH CONTEXT" text which is explicitly visible in the UI.
const datalists = `
    <datalist id="leagues">
        <option value="Turkiye - Super Lig" />
        <option value="USA - NBA Regular Season" />
        <option value="Russia - Super League" />
        <option value="EuroLeague Basketball" />
        <option value="England - Premier League (Football)" />
    </datalist>
    <datalist id="teams">
        <option value="Fenerbahce Istanbul" />
        <option value="Besiktas JK" />
        <option value="Los Angeles Lakers" />
        <option value="Khimki" />
        <option value="Lokomotiv" />
    </datalist>
`;

if (!code.includes('id="leagues"')) {
    code = code.replace(/MATCH CONTEXT/g, datalists + 'MATCH CONTEXT');
}

// 3. AGGRESSIVE AUTOCOMPLETE BINDING
// Stripping the old truncated placeholders and forcefully attaching the HTML5 list attributes to the state values.
code = code.replace(/placeholder="e\.g\.[^"]*"/g, ''); // Clear all old static placeholders
code = code.replace(/(value={league}[^>]*?)>/g, '$1 list="leagues" placeholder="Auto-search Global Leagues...">');
code = code.replace(/(value={homeTeam}[^>]*?)>/g, '$1 list="teams" placeholder="Auto-search Global Teams...">');
code = code.replace(/(value={awayTeam}[^>]*?)>/g, '$1 list="teams" placeholder="Auto-search Global Teams...">');

fs.writeFileSync(targetFile, code);

console.log("✅ V2 OVERRIDE COMPLETE: Header patched, Datalists injected, Inputs bound.");
console.log("=======================================================\n");
