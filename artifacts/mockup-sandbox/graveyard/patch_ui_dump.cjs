const fs = require('fs');
const targetPath = './src/components/mockups/range-engine/RangeEngine.tsx';

let code = fs.readFileSync(targetPath, 'utf8');

const anchor = '{apiError && <p className="text-red-400 text-[10px] mb-3 border border-red-900/50 bg-red-950/30 p-2 rounded">{apiError}</p>}';

if (code.includes(anchor) && !code.includes('Raw API Intercept')) {
    const dumpUI = `
{apiError && <p className="text-red-400 text-[10px] mb-3 border border-red-900/50 bg-red-950/30 p-2 rounded">{apiError}</p>}
{liveStats && (
  <div className="bg-zinc-950 p-3 rounded border border-zinc-800 mb-4 overflow-auto max-h-64">
    <span className="text-emerald-500 text-[9px] font-bold uppercase tracking-widest mb-2 block">Raw API Intercept Monitor:</span>
    <pre className="text-[8px] text-zinc-400 font-mono whitespace-pre-wrap">{JSON.stringify(liveStats, null, 2)}</pre>
  </div>
)}
`;
    code = code.replace(anchor, dumpUI);
    fs.writeFileSync(targetPath, code, 'utf8');
    console.log('✅ STATUS: Screen-Dump Monitor injected successfully.');
} else {
    console.log('⚠️ STATUS: Anchor not found or monitor already exists.');
}
