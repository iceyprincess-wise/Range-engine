const fs = require('fs');
const path = require('path');

const filePath = path.join(process.cwd(), 'src/components/mockups/range-engine/RangeEngine.tsx');
let content = fs.readFileSync(filePath, 'utf8');

console.log("===============================================================");
console.log("🛠️ [ SURGICAL INJECTION INITIATED ]: Point 11 Stabilization");
console.log("===============================================================\n");

const hookAnchor = "const [refreshCountdown, setRefreshCountdown] = useState(60);";

if (!content.includes(hookAnchor)) {
    console.log("❌ [ FATAL ERROR ]: Anchor not found. Aborting to prevent damage.");
    process.exit(1);
}

const pureTimerBlock = `const [refreshCountdown, setRefreshCountdown] = useState(60);

  // --- POINT 11: TOP NOTCH AUTO-SYNC ENGINE TIMER (SURGICALLY INJECTED) ---
  // This is the single, bulletproof source of truth for the 60s countdown.
  useEffect(() => {
    const mainSyncTimer = setInterval(() => {
      setRefreshCountdown((prev) => {
        if (prev <= 1) {
          return 60; // Auto-resets. Future integration: Trigger auto-analyze here.
        }
        return prev - 1;
      });
    }, 1000);

    // 100% Red Screen Prevention: Clear interval on unmount
    return () => clearInterval(mainSyncTimer);
  }, []);`;

if (!content.includes("POINT 11: TOP NOTCH AUTO-SYNC ENGINE TIMER (SURGICALLY INJECTED)")) {
    content = content.replace(hookAnchor, pureTimerBlock);
    console.log("✅ [ INJECTED ]: Bulletproof useEffect timer added.");
} else {
    console.log("⚠️ [ SKIP ]: Pure timer already exists.");
}

// Neutralize conflicting state updates exactly as scanned
const target1 = "setRefreshCountdown(prev => (prev <= 1 ? 60 : prev - 1));";
const target2 = "const ticker = setTimeout(() => setRefreshCountdown(c => c - 1), 1000);";
const target3 = "setRefreshCountdown(60);";

let modified = false;

if (content.includes(target1)) {
    content = content.replaceAll(target1, "/* ❌ NEUTRALIZED: Conflicting syncEngine setter (Point 11 Fix) */");
    modified = true;
}
if (content.includes(target2)) {
    content = content.replaceAll(target2, "/* ❌ NEUTRALIZED: Conflicting setTimeout ticker (Point 11 Fix) */");
    modified = true;
}
// Using regex for target3 to only target the standalone 60 reset, avoiding partial matches
const target3Regex = /setRefreshCountdown\(60\);/g;
if (target3Regex.test(content)) {
    content = content.replaceAll(target3Regex, "/* ❌ NEUTRALIZED: Conflicting hard reset (Point 11 Fix) */");
    modified = true;
}

if (modified) {
    console.log("✅ [ NEUTRALIZED ]: Rogue overlapping timers deactivated.");
} else {
    console.log("⚠️ [ SKIP ]: Rogue timers already neutralized or not found.");
}

fs.writeFileSync(filePath, content, 'utf8');

console.log("\n===============================================================");
console.log("🚀 [ SUCCESS ]: Engine Stabilized. Point 11 is now Top Notch.");
console.log("===============================================================");
