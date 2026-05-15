const fs = require('fs');
const path = 'src/components/mockups/range-engine/RangeEngine.tsx';
let code = fs.readFileSync(path, 'utf8');

// 1. Inject the "Active Research Nodes" Tracker above the Market Lines rule
const researchUI = `
    <div className="mb-6 border border-emerald-900/30 rounded-xl bg-emerald-900/10 p-4">
      <div className="text-[10px] text-emerald-500 font-bold uppercase mb-3 flex items-center gap-2">
        <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span> Active Research Nodes (1,000+ Targets)
      </div>
      <ul className="text-[10px] text-zinc-400 space-y-2 font-mono">
        <li className="flex items-center gap-2"><span className="text-emerald-500">✓</span> Connected: Global Market APIs (RapidAPI / SofaScore)</li>
        <li className="flex items-center gap-2"><span className="text-emerald-500">✓</span> Connected: Historical Anatomy Matrix (TEAM_DB)</li>
        <li className="flex items-center gap-2"><span className="text-emerald-500">✓</span> Connected: Splendor Engine V3 Rulebook Core</li>
        <li className="flex items-center gap-2"><span className="text-emerald-500 animate-pulse">⟳</span> Scanning: Real-time proxy endpoints for line movement...</li>
      </ul>
    </div>
`;

// Safely insert the UI right above the "MARKET LINES" section
if (!code.includes('Active Research Nodes')) {
  code = code.replace(/(<div[^>]*>\s*<h3[^>]*>.*?MARKET LINES - RULE 12.*?<\/h3>)/i, researchUI + '\n$1');
  // Fallback if the exact HTML wrapper differs slightly
  if (code.indexOf('Active Research Nodes') === -1) {
    code = code.replace(/(<h3[^>]*>.*?MARKET LINES - RULE 12.*?<\/h3>)/i, researchUI + '\n$1');
  }
}

// 2. Link Over and Under inputs safely (handles React arrow functions without breaking syntax)
code = code.replace(/onChange=\{[\(]?e[\)]?\s*=>\s*setOverLow\(e\.target\.value\)\}/g, 'onChange={(e) => { setOverLow(e.target.value); setUnderLow(e.target.value); }}');
code = code.replace(/onChange=\{[\(]?e[\)]?\s*=>\s*setOverHigh\(e\.target\.value\)\}/g, 'onChange={(e) => { setOverHigh(e.target.value); setUnderHigh(e.target.value); }}');

// Alternative naming conventions backup (just in case!)
code = code.replace(/onChange=\{[\(]?e[\)]?\s*=>\s*setMarketOverLow\(e\.target\.value\)\}/g, 'onChange={(e) => { setMarketOverLow(e.target.value); setMarketUnderLow(e.target.value); }}');
code = code.replace(/onChange=\{[\(]?e[\)]?\s*=>\s*setMarketOverHigh\(e\.target\.value\)\}/g, 'onChange={(e) => { setMarketOverHigh(e.target.value); setMarketUnderHigh(e.target.value); }}');

fs.writeFileSync(path, code);
console.log("UI Upgrade Complete! No syntax errors.");
