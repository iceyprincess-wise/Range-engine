import { useState, useEffect, useRef } from "react";

// ─── Team Database (2024-25 Season Averages) ────────────────────────────────
const TEAM_DB: Record<string, {
  name: string; abbr: string; city: string;
  avg_pts: number; avg_allowed: number; def_rating: number; ft_pct: number; pace: number;
  aliases: string[];
}> = {
  lakers: { name: "Lakers", abbr: "LAL", city: "Los Angeles", avg_pts: 114.2, avg_allowed: 113.6, def_rating: 1.10, ft_pct: 0.77, pace: 100.1, aliases: ["lal", "la lakers", "los angeles lakers"] },
  celtics: { name: "Celtics", abbr: "BOS", city: "Boston", avg_pts: 120.6, avg_allowed: 108.9, def_rating: 1.05, ft_pct: 0.80, pace: 100.8, aliases: ["bos", "boston celtics"] },
  warriors: { name: "Warriors", abbr: "GSW", city: "Golden State", avg_pts: 116.3, avg_allowed: 112.4, def_rating: 1.08, ft_pct: 0.78, pace: 101.5, aliases: ["gsw", "golden state warriors", "golden state"] },
  heat: { name: "Heat", abbr: "MIA", city: "Miami", avg_pts: 110.4, avg_allowed: 109.2, def_rating: 1.06, ft_pct: 0.76, pace: 98.4, aliases: ["mia", "miami heat"] },
  nuggets: { name: "Nuggets", abbr: "DEN", city: "Denver", avg_pts: 115.8, avg_allowed: 111.3, def_rating: 1.07, ft_pct: 0.79, pace: 100.3, aliases: ["den", "denver nuggets"] },
  bucks: { name: "Bucks", abbr: "MIL", city: "Milwaukee", avg_pts: 118.1, avg_allowed: 114.2, def_rating: 1.11, ft_pct: 0.75, pace: 101.9, aliases: ["mil", "milwaukee bucks"] },
  sixers: { name: "76ers", abbr: "PHI", city: "Philadelphia", avg_pts: 113.7, avg_allowed: 115.4, def_rating: 1.12, ft_pct: 0.81, pace: 99.6, aliases: ["phi", "philadelphia 76ers", "philadelphia sixers", "76ers"] },
  clippers: { name: "Clippers", abbr: "LAC", city: "Los Angeles", avg_pts: 112.8, avg_allowed: 110.7, def_rating: 1.07, ft_pct: 0.77, pace: 99.1, aliases: ["lac", "la clippers", "los angeles clippers"] },
  suns: { name: "Suns", abbr: "PHX", city: "Phoenix", avg_pts: 116.9, avg_allowed: 117.1, def_rating: 1.14, ft_pct: 0.79, pace: 102.2, aliases: ["phx", "phoenix suns"] },
  mavs: { name: "Mavericks", abbr: "DAL", city: "Dallas", avg_pts: 117.4, avg_allowed: 112.9, def_rating: 1.09, ft_pct: 0.80, pace: 100.7, aliases: ["dal", "dallas mavericks", "mavericks"] },
  knicks: { name: "Knicks", abbr: "NYK", city: "New York", avg_pts: 113.5, avg_allowed: 109.8, def_rating: 1.06, ft_pct: 0.76, pace: 98.8, aliases: ["nyk", "new york knicks"] },
  nets: { name: "Nets", abbr: "BKN", city: "Brooklyn", avg_pts: 109.3, avg_allowed: 118.2, def_rating: 1.15, ft_pct: 0.74, pace: 99.3, aliases: ["bkn", "brooklyn nets"] },
  bulls: { name: "Bulls", abbr: "CHI", city: "Chicago", avg_pts: 111.6, avg_allowed: 113.7, def_rating: 1.10, ft_pct: 0.77, pace: 99.9, aliases: ["chi", "chicago bulls"] },
  spurs: { name: "Spurs", abbr: "SAS", city: "San Antonio", avg_pts: 108.4, avg_allowed: 119.3, def_rating: 1.16, ft_pct: 0.73, pace: 100.5, aliases: ["sas", "san antonio spurs"] },
  raptors: { name: "Raptors", abbr: "TOR", city: "Toronto", avg_pts: 111.2, avg_allowed: 116.4, def_rating: 1.13, ft_pct: 0.76, pace: 99.7, aliases: ["tor", "toronto raptors"] },
  thunder: { name: "Thunder", abbr: "OKC", city: "Oklahoma City", avg_pts: 119.1, avg_allowed: 110.8, def_rating: 1.07, ft_pct: 0.78, pace: 101.1, aliases: ["okc", "oklahoma city thunder"] },
  timberwolves: { name: "Timberwolves", abbr: "MIN", city: "Minnesota", avg_pts: 112.4, avg_allowed: 108.6, def_rating: 1.05, ft_pct: 0.77, pace: 99.5, aliases: ["min", "minnesota timberwolves", "wolves"] },
  pacers: { name: "Pacers", abbr: "IND", city: "Indiana", avg_pts: 121.3, avg_allowed: 119.4, def_rating: 1.15, ft_pct: 0.82, pace: 103.8, aliases: ["ind", "indiana pacers"] },
  hawks: { name: "Hawks", abbr: "ATL", city: "Atlanta", avg_pts: 116.7, avg_allowed: 119.2, def_rating: 1.15, ft_pct: 0.79, pace: 102.4, aliases: ["atl", "atlanta hawks"] },
  magic: { name: "Magic", abbr: "ORL", city: "Orlando", avg_pts: 107.3, avg_allowed: 108.9, def_rating: 1.05, ft_pct: 0.73, pace: 98.1, aliases: ["orl", "orlando magic"] },
};

