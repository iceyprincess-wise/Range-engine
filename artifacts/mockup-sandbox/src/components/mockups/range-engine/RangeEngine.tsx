import { useState } from "react";

interface EngineData {
  home_avg_pts: number | null;
  away_avg_pts: number | null;
  avg_eff: number | null;
  avg_pace: number | null;
  home_def_rating: number | null;
  away_def_rating: number | null;
  project_margin: number | null;
  league: string;
  avg_ft: number | null;
  key_player_out: boolean;
  betting_line: number | null;
}

interface EngineResult {
  lb: number;
  hb: number;
  range_width: number;
  reliability: string;
  decision: string;
  confidence: string;
  lean: string;
  triggered_rules: string[];
  notes: string[];
  midpoint: number;
}

function runRangeEngineV2(data: EngineData): EngineResult {
  const notes: string[] = [];
  const triggered_rules: string[] = [];

  const home_avg = data.home_avg_pts;
  const away_avg = data.away_avg_pts;

  if (!home_avg || !away_avg) {
    notes.push("Missing core scoring data.");
    return {
      lb: 0, hb: 0, range_width: 0, reliability: "Weak",
      decision: "NO ACTION", confidence: "Low", lean: "NONE",
      triggered_rules, notes, midpoint: 0,
    };
  }

  let lb = home_avg + away_avg - 6;
  let hb = home_avg + away_avg + 6;
  triggered_rules.push(`Base range set: ${lb.toFixed(1)} – ${hb.toFixed(1)}`);

  const eff = data.avg_eff;
  const pace = data.avg_pace;

  if (eff && eff >= 1.10) {
    lb += 3; hb += 3;
    triggered_rules.push("Rule: avg_eff ≥ 1.10 → +3 to LB & HB");
  }

  const home_def = data.home_def_rating;
  const away_def = data.away_def_rating;

  if (home_def && home_def > 1.14) {
    hb += 3;
    triggered_rules.push("Rule: home_def_rating > 1.14 → +3 to HB");
  }
  if (away_def && away_def > 1.14) {
    hb += 3;
    triggered_rules.push("Rule: away_def_rating > 1.14 → +3 to HB");
  }

  const margin = data.project_margin;
  if (margin !== null) {
    if (margin >= 10) {
      lb -= 4;
      triggered_rules.push("Rule: margin ≥ 10 → -4 to LB (blowout dampener)");
    } else if (margin <= 6) {
      hb += 4;
      triggered_rules.push("Rule: margin ≤ 6 → +4 to HB (close game expansion)");
    }
  }

  const league = data.league.toUpperCase();
  if (league.includes("NBA")) {
    lb -= 4; hb += 4;
    triggered_rules.push("Rule: NBA league → -4 LB, +4 HB");
  }

  if (pace && pace >= 72 && eff && eff >= 1.08) {
    lb += 4; hb += 8;
    triggered_rules.push("Rule: pace ≥ 72 & eff ≥ 1.08 → +4 LB, +8 HB");
  }

  const ft = data.avg_ft;
  if (margin !== null && margin <= 6 && ft && ft >= 0.75) {
    hb += 10;
    triggered_rules.push("Rule: margin ≤ 6 & FT% ≥ 0.75 → +10 to HB (late FT inflation)");
  }

  if (data.key_player_out) {
    lb -= 6; hb += 4;
    triggered_rules.push("Rule: key_player_out → -6 LB, +4 HB (star absence)");
  }

  const baseCap = home_avg + away_avg + 6;
  if ((hb - baseCap) > 12) {
    hb = baseCap + 12;
    triggered_rules.push("Hard Cap applied: HB capped at base+12");
  }

  const range_width = hb - lb;
  const betting_line = data.betting_line;

  let decision = "NO ACTION";
  let confidence = "Low";
  let lean = "NONE";

  if (!betting_line) {
    notes.push("Missing market line.");
  } else {
    const buffer_zone = league.includes("NBA") ? 3 : 2;
    const nba_rw_threshold = league.includes("NBA") ? 22 : 18;

    if (betting_line < (lb - 8)) {
      decision = `OVER ${betting_line} (HAMMER)`;
      triggered_rules.push("Rule 16: Line < LB−8 → HAMMER OVER");
    } else if (betting_line > (hb + 8)) {
      decision = `UNDER ${betting_line} (HAMMER)`;
      triggered_rules.push("Rule 16: Line > HB+8 → HAMMER UNDER");
    } else if (range_width <= nba_rw_threshold) {
      if (betting_line < (lb - buffer_zone)) {
        decision = `OVER ${betting_line}`;
        triggered_rules.push(`Rule 13: Line < LB−${buffer_zone} → OVER`);
      } else if (betting_line > (hb + buffer_zone)) {
        decision = `UNDER ${betting_line}`;
        triggered_rules.push(`Rule 13: Line > HB+${buffer_zone} → UNDER`);
      }
    }

    if (decision === "NO ACTION") {
      const midpoint = (lb + hb) / 2;
      if (betting_line < midpoint) lean = "UNDER (Line closer to LB)";
      else if (betting_line > midpoint) lean = "OVER (Line closer to HB)";
      triggered_rules.push("Rule 14: Decision within buffer → NO ACTION, lean calculated");
    }

    if (decision.includes("HAMMER")) confidence = "HIGH (Hammer Play)";
    else if (decision !== "NO ACTION") confidence = "Medium";
    else confidence = "Low";
  }

  const midpoint = (lb + hb) / 2;

  let reliability = "Strong";
  if (!eff || !pace) reliability = "Weak";

  return { lb, hb, range_width, reliability, decision, confidence, lean, triggered_rules, notes, midpoint };
}

