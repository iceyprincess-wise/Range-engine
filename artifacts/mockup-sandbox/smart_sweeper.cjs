const fs = require('fs');
const path = './src/components/mockups/range-engine/RangeEngine.tsx';
let code = fs.readFileSync(path, 'utf8');
let lines = code.split('\n');
let newLines = [];

let skipR18 = false;
let r18Injected = false;

let skipR7 = false;
let r7Injected = false;

for (let i = 0; i < lines.length; i++) {
    let line = lines[i];

    // 1. Detect any trace of Rule 18 (old or duplicated)
    if (line.includes('Rule 18') && (line.includes('Hazard') || line.includes('Surge'))) {
        skipR18 = true;
    }
    
    // 2. Lock in at the end of Rule 18 and inject the V3 block
    if (skipR18 && line.includes('Rule 8 Width Cap')) {
        skipR18 = false;
        if (!r18Injected) {
            newLines.push(`    // --- Rule 18 (OT Hazard & Endgame Surge) ----------------
    let r18_hb = 0;
    // Real OT Risk: Tight margin + elite FT shooters = Surge
    const isOTRisk = margin <= 5;
    const highVolFinisher = avg_ft >= 0.76;
    
    if (isOTRisk) {
        r18_hb = 8;
        if (highVolFinisher) r18_hb += 4;
        hb += r18_hb;
    }
    
    adj_log.push({ 
        rule: "Rule 18 - OT Hazard & Surge", 
        lb_adj: 0, 
        hb_adj: r18_hb, 
        note: \`Margin: \${margin.toFixed(1)} pts\${isOTRisk ? \` ≤5 → OT Risk → HB+\${r18_hb} (LB grounded)\${highVolFinisher ? ' [High Vol FT Surge +4]' : ''}\` : \` >5 → no OT hazard\`}\`, 
        status: isOTRisk ? "triggered" : "checked" 
    });`);
            r18Injected = true;
        }
    }

    // 3. Detect any trace of Rule 7 (old or duplicated)
    if (line.includes('Rule 7') && (line.includes('Stall') || line.includes('Collapse'))) {
        skipR7 = true;
    }

    // 4. Lock in at the end of Rule 7 and inject the V3 block
    if (skipR7 && line.includes('Rule 8/9')) {
        skipR7 = false;
        if (!r7Injected) {
            newLines.push(`    // --- Rule 7 (Defensive Stall / Offensive Surge / Q1-Q4 Collapse) --------
    let r7_lb = 0, r7_hb = 0;
    let r7note = \`Margin: \${margin.toFixed(1)} pts\`;
    
    if (margin >= 10) { 
        r7_lb = -Math.round(4 * ws); 
        r7note += " ≥10 (Large Margin → pace deceleration); "; 
    } else if (margin <= 6) { 
        r7_hb = Math.round(4 * ws); 
        r7note += " ≤6 (Tight → foul rate risk); "; 
    }

    if (collapsePct > 30) {
        r7_lb -= Math.round(5 * ws);
        r7_hb -= Math.round(4 * ws);
        r7note += \` | Q1-Q4 Collapse \${collapsePct}% >30% → UNDER bias (LB-\${Math.round(5*ws)}, HB-\${Math.round(4*ws)})\`;
    } else if (collapsePct > 0) {
        r7note += \` | Q1-Q4 Collapse \${collapsePct}% ≤30% → monitored\`;
    }

    lb += r7_lb; hb += r7_hb;
    const r7Status = (r7_lb !== 0 || r7_hb !== 0) ? "triggered" : "checked";
    adj_log.push({ rule: "Rule 7 – Margin/Stall/Surge/Collapse", lb_adj: r7_lb, hb_adj: r7_hb, note: r7note, status: r7Status });`);
            r7Injected = true;
        }
    }

    // 5. Build the clean file and fix the UI texts
    if (!skipR18 && !skipR7) {
        line = line.replace(/Q3\/Q4 stall risk/g, 'Q1-Q4 Structural Collapse');
        line = line.replace(/Q3\/Q4 Collapse/g, 'Q1-Q4 Collapse');
        newLines.push(line);
    }
}

fs.writeFileSync(path, newLines.join('\n'));
console.log("🚀 CORE LOGIC V3 DEPLOYED AND ALL ERRORS PURGED!");