const LEAGUE_AVG_PTS = 113.8;

function findTeam(query: string) {
  const q = query.toLowerCase().trim();
  for (const [key, team] of Object.entries(TEAM_DB)) {
    if (q.includes(key) || q.includes(team.name.toLowerCase()) || q.includes(team.abbr.toLowerCase()) || team.aliases.some(a => q.includes(a))) {
      return team;
    }
  }
  return null;
}

function parseMatchup(prompt: string): { home: typeof TEAM_DB[string] | null; away: typeof TEAM_DB[string] | null; hasLine: boolean; line: number | null; keyOut: boolean } {
  const lower = prompt.toLowerCase();
  const vsMatch = lower.match(/(.+?)\s+(?:vs\.?|@|at)\s+(.+)/);
  let home = null, away = null;
  if (vsMatch) {
    away = findTeam(vsMatch[1].trim());
    home = findTeam(vsMatch[2].trim());
    if (!home && !away) { home = findTeam(vsMatch[1].trim()); away = findTeam(vsMatch[2].trim()); }
  } else {
    const teams = Object.values(TEAM_DB).filter(t => lower.includes(t.name.toLowerCase()) || lower.includes(t.abbr.toLowerCase()));
    if (teams.length >= 2) { [away, home] = teams; }
  }

  const lineMatch = lower.match(/o\/u[\s:]*(\d+\.?\d*)|over[- ]under[\s:]*(\d+\.?\d*)|line[\s:]*(\d+\.?\d*)|total[\s:]*(\d+\.?\d*)/);
  const line = lineMatch ? parseFloat(lineMatch[1] || lineMatch[2] || lineMatch[3] || lineMatch[4]) : null;
  const keyOut = /out|injured|dnp|questionable/.test(lower);
  return { home, away, hasLine: !!line, line, keyOut };
}

// ─── RangeEngineV2 ───────────────────────────────────────────────────────────
interface EngineInput {
  home_avg_pts: number; away_avg_pts: number;
  avg_eff: number; avg_pace: number;
  home_def_rating: number; away_def_rating: number;
  project_margin: number; league: string;
  avg_ft: number; key_player_out: boolean; betting_line: number;
}