const DECISION_STYLE: Record<string, { bg: string; border: string; text: string; badge: string }> = {
  HAMMER: { bg: "bg-emerald-950", border: "border-emerald-400", text: "text-emerald-300", badge: "bg-emerald-500 text-black" },
  OVER: { bg: "bg-sky-950", border: "border-sky-400", text: "text-sky-300", badge: "bg-sky-500 text-black" },
  UNDER: { bg: "bg-amber-950", border: "border-amber-400", text: "text-amber-300", badge: "bg-amber-500 text-black" },
  "NO ACTION": { bg: "bg-zinc-900", border: "border-zinc-600", text: "text-zinc-300", badge: "bg-zinc-600 text-zinc-200" },
};

function getStyle(decision: string) {
  if (decision.includes("HAMMER")) return DECISION_STYLE.HAMMER;
  if (decision.includes("OVER")) return DECISION_STYLE.OVER;
  if (decision.includes("UNDER")) return DECISION_STYLE.UNDER;
  return DECISION_STYLE["NO ACTION"];
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-semibold uppercase tracking-widest text-zinc-400">{label}</label>
      {children}
    </div>
  );
}

function NumInput({ value, onChange, step = "0.01", placeholder = "—" }: {
  value: string; onChange: (v: string) => void; step?: string; placeholder?: string;
}) {
  return (
    <input
      type="number"
      step={step}
      value={value}
      placeholder={placeholder}
      onChange={e => onChange(e.target.value)}
      className="w-full rounded-md bg-zinc-800 border border-zinc-700 text-white text-sm px-3 py-2 focus:outline-none focus:border-zinc-400 placeholder:text-zinc-600 transition"
    />
  );
}

function ToggleInput({ value, onChange, label }: { value: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!value)}
      className={`flex items-center gap-2 rounded-md border px-3 py-2 text-sm font-medium transition ${
        value
          ? "bg-red-900 border-red-500 text-red-300"
          : "bg-zinc-800 border-zinc-700 text-zinc-400 hover:border-zinc-500"
      }`}
    >
      <span className={`w-3 h-3 rounded-full ${value ? "bg-red-400" : "bg-zinc-600"}`} />
      {label}
    </button>
  );
}

