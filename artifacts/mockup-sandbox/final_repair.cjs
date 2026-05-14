const fs = require('fs');
const path = '/workspaces/range-engine-v3/Range-Engine-Logic/artifacts/mockup-sandbox/src/components/mockups/range-engine/RangeEngine.tsx';
let content = fs.readFileSync(path, 'utf8');

console.log('🛠 Starting Surgical JSX Realignment...');

// 1. Fix Adjacent Elements (TS2657 at lines 1425 & 1434)
// This hunts down the sibling divs inside the collapsePct condition and wraps them in Fragments
content = content.replace(
  /(\{researchData\.collapsePct\s*>\s*(?:20|30)\s*&&\s*)\(([\s\S]*?)\)\}/g,
  (match, p1, p2) => {
    if (p2.includes('<>') || p2.trim().startsWith('<div')) {
       if (!p2.includes('<>')) return `${p1}(<>${p2}</>)}`;
    }
    return match;
  }
);

// 2. Fix corrupted Live Tab logic (TS1005 / TS1109 around line 1154)
// Restores the logical opening for the ternary branch
content = content.replace(
  /\{tab\s*===\s*"live"\s*&&\s*\(\s*<>\s*<\s*\/>\s*\)\s*\}/g,
  '{tab === "live" ? ('
);

// 3. Fix the orphaned ternary junction before the History tab
content = content.replace(/\)\s*:\s*\(\s*\{tab\s*===\s*"history"/g, ') : tab === "history" && (');

// 4. Bracket & Parentheses Balance Check (TS1128 around line 2202)
// Automatically neutralizes missing structural tags at the end of the file
const openBraces = (content.match(/\{/g) || []).length;
const closeBraces = (content.match(/\}/g) || []).length;
if (openBraces > closeBraces) {
  console.log(`⚠️ Detected ${openBraces - closeBraces} missing closing braces. Appending...`);
  content += '\n' + '}'.repeat(openBraces - closeBraces);
}

const openParens = (content.match(/\(/g) || []).length;
const closeParens = (content.match(/\)/g) || []).length;
if (openParens > closeParens) {
  console.log(`⚠️ Detected ${openParens - closeParens} missing closing parentheses. Appending...`);
  content += '\n' + ')'.repeat(openParens - closeParens);
}

fs.writeFileSync(path, content);
console.log('✅ Repair script finished. Brackets and Fragments aligned.');