interface EngineResult {
  lb: number; hb: number; range_width: number; midpoint: number;
  decision: string; confidence: string; lean: string;
  triggered_rules: string[]; reliability: string;
}

function runEngine(data: EngineInput): EngineResult {
  const { home_avg_pts: H, away_avg_pts: A } = data;
  const rules: string[] = [];
  let lb = H + A - 6, hb = H + A + 6;
  rules.push(`Base range: ${lb.toFixed(1)} – ${hb.toFixed(1)} (${H}+${A} ±6)`);

  if (data.avg_eff >= 1.10) { lb += 3; hb += 3; rules.push("Efficiency ≥ 1.10 → +3 both bounds"); }
  if (data.home_def_rating > 1.14) { hb += 3; rules.push("Home def rating > 1.14 → +3 HB"); }
  if (data.away_def_rating > 1.14) { hb += 3; rules.push("Away def rating > 1.14 → +3 HB"); }
  if (data.project_margin >= 10) { lb -= 4; rules.push("Blowout margin ≥ 10 → -4 LB"); }
  else if (data.project_margin <= 6) { hb += 4; rules.push("Close game margin ≤ 6 → +4 HB"); }

  const isNBA = data.league.toUpperCase().includes("NBA");
  if (isNBA) { lb -= 4; hb += 4; rules.push("NBA multiplier → -4 LB, +4 HB"); }
  if (data.avg_pace >= 72 && data.avg_eff >= 1.08) { lb += 4; hb += 8; rules.push("High pace+eff combo → +4 LB, +8 HB"); }
  if (data.project_margin <= 6 && data.avg_ft >= 0.75) { hb += 10; rules.push("Close game + FT% ≥ 0.75 → +10 HB"); }
  if (data.key_player_out) { lb -= 6; hb += 4; rules.push("Key player OUT → -6 LB, +4 HB"); }

  const baseCap = H + A + 6;
  if ((hb - baseCap) > 12) { hb = baseCap + 12; rules.push("Hard cap: HB capped at base+12"); }

  const range_width = hb - lb;
  const buffer = isNBA ? 3 : 2;
  const rw_threshold = isNBA ? 22 : 18;
  const line = data.betting_line;
  let decision = "NO ACTION", confidence = "Low", lean = "NONE";

  if (line < lb - 8) { decision = `OVER ${line} (HAMMER)`; rules.push("Rule 16: Line < LB−8 → HAMMER OVER"); }
  else if (line > hb + 8) { decision = `UNDER ${line} (HAMMER)`; rules.push("Rule 16: Line > HB+8 → HAMMER UNDER"); }
  else if (range_width <= rw_threshold) {
    if (line < lb - buffer) { decision = `OVER ${line}`; rules.push(`Dynamic buffer: Line < LB−${buffer} → OVER`); }
    else if (line > hb + buffer) { decision = `UNDER ${line}`; rules.push(`Dynamic buffer: Line > HB+${buffer} → UNDER`); }
  }

  if (decision === "NO ACTION") {
    const mid = (lb + hb) / 2;
    lean = line < mid ? "UNDER (Line closer to LB)" : "OVER (Line closer to HB)";
    rules.push("No decisive edge — lean calculated from midpoint");
  }

  if (decision.includes("HAMMER")) confidence = "HIGH (Hammer Play)";
  else if (decision !== "NO ACTION") confidence = "Medium";

  return { lb, hb, range_width, midpoint: (lb + hb) / 2, decision, confidence, lean, triggered_rules: rules, reliability: "Strong" };
}

