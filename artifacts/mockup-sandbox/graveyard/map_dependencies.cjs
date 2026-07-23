const fs = require('fs');
const path = require('path');

const targetFile = path.join(process.cwd(), 'src/components/mockups/range-engine/RangeEngine.tsx');
const content = fs.readFileSync(targetFile, 'utf-8');

console.log("\n=======================================================");
console.log("🧬 PHASE 2.5: EXACT BOUNDARY & DEPENDENCY MAPPING 🧬");
console.log("=======================================================\n");

function analyzeNestedComponent(name) {
    const regex = new RegExp(`(?:const|function)\\s+${name}\\s*=?\\s*(?:\\([^)]*\\))?\\s*(?:=>|{)`);
    const match = regex.exec(content);
    
    if (!match) {
        console.log(`❌ ERROR: Could not locate ${name}`);
        return;
    }

    const beforeMatch = content.substring(0, match.index);
    const startLine = beforeMatch.split('\n').length;
    
    let braceCount = 0;
    let started = false;
    let endIndex = match.index;

    for (let i = match.index; i < content.length; i++) {
        if (content[i] === '{') {
            braceCount++;
            started = true;
        } else if (content[i] === '}') {
            braceCount--;
        }

        if (started && braceCount === 0) {
            endIndex = i + 1;
            break;
        }
    }

    const endLine = content.substring(0, endIndex).split('\n').length;
    const componentBody = content.substring(match.index, endIndex);
    
    // Scan for external state dependencies used inside this component
    const potentialDependencies = ['liveStats', 'tab', 'apiError', 'isFetchingLive', 'homeTeam', 'awayTeam', 'setTab', 'triggerLiveSync'];
    const foundDeps = potentialDependencies.filter(dep => {
        // Look for the exact word boundary of the state variable
        const depRegex = new RegExp(`\\b${dep}\\b`);
        return depRegex.test(componentBody);
    });

    console.log(`✅ TARGET: ${name}`);
    console.log(`   - Start Line: ${startLine}`);
    console.log(`   - End Line: ${endLine}`);
    console.log(`   - Total Length: ${endLine - startLine + 1} lines`);
    console.log(`   - Dependencies to Wire as Props: ${foundDeps.length > 0 ? foundDeps.join(', ') : 'None detected'}\n`);
}

analyzeNestedComponent('LiveStatBar');
analyzeNestedComponent('PhantomLiveHub');

console.log("=======================================================");
console.log("✅ DEPENDENCY MAPPING COMPLETE. AWAITING OUTPUT.");
console.log("=======================================================\n");
