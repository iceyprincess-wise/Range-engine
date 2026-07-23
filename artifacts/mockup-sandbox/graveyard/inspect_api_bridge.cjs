const fs = require('fs');
const path = require('path');

const targetFiles = [
    './src/components/mockups/range-engine/RangeEngine.tsx',
    './src/services/basketApi.ts',
    './src/hooks/useLiveSync.ts'
];

console.log("=================================================");
console.log("🔬 INITIATING TASK 14 API BRIDGE INSPECTION");
console.log("=================================================");

targetFiles.forEach(filePath => {
    if (fs.existsSync(filePath)) {
        console.log(`\n📂 SCANNING: ${filePath}`);
        const content = fs.readFileSync(filePath, 'utf-8');
        const lines = content.split('\n');
        
        lines.forEach((line, index) => {
            const lowerLine = line.toLowerCase();
            // Look for how history stores pending games, and how the API is structured
            if (
                lowerLine.includes('outcome: "pending"') || 
                lowerLine.includes('outcome: \'pending\'') ||
                lowerLine.includes('history.filter') ||
                lowerLine.includes('rapidapi') ||
                lowerLine.includes('fetch') ||
                lowerLine.includes('endpoint') ||
                lowerLine.includes('sethistory(')
            ) {
                // Filter out noise
                if (lowerLine.includes('console.log') || lowerLine.includes('=> (')) return;
                console.log(`   [Line ${index + 1}] -> ${line.trim().substring(0, 120)}`);
            }
        });
    } else {
        console.log(`\n⚠️ FILE NOT FOUND: ${filePath} (Skipping)`);
    }
});

console.log("\n✅ API BRIDGE INSPECTION COMPLETE.");
console.log("=================================================");