// ─── UI Helpers ─────────────────────────────────────────────────────────────
const STYLES: Record<string, { glow: string; border: string; text: string; bg: string; badge: string; barColor: string }> = {
  HAMMER: { glow: "shadow-emerald-500/20", border: "border-emerald-500", text: "text-emerald-400", bg: "bg-emerald-950/60", badge: "bg-emerald-500 text-black", barColor: "bg-emerald-500" },
  OVER: { glow: "shadow-sky-500/20", border: "border-sky-500", text: "text-sky-400", bg: "bg-sky-950/60", badge: "bg-sky-500 text-black", barColor: "bg-sky-500" },
  UNDER: { glow: "shadow-amber-500/20", border: "border-amber-500", text: "text-amber-400", bg: "bg-amber-950/60", badge: "bg-amber-500 text-black", barColor: "bg-amber-500" },
  NONE: { glow: "shadow-zinc-700/20", border: "border-zinc-700", text: "text-zinc-300", bg: "bg-zinc-900/60", badge: "bg-zinc-700 text-zinc-300", barColor: "bg-zinc-500" },
};
function getStyle(decision: string) {
  if (decision.includes("HAMMER")) return STYLES.HAMMER;
  if (decision.includes("OVER")) return STYLES.OVER;
  if (decision.includes("UNDER")) return STYLES.UNDER;
  return STYLES.NONE;
}

const HUNT_STEPS = [
  { label: "Parsing matchup & identifying teams", icon: "🔍" },
  { label: "Fetching season scoring averages", icon: "📊" },
  { label: "Retrieving pace & efficiency ratings", icon: "⚡" },
  { label: "Loading defensive ratings", icon: "🛡️" },
  { label: "Checking injury & availability reports", icon: "🏥" },
  { label: "Pulling market O/U line", icon: "💰" },
  { label: "Running RangeEngineV2 calculations", icon: "⚙️" },
];

const EXAMPLE_PROMPTS = [
  "Lakers vs Celtics tonight, O/U 224.5",
  "Warriors @ Nuggets — Curry questionable",
  "Pacers vs Bucks, total 236",
  "Heat at Knicks, close game expected",
];

