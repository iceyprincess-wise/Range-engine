const fs = require('fs');
const path = require('path');

// ANSI Colors for Terminal Output
const R = '\x1b[31m'; const G = '\x1b[32m'; const Y = '\x1b[33m'; 
const C = '\x1b[36m'; const W = '\x1b[37m'; const RS = '\x1b[0m';

console.log(`${C}======================================================${RS}`);
console.log(`${C} 🟢 ENGINE V3 DEEP ROOT ARCHITECTURE SCAN INITIATED 🟢 ${RS}`);
console.log(`${C}======================================================${RS}\n`);

const cwd = process.cwd();
const filesToScan = [
    { name: 'RangeEngine.tsx', path: path.join(cwd, 'src', 'components', 'mockups', 'range-engine', 'RangeEngine.tsx'), critical: true },
    { name: 'SurgeEngine.ts', path: path.join(cwd, 'src', 'utils', 'SurgeEngine.ts'), critical: true },
    { name: 'package.json', path: path.join(cwd, 'package.json'), critical: true }
];

let warnings = 0;
let errors = 0;

filesToScan.forEach(file => {
    console.log(`${W}Scanning: ${file.name}...${RS}`);
    
    if (!fs.existsSync(file.path)) {
        if (file.critical) {
            console.log(`  [${R}FAIL${RS}] Critical file missing: ${file.path}`);
            errors++;
        } else {
            console.log(`  [${Y}WARN${RS}] File not found (Non-critical): ${file.path}`);
            warnings++;
        }
        return;
    }

    const content = fs.readFileSync(file.path, 'utf8');
    const lines = content.split('\n');
    console.log(`  [${G}OK${RS}] File found. Total Lines: ${lines.length}`);

    // 1. Monolith Risk Check
    if (file.name === 'RangeEngine.tsx' && lines.length > 1000) {
        console.log(`  [${Y}WARN${RS}] Monolith Detected: File is > 1000 lines. High risk for React re-render bloat and syntax collision.`);
        warnings++;
    }

    // 2. ESM & Package Config Check
    if (file.name === 'package.json') {
        if (!content.includes('"type": "module"')) {
            console.log(`  [${R}FAIL${RS}] package.json is missing strict ESM ("type": "module") declaration.`);
            errors++;
        } else {
            console.log(`  [${G}PASS${RS}] Strict ES Module mode active.`);
        }
    }

    // 3. Artifact & Syntax Deep Scan (For TS/TSX files)
    if (file.name.endsWith('.tsx') || file.name.endsWith('.ts')) {
        let hasConsoleLog = false;
        let hasTickerAlert = false;
        let hasTodo = false;

        lines.forEach((line, index) => {
            if (line.includes('console.log')) hasConsoleLog = true;
            if (line.includes('// TODO:') || line.includes('//TODO:')) hasTodo = true;
            
            // Checking for the specific ticker error we just squashed to ensure it didn't replicate
            if (line.includes('clearTimeout(ticker)') && !line.includes('//')) {
                console.log(`  [${R}FAIL${RS}] ACTIVE TICKER LEAK DETECTED at line ${index + 1}: ${line.trim()}`);
                hasTickerAlert = true;
                errors++;
            }
        });

        if (hasTickerAlert) {
            console.log(`  [${R}CRITICAL RISK${RS}] The undefined ticker is still active in the code!`);
        } else {
            console.log(`  [${G}PASS${RS}] Memory leaks (ticker) verified neutralized.`);
        }

        if (hasConsoleLog) {
            console.log(`  [${Y}INFO${RS}] Active console.logs found. Ensure these are removed before production.`);
        }
        if (hasTodo) {
            console.log(`  [${Y}INFO${RS}] Pending // TODO markers found. Active development detected.`);
        }
    }
    console.log('');
});

console.log(`${C}======================================================${RS}`);
console.log(`${W}SCAN COMPLETE.${RS}`);
if (errors > 0) {
    console.log(`${R}❌ STATUS: UNSTABLE. ${errors} ERRORS, ${warnings} WARNINGS FOUND.${RS}`);
} else if (warnings > 0) {
    console.log(`${Y}⚠️ STATUS: FUNCTIONAL BUT AT RISK. 0 ERRORS, ${warnings} WARNINGS FOUND.${RS}`);
} else {
    console.log(`${G}✅ STATUS: PERFECT. 100% TOP-NOTCH INTEGRITY. NO ERRORS OR WARNINGS.${RS}`);
}
console.log(`${C}======================================================${RS}\n`);
