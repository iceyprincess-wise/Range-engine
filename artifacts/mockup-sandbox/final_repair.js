const fs = require('fs');
const path = '/workspaces/range-engine-v3/Range-Engine-Logic/artifacts/mockup-sandbox/src/components/mockups/range-engine/RangeEngine.tsx';
let content = fs.readFileSync(path, 'utf8');

console.log('🛠 Starting Surgical JSX Realignment...');

// 1. Fix Adjacent Elements in Q3/Q4 (TS2657)
// This wraps the two absolute-positioned divs in a Fragment
content = content.replace(
  /(\{researchData\.collapsePct\s*>\s*(?:20|30)\s*&&\s*)\(([\s\S]*?)\)\}/g,
  (match, p1, p2) => {
    if (p2.includes('<>') || p2.trim().startsWith('<div')) {
       // If it's not already wrapped, wrap it.
       if (!p2.includes('<>')) return `${p1}(<>${p2}</>)}`;
    }
    return match;
  }
);

// 2. Fix corrupted Live Tab logic (TS1005 / TS1109)
// Your script previously shortened the live tab to (<>< />). 
// We are restoring the logical opening for the ternary branch.
content = content.replace(
  /\{tab\s*===\s*"live"\s*&&\s*\(\s*<>\s*<\s*\/>\s*\)\s*\}/g,
  'tab === "live" ? ('
);

// 3. Fix the orphaned ternary junction before History tab
// Changes the broken ") : (" into a clean ternary else-branch
content = content.replace(/\)\s*:\s*\(\s*\{tab\s*===\s*"history"/g, ') : tab === "history" && (');

// 4. Bracket Balance Check (End of File Fix)
// If the file is missing its final component closing tags, we append them.
const openBraces = (content.match(/\{/g) || []).length;
const closeBraces = (content.match(/\}/g) || []).length;

if (openBraces > closeBraces) {
  console.log(`⚠️  Detected ${openBraces - closeBraces} missing closing braces. Appending...`);
  content += '\n' + '}'.repeat(openBraces - closeBraces);
}

fs.writeFileSync(path, content);
console.log('✅ Repair script finished. Brackets and Fragments aligned.');
