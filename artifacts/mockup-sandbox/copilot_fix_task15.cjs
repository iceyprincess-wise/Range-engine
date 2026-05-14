const fs = require('fs');
const path = require('path');

const filePath = path.join(process.cwd(), 'src/components/mockups/range-engine/RangeEngine.tsx');
let content = fs.readFileSync(filePath, 'utf8');
let lines = content.split('\n');

console.log('\n================================================================');
console.log('🛠️ COPILOT DEPLOYED: ABSOLUTE COORDINATE INJECTION');
console.log('================================================================\n');

// 1. EXACT LINE 600: EngineOutput Interface
if (lines[599].includes('triggered_rules')) {
    lines[599] = lines[599].replace('\r', '') + '\n  unit_play?: string;\n  sharp_money_warning?: boolean;';
    console.log('✅ [SECTOR 1] Line 600 Fixed: EngineOutput Interface upgraded.');
} else { console.log('⚠️ [SECTOR 1] Offset detected on Line 600.'); }

// 2. EXACT LINE 685: ResearchData Interface
if (lines[684].includes('defStallNote')) {
    lines[684] = lines[684].replace('\r', '') + '\n  openingLine?: number;\n  currentLine?: number;\n  bettingPercent?: number;';
    console.log('✅ [SECTOR 2] Line 685 Fixed: ResearchData Interface upgraded.');
} else { console.log('⚠️ [SECTOR 2] Offset detected on Line 685.'); }

// 3. EXACT LINE 1236 & 1237: Rule 16 OVER Logic
if (lines[1235].includes('OVER') && lines[1235].includes('HAMMER PLAY')) {
    lines[1235] = `          let unitPlay = "3-Unit Max Play";
          if (typeof reliability !== 'undefined' && reliability === "Weak") unitPlay = "0.5-Unit Cautious Play";
          if (typeof collapsePct !== 'undefined' && collapsePct > 10) unitPlay = "0.5-Unit Cautious Play";
          decision = \`OVER \$\{best_over_line\} ★ HAMMER PLAY [\$\{unitPlay\}]\`;`;
    lines[1236] = `          confidence = \`HIGH (Hammer Play) — \$\{unitPlay\}\`;`;
    console.log('✅ [SECTOR 3] Line 1236 Fixed: Rule 16 OVER Volatility Cushion Active.');
} else { console.log('⚠️ [SECTOR 3] Offset detected on Line 1236.'); }

// 4. EXACT LINE 1249 & 1250: Rule 16 UNDER Logic
if (lines[1248].includes('UNDER') && lines[1248].includes('HAMMER PLAY')) {
    lines[1248] = `          let unitPlay = "3-Unit Max Play";
          if (typeof reliability !== 'undefined' && reliability === "Weak") unitPlay = "0.5-Unit Cautious Play";
          if (typeof collapsePct !== 'undefined' && collapsePct > 10) unitPlay = "0.5-Unit Cautious Play";
          decision = \`UNDER \$\{best_under_line\} ★ HAMMER PLAY [\$\{unitPlay\}]\`;`;
    lines[1249] = `          confidence = \`HIGH (Hammer Play) — \$\{unitPlay\}\`;`;
    console.log('✅ [SECTOR 4] Line 1249 Fixed: Rule 16 UNDER Volatility Cushion Active.');
} else { console.log('⚠️ [SECTOR 4] Offset detected on Line 1249.'); }

// 5. EXACT LINE 1728: Tab Gateway
if (lines[1727].includes('setTab')) {
    lines[1727] = `  const IS_OWNER = true; // 🚨 TRUTH PROTOCOL Gateway\n  const [tab, setTab] = useState<"analyzer" | "live" | "history" | "football">("analyzer");`;
    console.log('✅ [SECTOR 5] Line 1728 Fixed: IS_OWNER state & Tab Gateway injected.');
} else { console.log('⚠️ [SECTOR 5] Offset detected on Line 1728.'); }

// 6. UI INJECTION: Scan forward from Line 1728 for main render block
let injectIdx = -1;
for (let i = 1728; i < lines.length; i++) {
    if (lines[i].includes('return') && lines[i].includes('<')) {
        injectIdx = i;
        break;
    } else if (lines[i].includes('return (') || lines[i].includes('return(')) {
        // Find the first JSX tag after return(
        for (let j = i; j < i + 4; j++) {
            if (lines[j] && lines[j].includes('<')) {
                injectIdx = j;
                break;
            }
        }
        if (injectIdx !== -1) break;
    }
}

if (injectIdx !== -1) {
    const uiPayload = `      {IS_OWNER && (
        <div style={{ position: "fixed", top: 12, left: "50%", transform: "translateX(-50%)", zIndex: 9999 }}>
          <button onClick={() => setTab("football")} style={{ background: "linear-gradient(90deg, #1a1a1a, #333)", color: "#ffaa00", padding: "8px 24px", borderRadius: "20px", fontWeight: "bold", border: "1px solid #ffaa00", cursor: "pointer", boxShadow: "0 4px 15px rgba(255, 170, 0, 0.3)", display: "flex", gap: "8px", alignItems: "center" }}>
            ⚽ Football Section
          </button>
        </div>
      )}
      {tab === "football" && (
        <div style={{ position: "fixed", inset: 0, background: "#0a0a0a", color: "#fff", zIndex: 9998, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "20px", overflowY: "auto" }}>
           <h1 style={{ color: "#ffaa00", fontSize: "3rem", margin: 0, textAlign: "center" }}>⚽ Football Section</h1>
           <h2 style={{ color: "#888", fontWeight: "normal", marginBottom: "30px", textAlign: "center" }}>Coming Soon</h2>
           <div style={{ background: "#111", padding: "20px", borderRadius: "12px", border: "1px solid #333", maxWidth: "600px", textAlign: "left", lineHeight: "1.6" }}>
             <p style={{ color: "#ff4444", fontWeight: "bold" }}>🚨 Paradigm Shift Architecture Initialized</p>
             <ul style={{ color: "#aaa", fontSize: "0.95rem", paddingLeft: "20px" }}>
               <li>xG Variance Models & Temporal Degradation</li>
               <li>Momentum Collapse Detection</li>
               <li>Low-Block Penetration Analysis</li>
               <li>90-Minute Pacing Variance Sync</li>
             </ul>
           </div>
           <button onClick={() => setTab("analyzer")} style={{ marginTop: "40px", padding: "12px 30px", background: "#ffaa00", color: "#000", fontWeight: "bold", border: "none", borderRadius: "8px", cursor: "pointer" }}>Return to Matrix</button>
        </div>
      )}`;
    
    // Inject directly after the opening <tag> of the return statement
    lines.splice(injectIdx + 1, 0, uiPayload);
    console.log(`✅ [SECTOR 6] Line ${injectIdx + 1} Fixed: Football Gateway physically locked in.`);
} else {
    console.log('⚠️ [SECTOR 6] Could not locate primary return JSX to inject Gateway.');
}

// Write the joined array back to the file
fs.writeFileSync(filePath, lines.join('\n'), 'utf8');

console.log('\n================================================================');
console.log('🚀 COPILOT FIX COMPLETE. VITE/REACT HMR SHOULD NOW REFRESH.');
console.log('================================================================\n');
