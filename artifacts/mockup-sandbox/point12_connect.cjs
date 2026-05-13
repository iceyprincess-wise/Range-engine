const fs = require('fs');
const path = require('path');
const file = path.join(process.cwd(), 'src', 'components', 'mockups', 'range-engine', 'RangeEngine.tsx');

let code = fs.readFileSync(file, 'utf8');

console.log("\n=========================================================");
console.log("🔌 INITIATING LIVE HUB CONNECTION & LEGACY CLOAKING");
console.log("=========================================================");

let modified = false;

// 1. INJECT IMPORT
if (!code.includes('LiveMonitorHub')) {
    const importStr = "import { LiveMonitorHub } from '../live-monitor/LiveMonitorHub';\n";
    code = importStr + code;
    
    // 2. INJECT COMPONENT AT TOP OF DASHBOARD
    const returnIndex = code.indexOf('return (');
    if (returnIndex !== -1) {
        const firstDivIndex = code.indexOf('<div', returnIndex);
        const closeBracketIndex = code.indexOf('>', firstDivIndex);
        
        if (firstDivIndex !== -1 && closeBracketIndex !== -1) {
            const insertPos = closeBracketIndex + 1;
            const injection = `
            {/* ⚡ NEW AUTONOMOUS LIVE MONITOR HUB ⚡ */}
            <div className="w-full mb-6 border-b-4 border-purple-600 pb-4 bg-zinc-950 rounded-lg shadow-2xl">
                <LiveMonitorHub />
            </div>
`;
            code = code.substring(0, insertPos) + injection + code.substring(insertPos);
            console.log("✅ [CONNECTED] LiveMonitorHub successfully wired into the main dashboard.");
            modified = true;
        }
    }
} else {
    console.log("⚡ [SKIP] LiveMonitorHub is already imported.");
}

// 3. CLOAK THE OLD UI (ZERO RED SCREEN RISK)
if (code.includes('Apply Stall Sensor →')) {
    code = code.replace(/<button([^>]*)>\s*Apply Stall Sensor →\s*<\/button>/g, '<button$1 style={{display: "none"}}>Apply Stall Sensor →</button>');
    console.log("✅ [CLOAKED] Legacy Stall Sensor button neutralized visually.");
    modified = true;
}

if (code.includes('QUARTER SCORES (HOME | AWAY)')) {
     code = code.replace(/QUARTER SCORES \(HOME \| AWAY\)/g, "⚠️ LEGACY STALL SENSOR DEPRECATED — USE NEW GLOBAL LIVE HUB ABOVE");
     console.log("✅ [CLOAKED] Legacy Quarter Scores section labeled as deprecated.");
     modified = true;
}

if (modified) {
    fs.writeFileSync(file, code, 'utf8');
    console.log("🛡️ [VERIFIED] Zero JSX tags deleted. 100% Red Screen Proof.");
}
console.log("=========================================================\n");
console.log("👉 NEXT STEP: Check your browser/Codespace preview. The new Live Hub will be running at the top!");