export function RangeEngine() {
  const [homeAvg, setHomeAvg] = useState("112.4");
  const [awayAvg, setAwayAvg] = useState("109.8");
  const [avgEff, setAvgEff] = useState("1.09");
  const [avgPace, setAvgPace] = useState("73");
  const [homeDefRating, setHomeDefRating] = useState("1.12");
  const [awayDefRating, setAwayDefRating] = useState("1.15");
  const [projectMargin, setProjectMargin] = useState("5");
  const [league, setLeague] = useState("NBA");
  const [avgFt, setAvgFt] = useState("0.78");
  const [keyPlayerOut, setKeyPlayerOut] = useState(false);
  const [bettingLine, setBettingLine] = useState("224.5");
  const [result, setResult] = useState<EngineResult | null>(null);
  const [ran, setRan] = useState(false);

  function handleAnalyze() {
    const data: EngineData = {
      home_avg_pts: homeAvg ? parseFloat(homeAvg) : null,
      away_avg_pts: awayAvg ? parseFloat(awayAvg) : null,
      avg_eff: avgEff ? parseFloat(avgEff) : null,
      avg_pace: avgPace ? parseFloat(avgPace) : null,
      home_def_rating: homeDefRating ? parseFloat(homeDefRating) : null,
      away_def_rating: awayDefRating ? parseFloat(awayDefRating) : null,
      project_margin: projectMargin ? parseFloat(projectMargin) : null,
      league,
      avg_ft: avgFt ? parseFloat(avgFt) : null,
      key_player_out: keyPlayerOut,
      betting_line: bettingLine ? parseFloat(bettingLine) : null,
    };
    setResult(runRangeEngineV2(data));
    setRan(true);
  }

  function handleReset() {
    setHomeAvg(""); setAwayAvg(""); setAvgEff(""); setAvgPace("");
    setHomeDefRating(""); setAwayDefRating(""); setProjectMargin("");
    setLeague("NBA"); setAvgFt(""); setKeyPlayerOut(false); setBettingLine("");
    setResult(null); setRan(false);
  }

  const style = result ? getStyle(result.decision) : null;

  const lineVal = bettingLine ? parseFloat(bettingLine) : null;

  return (
    <div className="min-h-screen bg-zinc-950 text-white font-sans flex flex-col">
      {/* Header */}
      <div className="border-b border-zinc-800 px-8 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-2 h-6 bg-emerald-400 rounded-full" />
          <div>
            <h1 className="text-lg font-bold tracking-tight text-white">RangeEngineV2</h1>
            <p className="text-xs text-zinc-500 tracking-wide">Sports Total Analyzer · No gut feelings — only the math</p>
          </div>
        </div>
        <span className="text-xs font-mono text-zinc-600 bg-zinc-900 border border-zinc-800 rounded px-2 py-1">v2.0</span>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Input Panel */}
        <div className="w-[420px] flex-shrink-0 border-r border-zinc-800 overflow-y-auto">
          <div className="p-6 space-y-6">
            {/* League */}
            <Field label="League">
              <select
                value={league}
                onChange={e => setLeague(e.target.value)}
                className="w-full rounded-md bg-zinc-800 border border-zinc-700 text-white text-sm px-3 py-2 focus:outline-none focus:border-zinc-400 transition"
              >
                <option value="NBA">NBA</option>
                <option value="NCAA">NCAA</option>
                <option value="EUROLEAGUE">EuroLeague</option>
                <option value="OTHER">Other</option>
              </select>
            </Field>

            {/* Scoring */}
            <div className="space-y-3">
              <p className="text-xs font-bold uppercase tracking-widest text-zinc-500 border-b border-zinc-800 pb-2">Scoring Averages</p>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Home Avg Pts">
                  <NumInput value={homeAvg} onChange={setHomeAvg} step="0.1" placeholder="e.g. 112.4" />
                </Field>
                <Field label="Away Avg Pts">
                  <NumInput value={awayAvg} onChange={setAwayAvg} step="0.1" placeholder="e.g. 109.8" />
                </Field>
              </div>
            </div>

            {/* Pace & Efficiency */}
            <div className="space-y-3">
              <p className="text-xs font-bold uppercase tracking-widest text-zinc-500 border-b border-zinc-800 pb-2">Pace & Efficiency</p>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Avg Efficiency">
                  <NumInput value={avgEff} onChange={setAvgEff} step="0.01" placeholder="e.g. 1.09" />
                </Field>
                <Field label="Avg Pace">
                  <NumInput value={avgPace} onChange={setAvgPace} step="0.1" placeholder="e.g. 73" />
                </Field>
              </div>
            </div>

            {/* Defensive Ratings */}
            <div className="space-y-3">
              <p className="text-xs font-bold uppercase tracking-widest text-zinc-500 border-b border-zinc-800 pb-2">Defensive Ratings</p>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Home Def Rating">
                  <NumInput value={homeDefRating} onChange={setHomeDefRating} step="0.01" placeholder="e.g. 1.12" />
                </Field>
                <Field label="Away Def Rating">
                  <NumInput value={awayDefRating} onChange={setAwayDefRating} step="0.01" placeholder="e.g. 1.15" />
                </Field>
              </div>
            </div>

            {/* Endgame */}
            <div className="space-y-3">
              <p className="text-xs font-bold uppercase tracking-widest text-zinc-500 border-b border-zinc-800 pb-2">Endgame Data</p>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Projected Margin">
                  <NumInput value={projectMargin} onChange={setProjectMargin} step="0.5" placeholder="e.g. 5" />
                </Field>
                <Field label="Avg FT%">
                  <NumInput value={avgFt} onChange={setAvgFt} step="0.01" placeholder="e.g. 0.78" />
                </Field>
              </div>
            </div>

            {/* Market & Injury */}
            <div className="space-y-3">
              <p className="text-xs font-bold uppercase tracking-widest text-zinc-500 border-b border-zinc-800 pb-2">Market & Injury</p>
              <Field label="Market O/U Line">
                <NumInput value={bettingLine} onChange={setBettingLine} step="0.5" placeholder="e.g. 224.5" />
              </Field>
              <ToggleInput value={keyPlayerOut} onChange={setKeyPlayerOut} label="Key Player OUT (leading scorer)" />
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-2">
              <button
                onClick={handleAnalyze}
                className="flex-1 bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-sm rounded-md py-3 transition"
              >
                Run Analysis
              </button>
              <button
                onClick={handleReset}
                className="px-4 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-medium text-sm rounded-md py-3 transition border border-zinc-700"
              >
                Reset
              </button>
            </div>
          </div>
        </div>

        {/* Output Panel */}
        <div className="flex-1 overflow-y-auto">
          {!ran ? (
            <div className="h-full flex flex-col items-center justify-center gap-4 text-zinc-700">
              <svg className="w-16 h-16 opacity-30" fill="none" viewBox="0 0 64 64" stroke="currentColor">
                <circle cx="32" cy="32" r="28" strokeWidth="2"/>
                <path d="M20 32h24M32 20v24" strokeWidth="2" strokeLinecap="round"/>
              </svg>
              <p className="text-sm font-medium tracking-wide">Enter fixture data and run the engine</p>
              <p className="text-xs text-zinc-700">All decisions are mathematically derived — no guesses</p>
            </div>
          ) : result && (
            <div className="p-6 space-y-5">
              {/* Decision Card */}
              <div className={`rounded-xl border-2 ${style!.border} ${style!.bg} p-6`}>
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-widest text-zinc-500 mb-1">Final Decision</p>
                    <p className={`text-3xl font-black tracking-tight ${style!.text}`}>{result.decision}</p>
                  </div>
                  <span className={`text-xs font-bold px-3 py-1 rounded-full ${style!.badge}`}>
                    {result.confidence}
                  </span>
                </div>
                {result.lean !== "NONE" && result.decision === "NO ACTION" && (
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-xs text-zinc-500 uppercase tracking-widest">Hidden Lean:</span>
                    <span className="text-sm font-semibold text-zinc-300">{result.lean}</span>
                  </div>
                )}
                {result.notes.length > 0 && (
                  <div className="mt-3 space-y-1">
                    {result.notes.map((n, i) => (
                      <p key={i} className="text-xs text-amber-400 bg-amber-950 rounded px-3 py-1">{n}</p>
                    ))}
                  </div>
                )}
              </div>

              {/* Range Metrics */}
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: "Low Bound (LB)", value: result.lb.toFixed(1), color: "text-sky-400" },
                  { label: "Midpoint", value: result.midpoint.toFixed(1), color: "text-zinc-300" },
                  { label: "High Bound (HB)", value: result.hb.toFixed(1), color: "text-amber-400" },
                ].map(m => (
                  <div key={m.label} className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 text-center">
                    <p className="text-xs text-zinc-500 uppercase tracking-widest mb-1">{m.label}</p>
                    <p className={`text-2xl font-black ${m.color}`}>{m.value}</p>
                  </div>
                ))}
              </div>

              {/* Range Bar */}
              {lineVal && (
                <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 space-y-2">
                  <div className="flex justify-between text-xs text-zinc-500 font-mono">
                    <span>LB {result.lb.toFixed(1)}</span>
                    <span className="text-white font-bold">Line {lineVal}</span>
                    <span>HB {result.hb.toFixed(1)}</span>
                  </div>
                  <div className="relative h-4 bg-zinc-800 rounded-full overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-r from-sky-900 via-zinc-700 to-amber-900" />
                    {(() => {
                      const rangeMin = result.lb - 15;
                      const rangeMax = result.hb + 15;
                      const rangeSpan = rangeMax - rangeMin;
                      const linePos = ((lineVal - rangeMin) / rangeSpan) * 100;
                      const lbPos = ((result.lb - rangeMin) / rangeSpan) * 100;
                      const hbPos = ((result.hb - rangeMin) / rangeSpan) * 100;
                      return (
                        <>
                          <div
                            className="absolute inset-y-0 bg-zinc-700 opacity-50"
                            style={{ left: `${lbPos}%`, right: `${100 - hbPos}%` }}
                          />
                          <div
                            className="absolute top-0 bottom-0 w-0.5 bg-white shadow-lg"
                            style={{ left: `${linePos}%` }}
                          />
                        </>
                      );
                    })()}
                  </div>
                  <div className="flex justify-between text-xs text-zinc-600 font-mono">
                    <span>Range Width: {result.range_width.toFixed(1)} pts</span>
                    <span>Reliability: {result.reliability}</span>
                  </div>
                </div>
              )}

              {/* Position Analysis */}
              {lineVal && (
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4">
                    <p className="text-xs text-zinc-500 uppercase tracking-widest mb-2">Line vs LB</p>
                    <p className={`text-lg font-bold ${lineVal < result.lb ? "text-emerald-400" : "text-zinc-400"}`}>
                      {lineVal < result.lb
                        ? `${(result.lb - lineVal).toFixed(1)} pts BELOW LB`
                        : `${(lineVal - result.lb).toFixed(1)} pts above LB`}
                    </p>
                    <p className="text-xs text-zinc-600 mt-1">
                      {lineVal < result.lb - 8 ? "▲ HAMMER zone triggered" :
                       lineVal < result.lb - 2 ? "OVER signal zone" : "Within range"}
                    </p>
                  </div>
                  <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4">
                    <p className="text-xs text-zinc-500 uppercase tracking-widest mb-2">Line vs HB</p>
                    <p className={`text-lg font-bold ${lineVal > result.hb ? "text-red-400" : "text-zinc-400"}`}>
                      {lineVal > result.hb
                        ? `${(lineVal - result.hb).toFixed(1)} pts ABOVE HB`
                        : `${(result.hb - lineVal).toFixed(1)} pts below HB`}
                    </p>
                    <p className="text-xs text-zinc-600 mt-1">
                      {lineVal > result.hb + 8 ? "▼ HAMMER zone triggered" :
                       lineVal > result.hb + 2 ? "UNDER signal zone" : "Within range"}
                    </p>
                  </div>
                </div>
              )}

              {/* Triggered Rules */}
              <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4">
                <p className="text-xs font-bold uppercase tracking-widest text-zinc-500 mb-3">Engine Logic Trace</p>
                <div className="space-y-1.5">
                  {result.triggered_rules.map((rule, i) => (
                    <div key={i} className="flex items-start gap-2 text-xs">
                      <span className="text-emerald-500 font-mono mt-0.5 flex-shrink-0">{String(i + 1).padStart(2, "0")}</span>
                      <span className="text-zinc-400 font-mono">{rule}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
