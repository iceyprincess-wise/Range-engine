const fs = require('fs');
const targetPath = './src/components/mockups/range-engine/RangeEngine.tsx';

let code = fs.readFileSync(targetPath, 'utf8');

// Regex to find the old liveStats dump block
const oldBlockRegex = /\{liveStats && \([\s\S]*?<pre[\s\S]*?<\/pre>\s*<\/div>\s*\)\}/;

if (oldBlockRegex.test(code)) {
    const newBlock = `{liveStats && (
  <div className="bg-zinc-950 p-3 rounded border border-zinc-800 mb-4 relative">
    <div className="flex justify-between items-center mb-2">
      <span className="text-emerald-500 text-[9px] font-bold uppercase tracking-widest">Raw API Intercept:</span>
      <button 
        onClick={() => {
          navigator.clipboard.writeText(JSON.stringify(liveStats, null, 2));
          alert('✅ JSON Copied to Clipboard!');
        }}
        className="bg-emerald-600 hover:bg-emerald-500 text-white text-[9px] px-3 py-1 rounded shadow uppercase font-bold tracking-wider"
      >
        Copy All
      </button>
    </div>
    <textarea 
      readOnly 
      className="w-full h-48 bg-black text-[9px] text-zinc-400 font-mono p-2 rounded border border-zinc-800 focus:outline-none"
      value={JSON.stringify(liveStats, null, 2)}
    />
  </div>
)}`;
    
    code = code.replace(oldBlockRegex, newBlock);
    fs.writeFileSync(targetPath, code, 'utf8');
    console.log('✅ STATUS: 1-Tap Copy UI successfully injected.');
} else {
    console.log('⚠️ STATUS: Could not find the old UI block. It might have been modified.');
}
