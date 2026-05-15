const fs = require('fs');
const path = require('path');

const filePath = path.join(process.cwd(), 'src/components/mockups/range-engine/RangeEngine.tsx');
const content = fs.readFileSync(filePath, 'utf8');
const lines = content.split('\n');

console.log('\n================================================================');
console.log('🚨 TASK 15: TARGETED DEEP ROOT EXTRACTION 🚨');
console.log('================================================================\n');

const extract = (name, startLine, endLine) => {
    console.log(`\n[📥 EXTRACTION SECTOR]: ${name} (Lines ${startLine} - ${endLine})`);
    console.log('------------------------------------------------');
    for (let i = startLine - 1; i < endLine; i++) {
        if (lines[i] !== undefined) {
            console.log(`${i + 1}: ${lines[i].replace(/\r/g, '')}`);
        }
    }
};

// 1. Interface Injection Sites
extract("EngineOutput Interface", 585, 600);
extract("ResearchData Interface", 670, 685);

// 2. Logic Injection Sites (Hammer Play & Volatility)
extract("Rule 16 Logic Block", 1230, 1260);

// 3. State & Tab Architecture Sites
extract("Tab State Initialization", 1725, 1735);
extract("Research State Initialization", 1890, 1905);

// Find where Tabs are rendered in UI
const uiTabStart = lines.findIndex(l => l.includes('onClick={() => setTab("analyzer")}'));
if (uiTabStart !== -1) {
    extract("Tab UI Component", uiTabStart - 5, uiTabStart + 15);
} else {
    console.log(`\n[📥 EXTRACTION SECTOR]: Tab UI Component`);
    console.log('------------------------------------------------');
    console.log('   [WARNING] Exact onClick setTab not found. Using fallback search.');
    const fallbackTab = lines.findIndex(l => l.includes('setTab') && l.includes('<button'));
    if (fallbackTab !== -1) extract("Tab UI Component (Fallback)", fallbackTab - 5, fallbackTab + 15);
}

console.log('\n================================================================');
console.log('✅ DEEP EXTRACTION COMPLETE. READY FOR SURGICAL INJECTION.');
console.log('================================================================\n');