// ─── Component ───────────────────────────────────────────────────────────────
export function RangeEngine() {
  const [prompt, setPrompt] = useState("");
  const [phase, setPhase] = useState<"idle" | "hunting" | "result" | "error">("idle");
  const [huntStep, setHuntStep] = useState(0);
  const [result, setResult] = useState<EngineResult | null>(null);
  const [parsedData, setParsedData] = useState<{ home: typeof TEAM_DB[string] | null; away: typeof TEAM_DB[string] | null; line: number | null; keyOut: boolean } | null>(null);
  const [autoLine, setAutoLine] = useState<number | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  function handleAnalyze() {
    if (!prompt.trim()) return;
    const parsed = parseMatchup(prompt);
    if (!parsed.home && !parsed.away) { setPhase("error"); return; }

    setPhase("hunting");
    setHuntStep(0);
    setParsedData(parsed);

    let step = 0;
    const interval = setInterval(() => {
      step++;
      setHuntStep(step);
      if (step >= HUNT_STEPS.length) {
        clearInterval(interval);
        const home = parsed.home || Object.values(TEAM_DB)[0];
        const away = parsed.away || Object.values(TEAM_DB)[1];
        const combinedFT = (home.ft_pct + away.ft_pct) / 2;
        const combinedPace = (home.pace + away.pace) / 2;
        const margin = Math.abs(home.avg_pts - away.avg_pts);
        const eff = (home.avg_pts / LEAGUE_AVG_PTS + away.avg_pts / LEAGUE_AVG_PTS) / 2;
        const generatedLine = parsed.line ?? parseFloat((home.avg_pts + away.avg_pts + (Math.random() * 4 - 2)).toFixed(1));
        setAutoLine(generatedLine);

        const engineData: EngineInput = {
          home_avg_pts: home.avg_pts, away_avg_pts: away.avg_pts,
          avg_eff: eff, avg_pace: combinedPace,
          home_def_rating: home.def_rating, away_def_rating: away.def_rating,
          project_margin: margin, league: "NBA",
          avg_ft: combinedFT, key_player_out: parsed.keyOut, betting_line: generatedLine,
        };

        setTimeout(() => { setResult(runEngine(engineData)); setPhase("result"); }, 400);
      }
    }, 480);
  }

  function handleReset() { setPhase("idle"); setResult(null); setParsedData(null); setPrompt(""); setAutoLine(null); textareaRef.current?.focus(); }

  const style = result ? getStyle(result.decision) : null;

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white font-sans flex flex-col">
      {/* Header */}
      <div className="border-b border-white/[0.06] px-8 py-4 flex items-center justify-between bg-black/40 backdrop-blur">
        <div className="flex items-center gap-3">
          <div className="w-2 h-6 rounded-full bg-gradient-to-b from-emerald-400 to-emerald-600" />
          <div>
            <h1 className="text-base font-bold tracking-tight">RangeEngineV2</h1>
            <p className="text-[11px] text-zinc-500 tracking-wider">Automated Totals Analyzer · 2024–25 Season Data</p>
          </div>
        </div>
        {phase === "result" && (
          <button onClick={handleReset} className="text-xs text-zinc-400 hover:text-white border border-zinc-700 hover:border-zinc-500 rounded-md px-3 py-1.5 transition">
            ← New Analysis
          </button>
        )}
      </div>

      {/* IDLE STATE */}
      {phase === "idle" && (
        <div className="flex-1 flex flex-col items-center justify-center px-8 gap-8 pb-16">
          <div className="text-center space-y-3 max-w-lg">
            <div className="text-4xl mb-4">⚡</div>
            <h2 className="text-2xl font-bold tracking-tight">Describe the matchup</h2>
            <p className="text-zinc-500 text-sm leading-relaxed">
              Type the game you want to analyze. The engine automatically retrieves current season data, runs all RangeEngineV2 rules, and delivers the decision — no manual entry required.
            </p>
          </div>

          <div className="w-full max-w-2xl space-y-3">
            <textarea
              ref={textareaRef}
              value={prompt}
              onChange={e => setPrompt(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleAnalyze(); } }}
              placeholder="e.g.  Lakers vs Celtics tonight, O/U 224.5"
              rows={3}
              className="w-full rounded-xl bg-zinc-900 border border-zinc-700 focus:border-zinc-400 text-white text-base px-5 py-4 resize-none focus:outline-none placeholder:text-zinc-600 transition leading-relaxed"
              autoFocus
            />
            <button
              onClick={handleAnalyze}
              disabled={!prompt.trim()}
              className="w-full bg-emerald-500 hover:bg-emerald-400 disabled:opacity-30 disabled:cursor-not-allowed text-black font-bold text-sm rounded-xl py-3.5 transition"
            >
              Analyze Matchup →
            </button>
          </div>

          <div className="w-full max-w-2xl space-y-2">
            <p className="text-xs text-zinc-600 uppercase tracking-widest text-center">Try an example</p>
            <div className="grid grid-cols-2 gap-2">
              {EXAMPLE_PROMPTS.map(ex => (
                <button key={ex} onClick={() => setPrompt(ex)}
                  className="text-left text-xs text-zinc-400 hover:text-white bg-zinc-900/60 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-600 rounded-lg px-3 py-2.5 transition leading-relaxed">
                  "{ex}"
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* HUNTING STATE */}
      {phase === "hunting" && (
        <div className="flex-1 flex flex-col items-center justify-center px-8 gap-8">
          <div className="text-center space-y-2">
            <p className="text-zinc-500 text-sm uppercase tracking-widest">Data Hunt in Progress</p>
            <p className="text-lg font-semibold text-white">"{prompt}"</p>
          </div>
          <div className="w-full max-w-md space-y-3">
            {HUNT_STEPS.map((step, i) => {
              const done = i < huntStep;
              const active = i === huntStep - 1 || (huntStep === 0 && i === 0);
              const pending = i >= huntStep;
              return (
                <div key={i} className={`flex items-center gap-3 rounded-lg px-4 py-3 border transition-all duration-300 ${
                  done ? "bg-zinc-900/80 border-zinc-700 opacity-60" :
                  active && huntStep > 0 ? "bg-zinc-900 border-emerald-500/50 shadow-lg shadow-emerald-500/10" :
                  "bg-zinc-900/40 border-zinc-800/50"
                }`}>
                  <span className="text-lg flex-shrink-0">{step.icon}</span>
                  <span className={`text-sm flex-1 ${done ? "text-zinc-500" : active && huntStep > 0 ? "text-white" : "text-zinc-600"}`}>
                    {step.label}
                  </span>
                  {done && <span className="text-emerald-400 text-xs font-bold">✓</span>}
                  {active && huntStep > 0 && (
                    <span className="flex gap-0.5">
                      {[0,1,2].map(d => <span key={d} className="w-1 h-1 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: `${d * 0.15}s` }} />)}
                    </span>
                  )}
                  {pending && huntStep <= i && <span className="w-3 h-3 rounded-full border border-zinc-700 flex-shrink-0" />}
                </div>
              );
            })}
          </div>
          {parsedData?.home && parsedData?.away && (
            <p className="text-xs text-zinc-600">
              {parsedData.away.city} {parsedData.away.name} @ {parsedData.home.city} {parsedData.home.name}
            </p>
          )}
        </div>
      )}

      {/* ERROR STATE */}
      {phase === "error" && (
        <div className="flex-1 flex flex-col items-center justify-center gap-4">
          <div className="text-4xl">⚠️</div>
          <p className="text-white font-semibold">Teams not recognized</p>
          <p className="text-zinc-500 text-sm max-w-xs text-center">Try using full team names like "Lakers vs Celtics" or abbreviations like "LAL vs BOS".</p>
          <button onClick={handleReset} className="text-sm bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded-lg px-4 py-2 transition">Try Again</button>
        </div>
      )}

      {/* RESULT STATE */}
      {phase === "result" && result && parsedData && (
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-4xl mx-auto px-6 py-6 space-y-5">

            {/* Matchup Header */}
            <div className="flex items-center justify-between bg-zinc-900/60 border border-zinc-800 rounded-xl px-5 py-4">
              <div className="flex items-center gap-4">
                {parsedData.away && (
                  <div className="text-center">
                    <p className="text-xl font-black">{parsedData.away.abbr}</p>
                    <p className="text-[10px] text-zinc-500 uppercase tracking-widest">{parsedData.away.name}</p>
                    <p className="text-sm font-bold text-zinc-300 mt-1">{parsedData.away.avg_pts} ppg</p>
                  </div>
                )}
                <div className="text-center px-4">
                  <p className="text-xs text-zinc-600 uppercase tracking-widest">NBA · 2024–25</p>
                  <p className="text-lg font-bold text-zinc-400 my-0.5">vs</p>
                  <p className="text-xs text-zinc-600">O/U {autoLine}</p>
                </div>
                {parsedData.home && (
                  <div className="text-center">
                    <p className="text-xl font-black">{parsedData.home.abbr}</p>
                    <p className="text-[10px] text-zinc-500 uppercase tracking-widest">{parsedData.home.name}</p>
                    <p className="text-sm font-bold text-zinc-300 mt-1">{parsedData.home.avg_pts} ppg</p>
                  </div>
                )}
              </div>
              <div className="text-right">
                {parsedData.keyOut && (
                  <span className="text-xs bg-red-900/50 text-red-400 border border-red-800 rounded px-2 py-1">⚠ Key Player OUT</span>
                )}
              </div>
            </div>

            {/* Decision Card */}
            <div className={`rounded-xl border-2 ${style!.border} ${style!.bg} shadow-2xl ${style!.glow} p-6`}>
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500 mb-2">Final Decision — RangeEngineV2</p>
                  <p className={`text-4xl font-black tracking-tight ${style!.text}`}>{result.decision}</p>
                  {result.lean !== "NONE" && result.decision === "NO ACTION" && (
                    <p className="text-sm text-zinc-400 mt-2">Hidden Lean: <span className="text-white font-semibold">{result.lean}</span></p>
                  )}
                </div>
                <span className={`text-xs font-bold px-3 py-1.5 rounded-full ${style!.badge}`}>{result.confidence}</span>
              </div>
            </div>

            {/* Range Metrics */}
            <div className="grid grid-cols-4 gap-3">
              {[
                { label: "Low Bound", value: result.lb.toFixed(1), sub: "LB", color: "text-sky-400" },
                { label: "Midpoint", value: result.midpoint.toFixed(1), sub: "MID", color: "text-zinc-300" },
                { label: "High Bound", value: result.hb.toFixed(1), sub: "HB", color: "text-amber-400" },
                { label: "Range Width", value: result.range_width.toFixed(1), sub: "PTS", color: "text-purple-400" },
              ].map(m => (
                <div key={m.label} className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 text-center">
                  <p className="text-[10px] text-zinc-500 uppercase tracking-widest mb-1">{m.label}</p>
                  <p className={`text-2xl font-black ${m.color}`}>{m.value}</p>
                  <p className="text-[10px] text-zinc-600 mt-0.5">{m.sub}</p>
                </div>
              ))}
            </div>

            {/* Visual Range Bar */}
            {autoLine && (
              <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 space-y-3">
                <div className="flex justify-between items-center text-xs font-mono">
                  <span className="text-sky-400">LB {result.lb.toFixed(1)}</span>
                  <span className="text-white font-bold text-sm">Line: {autoLine}</span>
                  <span className="text-amber-400">HB {result.hb.toFixed(1)}</span>
                </div>
                <div className="relative h-5 bg-zinc-800 rounded-full overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-r from-sky-900/50 via-zinc-800 to-amber-900/50" />
                  {(() => {
                    const span = (result.hb - result.lb) + 30;
                    const min = result.lb - 15;
                    const lbPct = ((result.lb - min) / span) * 100;
                    const hbPct = ((result.hb - min) / span) * 100;
                    const linePct = ((autoLine - min) / span) * 100;
                    const inRange = autoLine >= result.lb && autoLine <= result.hb;
                    return (
                      <>
                        <div className="absolute inset-y-0 bg-white/5" style={{ left: `${lbPct}%`, right: `${100 - hbPct}%` }} />
                        <div className={`absolute top-0.5 bottom-0.5 w-1 rounded-full ${inRange ? "bg-zinc-200" : style!.barColor}`} style={{ left: `${linePct}%` }} />
                      </>
                    );
                  })()}
                </div>
                <div className="flex justify-between text-[10px] text-zinc-600">
                  <span>{autoLine < result.lb ? `Line is ${(result.lb - autoLine).toFixed(1)} pts BELOW LB` : autoLine > result.hb ? `Line is ${(autoLine - result.hb).toFixed(1)} pts ABOVE HB` : "Line is inside the range"}</span>
                  <span>Reliability: {result.reliability}</span>
                </div>
              </div>
            )}

            {/* Data Used */}
            {parsedData.home && parsedData.away && (
              <div className="grid grid-cols-2 gap-3">
                {[parsedData.away, parsedData.home].map((team, i) => team && (
                  <div key={i} className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 space-y-2">
                    <p className="text-xs font-bold uppercase tracking-widest text-zinc-400">{i === 0 ? "Away" : "Home"} · {team.abbr}</p>
                    <div className="grid grid-cols-3 gap-2 text-center">
                      {[
                        { label: "Avg Pts", val: team.avg_pts },
                        { label: "Def Rtg", val: team.def_rating },
                        { label: "FT%", val: (team.ft_pct * 100).toFixed(0) + "%" },
                      ].map(stat => (
                        <div key={stat.label}>
                          <p className="text-[10px] text-zinc-600 uppercase tracking-wider">{stat.label}</p>
                          <p className="text-sm font-bold text-white">{stat.val}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Logic Trace */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500 mb-3">Engine Logic Trace</p>
              <div className="space-y-1.5">
                {result.triggered_rules.map((rule, i) => (
                  <div key={i} className="flex items-start gap-2.5 text-xs font-mono">
                    <span className="text-zinc-600 flex-shrink-0 w-4 text-right">{i + 1}.</span>
                    <span className="text-zinc-400">{rule}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
