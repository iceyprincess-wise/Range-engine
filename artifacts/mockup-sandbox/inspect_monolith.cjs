const fs = require('fs');
const path = require('path');

const targetFile = path.join(process.cwd(), 'src/components/mockups/range-engine/RangeEngine.tsx');

console.log("\n=======================================================");
console.log("🛠️ RANGE ENGINE: WIDE STRICT INSPECTION PROTOCOL 🛠️");
console.log("=======================================================\n");

if (!fs.existsSync(targetFile)) {
    console.error(`🚨 CRITICAL ERROR: Target file not found at ${targetFile}`);
    process.exit(1);
}

const content = fs.readFileSync(targetFile, 'utf-8');
const lines = content.split('\n');

console.log(`✅ TOTAL FILE LINES CONFIRMED: ${lines.length}\n`);

console.log("🔍 SCANNING FOR COMPONENT DEFINITIONS (DECOUPLING TARGETS):");
// Regex to catch React component definitions (const ComponentName = ... or function ComponentName)
const componentRegex = /(?:const|function)\s+([A-Z][a-zA-Z0-9_]*)\s*=?\s*(?:\([^)]*\))?\s*(?:=>|{)/g;
let match;
let componentsFound = [];

while ((match = componentRegex.exec(content)) !== null) {
    const lineNumber = content.substring(0, match.index).split('\n').length;
    componentsFound.push({ name: match[1], line: lineNumber });
}

// Filter and display potential heavy components
const heavyKeywords = ['Dashboard', 'Table', 'Stats', 'Live', 'Chart', 'Grid'];
componentsFound.forEach(comp => {
    if (heavyKeywords.some(kw => comp.name.includes(kw))) {
         console.log(`   ➡️ POTENTIAL EXTRACTION TARGET: ${comp.name} (Starts near Line ~${comp.line})`);
    } else {
         console.log(`   - Found: ${comp.name} (Line ~${comp.line})`);
    }
});

console.log("\n🛡️ SCANNING PROTECTED ZONES (MUST NOT BE ALTERED):");
const protectedKeywords = ['Splendor', 'Smart Paste', 'Context', 'Matrix', 'Engine Logic', 'Datalist'];
protectedKeywords.forEach(kw => {
    const kwLines = lines.map((l, i) => l.toLowerCase().includes(kw.toLowerCase()) ? i + 1 : -1).filter(i => i !== -1);
    if (kwLines.length > 0) {
        console.log(`   🔒 ${kw}: Detected at lines: ${kwLines.slice(0, 4).join(', ')}${kwLines.length > 4 ? '... (Multiple instances)' : ''}`);
    } else {
        console.log(`   ⚠️ WARNING: ${kw} NOT DETECTED IN SCAN.`);
    }
});

console.log("\n=======================================================");
console.log("✅ INSPECTION COMPLETE. WAITING FOR SURGICAL SCRIPT PHASE.");
console.log("=======================================================\n");
