const fs = require('fs');
const path = '/workspaces/range-engine-v3/Range-Engine-Logic/artifacts/mockup-sandbox/src/components/mockups/range-engine/RangeEngine.tsx';
let content = fs.readFileSync(path, 'utf8');

// Target everything from the broken live tab down to the start of the history tab
const brokenRegex = /\{tab\s*===\s*"live"[\s\S]*?\{tab\s*===\s*"history"\s*&&\s*\(/;

const fixedCode = `{/* ─── LIVE TAB ─────────────────────────────────────────────────────── */}
      {tab === "live" ? (
        <div className="flex-1 overflow-y-auto px-5 py-4">
          <PhantomLiveHub />
        </div>
      ) : null}

      {/* ─── HISTORY TAB ────────────────────────────────────────────────────── */}
      {tab === "history" && (`;

if (brokenRegex.test(content)) {
    content = content.replace(brokenRegex, fixedCode);
    fs.writeFileSync(path, content);
    console.log('✅ Live Tab logic successfully repaired!');
} else {
    console.log('⚠️ Could not find the broken pattern. It might be slightly different than expected.');
}
