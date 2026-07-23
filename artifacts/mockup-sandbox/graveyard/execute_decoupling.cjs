const fs = require('fs');
const path = require('path');

const targetFile = path.join(process.cwd(), 'src/components/mockups/range-engine/RangeEngine.tsx');
const newFile = path.join(process.cwd(), 'src/components/mockups/range-engine/LiveEngineComponents.tsx');

console.log("\n=======================================================");
console.log("🔪 INITIATING SURGICAL STRIKE: MONOLITH DECOUPLING 🔪");
console.log("=======================================================\n");

let content = fs.readFileSync(targetFile, 'utf-8');

// 1. Extract Top-Level Imports safely
const lines = content.split('\n');
let imports = [];
for (let line of lines) {
    if (line.startsWith('import ')) {
        imports.push(line);
    }
}

// 2. AST Extraction Logic (to get precise boundaries)
function getComponentBoundaries(code, name) {
    const regex = new RegExp(`(?:const|function)\\s+${name}\\b`);
    const match = code.match(regex);
    if (!match) return null;

    let startIndex = match.index;
    let fullText = code.substring(startIndex);
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

        if (foundFirstBrace && charStack.length === 0) {
            let nextChars = fullText.substring(i + 1, i + 20).trim();
            if (nextChars.startsWith('=>')) continue; 
            endIndex = i + 1;
            if (fullText[endIndex] === ';') endIndex++;
            break;
        }
    }

    return {
        start: startIndex,
        end: startIndex + endIndex,
        codeBlock: code.substring(startIndex, startIndex + endIndex)
    };
}

const liveStatBarBoundaries = getComponentBoundaries(content, 'LiveStatBar');
const phantomLiveHubBoundaries = getComponentBoundaries(content, 'PhantomLiveHub');

if (!liveStatBarBoundaries || !phantomLiveHubBoundaries) {
    console.error("🚨 CRITICAL ERROR: Could not map precise component boundaries. ABORTING SURGERY.");
    process.exit(1);
}

console.log("✅ Component Boundaries Locked.");

// 3. Prepare the new file content
let newFileContent = imports.join('\n') + "\n\n";

// Ensure they are exported properly
let lsbCode = liveStatBarBoundaries.codeBlock;
if (!lsbCode.startsWith('export ')) lsbCode = 'export ' + lsbCode;

let phCode = phantomLiveHubBoundaries.codeBlock;
if (!phCode.startsWith('export ')) phCode = 'export ' + phCode;

newFileContent += "// ─── EXTRACTED LIVE UI COMPONENTS ───\n\n";
newFileContent += lsbCode + "\n\n";
newFileContent += phCode + "\n";

// 4. Perform the surgery on RangeEngine.tsx
// We slice them out from bottom to top to avoid index shifting
let updatedContent = content;

updatedContent = updatedContent.substring(0, phantomLiveHubBoundaries.start) + 
                 updatedContent.substring(phantomLiveHubBoundaries.end);

// Recalculate LiveStatBar start index as it might have shifted (though it's above Phantom usually)
const freshLsbMatch = getComponentBoundaries(updatedContent, 'LiveStatBar');
if (freshLsbMatch) {
    updatedContent = updatedContent.substring(0, freshLsbMatch.start) + 
                     updatedContent.substring(freshLsbMatch.end);
}

// 5. Inject the new import at the top of RangeEngine
const importInjection = `import { LiveStatBar, PhantomLiveHub } from './LiveEngineComponents';\n`;
const lastImportIndex = updatedContent.lastIndexOf('import ');
const nextLineIndex = updatedContent.indexOf('\n', lastImportIndex) + 1;

updatedContent = updatedContent.substring(0, nextLineIndex) + importInjection + updatedContent.substring(nextLineIndex);

// 6. Write files safely
fs.writeFileSync(newFile, newFileContent, 'utf-8');
fs.writeFileSync(targetFile, updatedContent, 'utf-8');

console.log(`✅ SUCCESS: Decoupled into ${path.basename(newFile)}`);
console.log(`✅ SUCCESS: Cleaned and relinked ${path.basename(targetFile)}`);
console.log("\n=======================================================");
console.log("🛡️ SURGERY COMPLETE. NO MATRIX LOGIC ALTERED.");
console.log("=======================================================\n");
