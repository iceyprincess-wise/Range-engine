const fs = require('fs');
const path = require('path');

const TARGET_DIR = path.join(__dirname, 'src');

// Critical vulnerabilities and illusions identified from the VLOG
const searchTargets = {
    "HeaderUI": ["Splendor House", "House of Betting", "18+"],
    "AutocompleteNodes": ["Turkiye - Super Lig", "<input", "value={homeTeam}"],
    "ScannerIllusion": ["RESEARCH INTELLIGENCE ENGINE", "setTimeout", "Progress"],
    "FakeStaticData": ["Home Team 6W", "Advanced Form DNA", "Confirmed Out"],
    "MarketLineBug": ["150", "input type=\"number\"", "onChange={(e)"],
    "ReportVerifiers": ["View Classified Node Report", "NODE 01-03", "1,000,000+ SOURCES"],
    "Navigation": ["LIVE SYNC ACTIVE", "History"]
};

let scanResults = {};

function scanDirectory(dir) {
    if (!fs.existsSync(dir)) return;
    const files = fs.readdirSync(dir);

    files.forEach(file => {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);

        if (stat.isDirectory()) {
            scanDirectory(fullPath);
        } else if (stat.isFile() && /\.(tsx|ts|jsx|js)$/.test(file)) {
            const content = fs.readFileSync(fullPath, 'utf8');
            const lines = content.split('\n');

            Object.keys(searchTargets).forEach(category => {
                searchTargets[category].forEach(term => {
                    if (content.includes(term)) {
                        if (!scanResults[category]) scanResults[category] = {};
                        if (!scanResults[category][fullPath]) scanResults[category][fullPath] = [];
                        
                        // Grab line numbers
                        lines.forEach((line, index) => {
                            if (line.includes(term)) {
                                scanResults[category][fullPath].push({ line: index + 1, term: term });
                            }
                        });
                    }
                });
            });
        }
    });
}

console.log("\n=======================================================");
console.log("🔍 RANGE ENGINE V3 - TASK 14 DEEP SCAN INITIATED...");
console.log("=======================================================\n");

scanDirectory(TARGET_DIR);

let totalConflicts = 0;
Object.keys(scanResults).forEach(category => {
    console.log(`\n🚨 [${category}] Nodes Detected:`);
    Object.keys(scanResults[category]).forEach(filePath => {
        const relativePath = path.relative(__dirname, filePath);
        console.log(`   📂 ${relativePath}`);
        scanResults[category][filePath].forEach(hit => {
            console.log(`      L${hit.line} -> Found: "${hit.term}"`);
            totalConflicts++;
        });
    });
});

console.log("\n=======================================================");
console.log(`✅ SCAN COMPLETE. ${totalConflicts} POTENTIAL CONFLICT ZONES IDENTIFIED.`);
console.log("=======================================================\n");
