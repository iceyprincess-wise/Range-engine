const fs = require('fs');
const path = 'src/components/mockups/range-engine/RangeEngine.tsx';
let code = fs.readFileSync(path, 'utf8');

const startTag = '{/* Statistical DNA — read-only */}';
const endTag = '{/* Injury / Vacuum */}';

const startIndex = code.indexOf(startTag);
const endIndex = code.indexOf(endTag);

if (startIndex !== -1 && endIndex !== -1) {
  const newBlock = `
                        {/* STATISTICAL DNA & THERMAL MOMENTUM TIMELINE (V3 Upgraded) */}
                        <div className="px-4 py-3 space-y-3">
                          <div className="flex items-center justify-between border-b border-zinc-800 pb-1.5">
                            <p className="text-[9px] font-bold uppercase tracking-widest text-zinc-500">🧬 STATISTICAL DNA — Rules 3/5/7</p>
                            <span className="text-[8px] text-amber-500 font-mono tracking-widest animate-pulse">MOMENTUM SENSOR ACTIVE</span>
                          </div>

                          <div className="grid grid-cols-3 gap-3">
                            {[
                              ["Home Arena PPG", researchData.homeArenaPPG.toFixed(1), "text-sky-300"],
                              ["Away Road PPG", researchData.awayRoadPPG.toFixed(1), "text-amber-300"],
                              ["H2H Avg Total", researchData.h2hAvgTotal.toFixed(1), "text-violet-300"],
                            ].map(([lbl, val, cls]) => (
                              <div key={String(lbl)} className="bg-zinc-900 rounded-lg px-3 py-2 border border-zinc-800">
                                <p className="text-[8px] uppercase tracking-widest text-zinc-600">{lbl}</p>
                                <p className={\`text-sm font-black mt-0.5 \${cls}\`}>{val}</p>
                              </div>
                            ))}
                          </div>
                          <div className="grid grid-cols-4 gap-2">
                            {[
                              ["Home FT%", \`\${researchData.homeFt}%\`, "text-zinc-300"],
                              ["Away FT%", \`\${researchData.awayFt}%\`, "text-zinc-300"],
                              ["Home 3PT%", \`\${researchData.homePt3}%\`, "text-zinc-300"],
                              ["Away 3PT%", \`\${researchData.awayPt3}%\`, "text-zinc-300"],
                            ].map(([lbl, val, cls]) => (
                              <div key={String(lbl)} className="bg-zinc-900 rounded-lg px-2 py-1.5 border border-zinc-800 text-center">
                                <p className="text-[7px] uppercase tracking-widest text-zinc-600">{lbl}</p>
                                <p className={\`text-xs font-bold mt-0.5 \${cls}\`}>{val}</p>
                              </div>
                            ))}
                          </div>

                          {/* THERMAL MOMENTUM TIMELINE */}
                          <div className="bg-zinc-950 p-2 rounded-lg border border-zinc-800">
                            <div className="flex items-center justify-between mb-2">
                              <p className="text-[9px] text-zinc-400 uppercase tracking-widest font-bold">Historical Collapse Risk (Q1-Q4)</p>
                              <div className="flex items-center gap-1.5">
                                <span className={\`w-1.5 h-1.5 rounded-full \${researchData.collapsePct > 20 ? 'bg-blue-500 shadow-[0_0_5px_rgba(59,130,246,0.8)]' : 'bg-emerald-500'}\`}></span>
                                <span className="text-[8px] text-zinc-500">{researchData.collapsePct}% Risk Detected</span>
                              </div>
                            </div>
                            
                            <div className="grid grid-cols-4 gap-1.5">
                              {/* Q1 */}
                              <div className="relative h-7 bg-zinc-900 rounded border border-zinc-800 flex items-center justify-center overflow-hidden">
                                <span className="text-[10px] font-bold text-zinc-600 z-10">Q1</span>
                              </div>

                              {/* Q2 */}
                              <div className="relative h-7 bg-zinc-900 rounded border border-zinc-800 flex items-center justify-center overflow-hidden">
                                <span className="text-[10px] font-bold text-zinc-600 z-10">Q2</span>
                              </div>

                              {/* Q3: Dynamic Thermal State */}
                              <div className={\`relative h-7 rounded border flex items-center justify-center overflow-hidden transition-all duration-300 \${researchData.collapsePct > 20 ? 'bg-blue-950/40 border-blue-800/80 shadow-[inset_0_0_10px_rgba(30,58,138,0.3)]' : 'bg-zinc-900 border-zinc-800'}\`}>
                                {researchData.collapsePct > 20 && (
                                  <>
                                    <div className="absolute inset-0 bg-blue-600/10 animate-pulse"></div>
                                    <div className="absolute bottom-0 left-0 h-[2px] w-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.8)]"></div>
                                  </>
                                )}
                                <span className={\`text-[10px] font-extrabold z-10 tracking-widest \${researchData.collapsePct > 20 ? 'text-blue-300' : 'text-zinc-600'}\`}>Q3 {researchData.collapsePct > 20 ? '❄️' : ''}</span>
                              </div>

                              {/* Q4: Dynamic Thermal State */}
                              <div className={\`relative h-7 rounded border flex items-center justify-center overflow-hidden transition-all duration-300 \${researchData.collapsePct > 30 ? 'bg-blue-950/40 border-blue-800/80 shadow-[inset_0_0_10px_rgba(30,58,138,0.3)]' : 'bg-zinc-900 border-zinc-800'}\`}>
                                {researchData.collapsePct > 30 && (
                                  <>
                                    <div className="absolute inset-0 bg-blue-600/10 animate-pulse"></div>
                                    <div className="absolute bottom-0 left-0 h-[2px] w-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.8)]"></div>
                                  </>
                                )}
                                <span className={\`text-[10px] font-extrabold z-10 tracking-widest \${researchData.collapsePct > 30 ? 'text-blue-300' : 'text-zinc-600'}\`}>Q4 {researchData.collapsePct > 30 ? '❄️' : ''}</span>
                              </div>
                            </div>
                            
                            <div className="flex justify-between mt-1.5 px-1">
                              <span className="text-[7px] text-zinc-600 font-mono">EARLY GAME (1H)</span>
                              <span className="text-[7px] text-zinc-600 font-mono">LATE GAME (2H)</span>
                            </div>
                          </div>
                        </div>
`;
  
  code = code.substring(0, startIndex) + newBlock.trim() + "\n\n                        " + code.substring(endIndex);
  fs.writeFileSync(path, code);
  console.log('\n✅ POINT 2 SUCCESS: Thermal Momentum Timeline successfully injected via Terminal Command.\n');
} else {
  console.log('\n❌ Error: Could not locate the target block markers in the file.\n');
}
