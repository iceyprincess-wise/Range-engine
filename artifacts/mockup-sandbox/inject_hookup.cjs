const fs = require('fs');
const path = require('path');

const targetFile = path.join(process.cwd(), 'src', 'components', 'mockups', 'range-engine', 'RangeEngine.tsx');

if (!fs.existsSync(targetFile)) {
    console.error('\x1b[31m%s\x1b[0m', '❌ ERROR: RangeEngine.tsx not found. Are you in the right directory?');
    process.exit(1);
}

let content = fs.readFileSync(targetFile, 'utf8');
let modified = false;

// 1. Inject the Import Statement
if (!content.includes('InjuryVacuumEngine')) {
    // Find the last import statement to safely append ours
    const importRegex = /import .* from ['"].*['"];?\n/g;
    let match;
    let lastIndex = 0;
    while ((match = importRegex.exec(content)) !== null) {
        lastIndex = importRegex.lastIndex;
    }
    
    if (lastIndex === 0) {
        // Fallback if no imports exist (unlikely)
        lastIndex = content.indexOf('\n') + 1;
    }
    
    content = content.slice(0, lastIndex) + `import { InjuryVacuumEngine } from "./InjuryVacuumEngine";\n` + content.slice(lastIndex);
    modified = true;
    console.log('\x1b[36m%s\x1b[0m', '↳ Import statement injected successfully.');
}

// 2. Inject the Component into the JSX
if (!content.includes('<InjuryVacuumEngine')) {
    // Look for the main return statement's opening wrapper (usually a div or fragment)
    const returnRegex = /return\s*\(\s*(<div[^>]*>|<main[^>]*>|<>\s*<div[^>]*>)/i;
    const match = returnRegex.exec(content);
    
    if (match) {
        const insertPos = match.index + match[0].length;
        const injection = `\n\n        {/* 🔴 POINT 4: INJURY / USAGE VACUUM ENGINE (AUTO-INJECTED) */}\n        <div className="mb-6">\n          <InjuryVacuumEngine homeTeamId="HOME" awayTeamId="AWAY" gameTipOffTime={new Date()} />\n        </div>\n`;
        
        content = content.slice(0, insertPos) + injection + content.slice(insertPos);
        modified = true;
        console.log('\x1b[36m%s\x1b[0m', '↳ Component mounted successfully inside the main JSX return block.');
    } else {
        // Fallback: If we can't find the main return, look for the final closing div
        const lastDiv = content.lastIndexOf('</div>');
        if (lastDiv !== -1) {
            const injection = `\n      {/* 🔴 POINT 4: INJURY / USAGE VACUUM ENGINE (AUTO-INJECTED) */}\n      <div className="mb-6">\n        <InjuryVacuumEngine homeTeamId="HOME" awayTeamId="AWAY" gameTipOffTime={new Date()} />\n      </div>\n`;
            content = content.slice(0, lastDiv) + injection + content.slice(lastDiv);
            modified = true;
            console.log('\x1b[33m%s\x1b[0m', '↳ Component mounted near the bottom of the file (fallback strategy).');
        } else {
            console.error('\x1b[31m%s\x1b[0m', '❌ ERROR: Could not find a safe JSX insertion point. Hook-up failed.');
            process.exit(1);
        }
    }
}

if (modified) {
    fs.writeFileSync(targetFile, content, 'utf8');
    console.log('\x1b[32m%s\x1b[0m', '✅ SUCCESS: Point 4 has been completely hooked up via terminal command!');
} else {
    console.log('\x1b[32m%s\x1b[0m', '✅ STATUS: Code is already hooked up. No changes needed.');
}
