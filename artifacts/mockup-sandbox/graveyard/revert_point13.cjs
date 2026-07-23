const fs = require('fs');

const targetPath = './src/components/mockups/range-engine/RangeEngine.tsx';

console.log('======================================================');
console.log(' 🧹 INITIATING SURGICAL EXTRACTION: < POINT 13 REVERT >');
console.log('======================================================\n');

let code = fs.readFileSync(targetPath, 'utf8');

// 1. Remove the Component Definition block
const componentRegex = /\/\/ =====================================================================\r?\n\/\/ ⚡ POINT 13: THE PHANTOM-DELTA MATRIX[\s\S]*?\/\/ =====================================================================\r?\n/;
if (componentRegex.test(code)) {
    code = code.replace(componentRegex, '');
    console.log('✅ STATUS: PhantomLiveHub component logic removed.');
} else {
    console.log('⚠️ STATUS: Component logic not found. May have already been removed.');
}

// 2. Remove the Render Invocation
const renderRegex = /\{\/\* INJECTED POINT 13: LIVE UI HUB \*\/\}\r?\n<PhantomLiveHub \/>\r?\n/g;
if (renderRegex.test(code)) {
    code = code.replace(renderRegex, '');
    console.log('✅ STATUS: PhantomLiveHub UI render removed.');
} else {
    console.log('⚠️ STATUS: UI render not found.');
}

fs.writeFileSync(targetPath, code, 'utf8');
console.log('\n✅ STATUS: Codebase restored to prior state. Ready to activate existing Live UI.');
console.log('======================================================\n');
