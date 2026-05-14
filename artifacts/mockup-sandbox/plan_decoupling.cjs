const fs = require('fs');
const path = require('path');

const targetFile = path.join(process.cwd(), 'src/components/mockups/range-engine/RangeEngine.tsx');
const content = fs.readFileSync(targetFile, 'utf-8');

console.log("\n=======================================================");
console.log("🧬 PHASE 3: ADVANCED AST-LEVEL EXTRACTION SCAN 🧬");
console.log("=======================================================\n");

function getComponentBody(code, name) {
    const regex = new RegExp(`(?:const|function)\\s+${name}\\b`);
    const match = code.match(regex);
    if (!match) return null;

    let fullText = code.substring(match.index);
    let charStack = [];
    let inString = false;
    let stringChar = '';
    let foundFirstBrace = false;
    let endIndex = 0;

    for (let i = 0; i < fullText.length; i++) {
        let char = fullText[i];

        if (inString) {
            if (char === stringChar && fullText[i - 1] !== '\\') inString = false;
            continue;
        }

        if (char === '"' || char === "'" || char === '`') {
            inString = true;
            stringChar = char;
            continue;
        }

        if (char === '{' || char === '(' || char === '[') {
            charStack.push(char);
            if (char === '{') foundFirstBrace = true;
        } else if (char === '}' || char === ')' || char === ']') {
            charStack.pop();
        }

        // Break when the main block finishes, bypassing arrow operators
        if (foundFirstBrace && charStack.length === 0) {
            let nextChars = fullText.substring(i + 1, i + 20).trim();
            if (nextChars.startsWith('=>')) {
                continue; 
            }
            endIndex = i + 1;
            if (fullText[endIndex] === ';') endIndex++;
            break;
        }
    }

    return fullText.substring(0, endIndex);
}

const liveStatBarCode = getComponentBody(content, 'LiveStatBar');
const phantomLiveHubCode = getComponentBody(content, 'PhantomLiveHub');

function analyzeDependencies(name, codeBlock) {
    if (!codeBlock) {
        console.log(`❌ ${name} not found.`);
        return;
    }
    
    console.log(`✅ TARGET: ${name}`);
    console.log(`   - True Length: ${codeBlock.split('\n').length} lines`);
    
    // Matrix State Check
    const states = ['liveStats', 'tab', 'apiError', 'isFetchingLive', 'homeTeam', 'awayTeam', 'setTab', 'triggerLiveSync', 'IS_OWNER', 'today'];
    const deps = states.filter(dep => new RegExp(`\\b${dep}\\b`).test(codeBlock));
    
    // Internal Component Check
    const localComps = ['OutcomeBadge', 'AdjStatusDot', 'Divider', 'CheckRow', 'AdjRow', 'Input', 'Field', 'SmallField', 'SplendorLogo', 'LiveStatBar', 'PhantomLiveHub'].filter(c => c !== name);
    const usedComps = localComps.filter(comp => new RegExp(`\\b${comp}\\b`).test(codeBlock));

    console.log(`   - Closure Dependencies (Props to wire): ${deps.length > 0 ? deps.join(', ') : 'None'}`);
    console.log(`   - Local Imports Required: ${usedComps.length > 0 ? usedComps.join(', ') : 'None'}\n`);
}

analyzeDependencies('LiveStatBar', liveStatBarCode);
analyzeDependencies('PhantomLiveHub', phantomLiveHubCode);

console.log("=======================================================");
console.log("✅ BLUEPRINT SECURED. AWAITING FINAL EXTRACTION COMMAND.");
console.log("=======================================================\n");
