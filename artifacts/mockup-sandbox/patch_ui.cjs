const fs = require('fs');
const path = 'src/components/mockups/range-engine/RangeEngine.tsx';
let content = fs.readFileSync(path, 'utf8');

const logoStartStr = '<h1 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r';
const logoEndStr = '>SPLENDOR HUB</h1>';
if (content.includes(logoStartStr)) {
  const p1 = content.substring(0, content.indexOf(logoStartStr));
  const rest = content.substring(content.indexOf(logoStartStr));
  const p2 = rest.substring(rest.indexOf(logoEndStr) + logoEndStr.length);
  content = p1 + '<h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white via-zinc-200 to-zinc-500 drop-shadow-2xl mb-1" style={{ textShadow: \'0px 4px 6px rgba(0,0,0,0.9), 0px -1px 2px rgba(255,255,255,0.4), 0px 8px 15px rgba(0,0,0,0.5)\' }}>SPLENDOR HUB</h1>' + p2;
}

const navStartStr = '<div className="flex items-center gap-3 mt-4 flex-wrap justify-center">';
const navEndStr = '{/* Battery Pill - Telemetry Node */}';
if (content.includes(navStartStr) && content.includes(navEndStr)) {
  const p1 = content.substring(0, content.indexOf(navStartStr));
  const p2 = content.substring(content.indexOf(navEndStr));
  const newNav = `
        <div className="grid grid-cols-1 gap-3 mt-4 w-full max-w-sm">
          <div className="grid grid-cols-2 gap-2">
            {[
              { key: "analyzer", label: "Basketball Analyser 🏀" },
              { key: "football", label: "Football Analyser ⚽" }
            ].map((item) => (
              <button
                key={item.key}
                onClick={() => setTab(item.key as typeof tab)}
                className={\`text-[10px] px-2 py-2 rounded-lg font-bold uppercase tracking-widest transition border backdrop-blur-sm \${
                  tab === item.key
                    ? "bg-gradient-to-r from-emerald-600 to-cyan-600 text-white border-emerald-400 shadow-lg shadow-emerald-500/50"
                    : item.key === "football"
                    ? "text-zinc-300 border-emerald-600/30 hover:border-emerald-500 hover:text-emerald-300 bg-emerald-950/20"
                    : "text-zinc-400 border-zinc-700 hover:border-zinc-500 hover:text-white bg-zinc-900/30"
                }\`}
                title={item.key === "football" ? "Coming Soon" : ""}
              >
                {item.label}
              </button>
            ))}
          </div>
          <button
            onClick={() => setTab("history")}
            className={\`text-[10px] w-full px-4 py-2 rounded-lg font-bold uppercase tracking-widest transition border backdrop-blur-sm \${
              tab === "history"
                ? "bg-gradient-to-r from-emerald-600 to-cyan-600 text-white border-emerald-400 shadow-lg shadow-emerald-500/50"
                : "text-zinc-400 border-zinc-700 hover:border-zinc-500 hover:text-white bg-zinc-900/30"
            }\`}
          >
            Analysis Archive 🗄️ ({histStats.total})
          </button>
          `;
  content = p1 + newNav + p2;
}

const matchStartStr = '<div className="grid grid-cols-3 gap-3">';
const matchEndStr = '{/* Fixture */}';
if (content.includes(matchStartStr) && content.includes(matchEndStr)) {
  const m1 = content.substring(0, content.indexOf(matchStartStr));
  const m2 = content.substring(content.indexOf(matchEndStr));
  const newMatch = `
                  <div className="flex flex-col gap-3">
                    <Input label="Date *">
                      <Field type="date" value={date} onChange={setDate} />
                    </Input>

                    <div className="grid grid-cols-2 gap-3">
                      <Input label="OFFICIAL KICK-OFF TIME">
                        <Field type="time" value={koTime} onChange={setKoTime} />
                      </Input>
                      <Input label="Time to Tip-off (auto-calculated)">
                        <div
                          className={\`w-full rounded-lg px-3 py-2 text-[10px] font-bold border transition \${
                            tipOff.includes("NOW")
                              ? "bg-emerald-950/50 border-emerald-700 text-emerald-300"
                              : tipOff.includes("progress")
                                ? "bg-amber-950/50 border-amber-700 text-amber-300"
                                : tipOff
                                  ? "bg-zinc-800 border-zinc-600 text-white"
                                  : "bg-zinc-900 border-zinc-800 text-zinc-700"
                          }\`}
                        >
                          {tipOff || "Set KO Time + Current Time above →"}
                        </div>
                        {isEarlyPreMatch && (
                          <div className="mt-2 px-3 py-2 rounded-lg border border-red-800 bg-red-950/40 text-[9px] font-bold uppercase tracking-widest text-red-300">
                            EARLY READ: AWAITING FINAL SYNC
                          </div>
                        )}
                      </Input>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <Input label="Bookmaker">
                        <select
                          value={bookmaker}
                          onChange={(e) => setBookmaker(e.target.value)}
                          className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-zinc-500 transition"
                        >
                          <option>Sportybet</option>
                          <option>Bet365</option>
                          <option>Betway</option>
                          <option>Other</option>
                        </select>
                      </Input>
                      <Input label="Game ID (optional)">
                        <div className="relative">
                          <Field
                            value={gameId}
                            onChange={setGameId}
                            placeholder="Game ID"
                          />
                          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center justify-center">
                            <div className={\`w-2 h-2 rounded-sm \${!gameId ? 'border border-red-900/50 bg-red-950/20' : research?.scanning ? 'animate-ping bg-cyan-500' : research?.done ? 'bg-emerald-400 shadow-[0_0_8px_#34d399]' : 'bg-red-600 animate-pulse'}\`}></div>
                          </div>
                        </div>
                      </Input>
                    </div>

                    <Input label="🏀 BASKETBALL League / Competition *">
                      <Field
                        value={league}
                        onChange={setLeague}
                        list="leagues"
                        placeholder="Auto-search Global Leagues..."
                      />
                    </Input>

                    <div className="flex items-end w-full">
                      {league ? (
                        <div
                          className={\`text-[9px] px-2 py-2 rounded border font-bold w-full text-center \${getLeagueDNA(league).key === "DEFAULT" ? "border-amber-800 text-amber-600 bg-amber-950/30" : "border-emerald-900 text-emerald-600 bg-emerald-950/20"}\`}
                        >
                          🧬 {getLeagueDNA(league).name}
                        </div>
                      ) : (
                        <div className="text-[9px] px-2 py-2 rounded border border-zinc-800 text-zinc-700 w-full text-center">
                          DNA profile loads when league entered
                        </div>
                      )}
                    </div>
                  </div>
`;
  content = m1 + newMatch + m2;
}

fs.writeFileSync(path, content);
console.log('JSX React Patch Applied Successfully.');
