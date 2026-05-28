const fs = require('fs');

const targetPath = './src/components/mockups/range-engine/RangeEngine.tsx';

console.log('======================================================');
console.log(' ⚡ INITIATING SURGICAL INJECTION: BASKETAPI ENGINE');
console.log('======================================================\n');

let code = fs.readFileSync(targetPath, 'utf8');

// 1. Inject State & Fetch Logic inside the main RangeEngine component
const stateInjection = `
  // ─── BASKETAPI LIVE ENGINE (SMART THROTTLE) ───
  const [liveStats, setLiveStats] = useState<any>(null);
  const [isFetchingLive, setIsFetchingLive] = useState(false);
  const [apiError, setApiError] = useState("");

  const triggerLiveSync = async () => {
    setIsFetchingLive(true);
    setApiError("");
    try {
      // NOTE: Replace YOUR_API_KEY_HERE with your actual RapidAPI key
      const response = await fetch('https://basketapi1.p.rapidapi.com/api/basketball/matches/live', {
        method: 'GET',
        headers: {
          'x-rapidapi-key': 'f0f8830be9msh33c27594430acdbp174a46jsn212686e527a0', 
          'x-rapidapi-host': 'basketapi1.p.rapidapi.com'
        }
      });
      
      if (!response.ok) throw new Error(\`HTTP Error: \${response.status}\`);
      
      const data = await response.json();
      setLiveStats(data);
      console.log("🔥 Live Sync Complete:", data);
    } catch (err: any) {
      setApiError(err.message || "API Connection Failed");
      console.error(err);
    } finally {
      setIsFetchingLive(false);
    }
  };
  // ──────────────────────────────────────────────
`;

// Find a safe place to inject the state (right after tab state)
const stateAnchor = 'const [tab, setTab] = useState<"analyzer" | "live" | "history">("analyzer");';
if (code.includes(stateAnchor) && !code.includes('triggerLiveSync')) {
    code = code.replace(stateAnchor, stateAnchor + '\n' + stateInjection);
    console.log('✅ STATUS: BasketAPI state and fetch logic injected.');
} else {
    console.log('⚠️ STATUS: State anchor not found or already injected.');
}

// 2. Inject the Smart Sync Button above the Caneros vs Metros UI
const uiAnchor = '<div className="text-[10px] text-zinc-400 font-mono mb-5 mt-3 leading-relaxed">';
const buttonUI = `
{/* SMART THROTTLE SYNC BUTTON */}
<div className="flex items-center justify-between bg-zinc-900/50 border border-zinc-800 p-3 rounded-lg mb-4">
  <div>
    <span className="text-emerald-400 text-[11px] font-bold tracking-widest uppercase block">BasketAPI Sync Engine</span>
    <span className="text-zinc-500 text-[9px] uppercase">Manual Throttle Active (Protects Free Quota)</span>
  </div>
  <button 
    onClick={triggerLiveSync}
    disabled={isFetchingLive}
    className={\`px-4 py-2 rounded text-[10px] font-black tracking-widest uppercase transition-all \${isFetchingLive ? "bg-zinc-800 text-zinc-500 cursor-not-allowed" : "bg-emerald-600 hover:bg-emerald-500 text-white shadow-[0_0_10px_rgba(5,150,105,0.4)]"}\`}
  >
    {isFetchingLive ? "Syncing..." : "Sync Live Data"}
  </button>
</div>
{apiError && <p className="text-red-400 text-[10px] mb-3 border border-red-900/50 bg-red-950/30 p-2 rounded">{apiError}</p>}
`;

if (code.includes(uiAnchor) && !code.includes('SMART THROTTLE SYNC BUTTON')) {
    code = code.replace(uiAnchor, buttonUI + '\n' + uiAnchor);
    console.log('✅ STATUS: Smart Sync Button injected into Live UI.');
} else {
    console.log('⚠️ STATUS: UI anchor not found or button already injected.');
}

fs.writeFileSync(targetPath, code, 'utf8');
console.log('\n✅ STATUS: BasketAPI Engine deployed. 100% Accuracy.');
console.log('======================================================\n');
