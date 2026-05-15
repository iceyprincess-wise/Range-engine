const fs = require('fs');
const path = require('path');

const targetPath = path.join(__dirname, 'RangeEngine.tsx');
let content = fs.readFileSync(targetPath, 'utf-8');

console.log("=================================================");
console.log("🛠️ EXECUTING SURGICAL INJECTION PROTOCOL");
console.log("=================================================");

// 1. Inject the import if it doesn't exist
if (!content.includes('import { LiveMatrixHub }')) {
    // Find the last import statement
    const importRegex = /^import .* from .*;/gm;
    let match;
    let lastIndex = 0;
    while ((match = importRegex.exec(content)) !== null) {
        lastIndex = match.index + match[0].length;
    }
    content = content.slice(0, lastIndex) + '\nimport { LiveMatrixHub } from "./LiveMatrixHub";\n' + content.slice(lastIndex);
    console.log("✅ LiveMatrixHub import injected securely.");
} else {
    console.log("⚠️ Import already exists, skipping...");
}

// 2. Replace <PhantomLiveHub /> safely (Accounting for spacing variations)
const phantomRegex = /<PhantomLiveHub\s*\/>/g;
if (phantomRegex.test(content)) {
    content = content.replace(phantomRegex, `<LiveMatrixHub history={history} setHistory={setHistory} saveHistory={saveHistory} />`);
    fs.writeFileSync(targetPath, content, 'utf-8');
    console.log("✅ <PhantomLiveHub /> replaced with <LiveMatrixHub /> securely.");
} else {
    console.log("⚠️ <PhantomLiveHub /> not found. It may have already been replaced.");
}

console.log("=================================================");
console.log("🚀 TASK 13 SURGICAL INJECTION COMPLETE.");
console.log("=================================================");
