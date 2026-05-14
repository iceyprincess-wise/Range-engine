const fs = require('fs');
const targetPath = './src/components/mockups/range-engine/RangeEngine.tsx';

console.log('======================================================');
console.log(' 🧬 INITIATING DEEP LEXICAL STACK TRAVERSAL');
console.log('======================================================\n');

const code = fs.readFileSync(targetPath, 'utf8');
const lines = code.split('\n');

let stack = [];
let liveTabActive = false;
let anomalyFound = false;

// Matches tags like <div>, </div>, <div />, <>, </>, <LiveStatBar />
const tagRegex = /<(\/)?([a-zA-Z0-9]*)([^>]*)>/g;

console.log('--- SCANNING LIVE TAB CONTEXT ---');

for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Lock onto the Live Tab boundary
    if (line.includes('{tab === "live" && (')) {
        liveTabActive = true;
        console.log(`[Line ${i + 1}] 🟢 ENTERING LIVE TAB`);
    }
    
    // Stop scanning when we hit the History Tab
    if (line.includes('{tab === "history" && (')) {
        liveTabActive = false;
        console.log(`[Line ${i + 1}] 🛑 EXITING LIVE TAB`);
        break;
    }

    if (liveTabActive) {
        let match;
        // Extract every single HTML/JSX tag on the current line
        while ((match = tagRegex.exec(line)) !== null) {
            const isClosing = match[1] === '/';
            const tagName = match[2] || 'Fragment'; // Fallback for <> or </>
            const attributes = match[3];

            // Ignore self-closing tags (e.g., <div /> or <LiveStatBar ... />)
            if (attributes.trim().endsWith('/')) continue;
            
            // Ignore generic script logic that uses < or > mathematically
            if (tagName === '' && !isClosing && !attributes.trim() === '') continue; 

            if (!isClosing) {
                // Opening Tag -> Push to stack
                stack.push({ name: tagName, line: i + 1 });
            } else {
                // Closing Tag -> Pop from stack and verify
                if (stack.length === 0) {
                    console.log(`\n❌ FATAL ANOMALY DETECTED: Rogue closing </${tagName}> found!`);
                    console.log(`📍 LINE: ${i + 1}`);
                    console.log(`📝 CODE: ${line.trim()}`);
                    console.log(`⚡ DIAGNOSIS: This tag has no opening partner. This is the exact cause of the crash.\n`);
                    anomalyFound = true;
                } else {
                    const lastOpen = stack.pop();
                    if (lastOpen.name !== tagName) {
                        console.log(`\n⚠️ STRUCTURAL MISMATCH DETECTED!`);
                        console.log(`📍 LINE: ${i + 1}`);
                        console.log(`EXPECTED: </${lastOpen.name}> (to close tag from line ${lastOpen.line})`);
                        console.log(`FOUND: </${tagName}>`);
                        anomalyFound = true;
                    }
                }
            }
        }
    }
}

console.log('--- TRAVERSAL COMPLETE ---');
if (!anomalyFound) {
    if (stack.length > 0) {
        console.log(`\n❌ UNCLOSED TAGS DETECTED: The file ended, but ${stack.length} tags were never closed.`);
        stack.forEach(t => console.log(`   - <${t.name}> opened on line ${t.line} is missing a closing tag.`));
    } else {
        console.log('\n✅ NO ANOMALIES FOUND. The JSX tree appears perfectly balanced.');
    }
}
console.log('======================================================\n');
