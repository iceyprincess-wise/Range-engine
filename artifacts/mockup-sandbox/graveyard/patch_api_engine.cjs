const fs = require('fs');
const targetPath = './src/components/mockups/range-engine/RangeEngine.tsx';

let code = fs.readFileSync(targetPath, 'utf8');

const startMarker = '// ─── BASKETAPI LIVE ENGINE (SMART THROTTLE) ───';
const endMarker = '// ──────────────────────────────────────────────';

const startIndex = code.indexOf(startMarker);
const endIndex = code.indexOf(endMarker);

if (startIndex !== -1 && endIndex !== -1) {
    const newBlock = `// ─── BASKETAPI LIVE ENGINE (SMART THROTTLE) ───
  const [liveStats, setLiveStats] = useState<any>(null);
  const [isFetchingLive, setIsFetchingLive] = useState(false);
  const [apiError, setApiError] = useState("");

  const triggerLiveSync = async () => {
    setIsFetchingLive(true);
    setApiError("");
    try {
      // 1. Updated Endpoint (Plural 'matches')
      const response = await fetch('https://basketapi1.p.rapidapi.com/api/basketball/matches/live', {
        method: 'GET',
        headers: {
          'x-rapidapi-key': 'f0f8830be9msh33c27594430acdbp174a46jsn212686e527a0', 
          'x-rapidapi-host': 'basketapi1.p.rapidapi.com'
        }
      });
      
      // 2. The Interceptor: Read as text first to prevent JSON crashes
      const rawText = await response.text();
      
      if (!response.ok) throw new Error(\`HTTP \${response.status}: \${rawText || 'Empty Error Response'}\`);
      if (!rawText) throw new Error("API returned an empty body. Either no matches are live right now, or the API key is restricted.");
      
      // 3. Safe Parse
      const data = JSON.parse(rawText);
      setLiveStats(data);
      console.log("🔥 Live Sync Complete:", data);
    } catch (err: any) {
      setApiError(err.message || "API Connection Failed");
      console.error("API Engine Error:", err);
    } finally {
      setIsFetchingLive(false);
    }
  };
  `;

    code = code.substring(0, startIndex) + newBlock + code.substring(endIndex);
    fs.writeFileSync(targetPath, code, 'utf8');
    console.log('✅ STATUS: API Engine patched with RAW TEXT interceptor and corrected endpoint.');
} else {
    console.log('❌ ERROR: Could not find API Engine block to replace.');
}
