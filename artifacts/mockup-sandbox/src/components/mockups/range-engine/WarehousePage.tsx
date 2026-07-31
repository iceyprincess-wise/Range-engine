/* ═══════════════════════════════════════════════════════════════════════════
   🏢 MY WAREHOUSE — LOCKED COMPONENT (warehouse-v1)
   CONTRACT: This page is feature-complete and frozen. It must NEVER be edited
   by bulk find-replace passes, theme sweeps, or refactors targeting other
   pages. Changes require an explicit "warehouse page" task. Restore point:
   git tag `warehouse-v1`.
   Doctrine: everything stored is shown, nothing truncated, nothing invented.
   ═══════════════════════════════════════════════════════════════════════════ */
import { loadHistory } from "./engine/storage";

export function WarehousePage({ wh, whAt, onClose }: { wh: any; whAt: number; onClose: () => void }) {
  const hist = (() => { try { return loadHistory(); } catch { return []; } })();
  const pending = hist.filter((h: any) => h.outcome === "PENDING").length;
  return (
    <div className="fixed inset-0 bg-black flex flex-col p-4 overflow-y-auto" style={{ zIndex: 9999 }}>
      <div className="flex items-center justify-between mb-1">
        <p className="text-yellow-400 font-black text-sm uppercase tracking-widest">🏢 My Warehouse</p>
        <button onClick={onClose} className="text-zinc-400 text-xl px-2">✕</button>
      </div>
      {!wh ? (
        <p className="text-zinc-500 text-xs mt-4">Reading store from disk…</p>
      ) : (
        <>
          <p className="text-[10px] text-yellow-600 mb-3 font-mono">
            Updated {Math.max(0, Math.round((Date.now() - whAt) / 1000))}s ago · last store write {wh.storeWrittenAgoSec != null ? `${wh.storeWrittenAgoSec}s ago` : "n/a"} · {wh.storeSizeBytes ? `${(wh.storeSizeBytes / 1024).toFixed(0)} KB on disk` : ""} · {wh.provenance}
          </p>
          <div className="grid grid-cols-3 gap-2 mb-2">
            {([["Games banked", wh.totals.games], ["Teams profiled", wh.totals.teams], ["Leagues", wh.totals.leagues], ["Stat-enriched", wh.totals.statsEnriched], ["Quarter-level", wh.totals.quarterLevel], ["Analyses (Archive)", `${hist.length} · ${pending} pending`]] as const).map(([l, v]) => (
              <div key={String(l)} className="bg-zinc-900 border border-yellow-950 rounded-lg p-2 text-center">
                <p className="text-sm font-black text-yellow-300">{v}</p>
                <p className="text-[8px] uppercase tracking-widest text-zinc-500">{l}</p>
              </div>
            ))}
          </div>
          <p className="text-[9px] text-zinc-600 mb-4">
            Span {wh.span.oldest} → {wh.span.newest}. Warehouse banks FINISHED games only — immutable forever. Upcoming fixtures live in the games browser until full time, then flow in automatically; your analyses live in the Archive and settle against this store.
          </p>

          <p className="text-[9px] font-bold uppercase tracking-widest text-yellow-500 mb-1.5">League DNA ({wh.leagues.length}) — every banked game shown</p>
          <div className="space-y-1.5 mb-4">
            {wh.leagues.map((lg: any) => (
              <details key={lg.league} className="bg-zinc-900 border border-yellow-950 rounded-lg px-3 py-2">
                <summary className="text-xs text-zinc-200 font-bold cursor-pointer">
                  {lg.league} <span className="text-yellow-500">· {lg.games}g</span>
                  {lg.dna && <span className="text-[10px] text-zinc-500"> · avg {lg.dna.avgTotal} ± {lg.dna.sd} ({lg.dna.minTotal}–{lg.dna.maxTotal}){lg.dna.measuredActive ? " · FEEDS ENGINE" : " · needs 15g to feed engine"}</span>}
                </summary>
                <div className="mt-2 space-y-1">
                  {lg.allGames.map((g: any) => (
                    <p key={g.id} className="text-[10px] text-zinc-400 font-mono">
                      {g.date} · {g.home} <span className="text-yellow-300">{g.hs}</span>–<span className="text-red-400">{g.as}</span> {g.away}{g.q ? " · Q✓" : ""}{g.st ? " · STATS✓" : ""}
                    </p>
                  ))}
                </div>
              </details>
            ))}
          </div>

          <p className="text-[9px] font-bold uppercase tracking-widest text-yellow-500 mb-1.5">Team DNA ({wh.teams.length}) — full profile, every stored game</p>
          <div className="space-y-1.5 mb-4">
            {wh.teams.map((t: any) => (
              <details key={t.id} className="bg-zinc-900 border border-yellow-950 rounded-lg px-3 py-2">
                <summary className="text-xs text-zinc-200 font-bold cursor-pointer">
                  {t.name} <span className="text-yellow-500">· {t.gamesInStore}g</span>
                  {t.dna.formLast5 && <span className="text-[10px] text-zinc-500"> · form {t.dna.formLast5}</span>}
                </summary>
                <div className="mt-2 text-[10px] text-zinc-400 space-y-0.5">
                  <p>Scored <span className="text-yellow-300">{t.dna.scoredAvg ?? "—"}</span> · Allowed <span className="text-red-400">{t.dna.allowedAvg ?? "—"}</span> · Home {t.dna.homeScoredAvg ?? "—"} · Road {t.dna.roadScoredAvg ?? "—"}</p>
                  <p>2nd-half fade {t.dna.secondHalfFade != null ? `${t.dna.secondHalfFade > 0 ? "-" : "+"}${Math.abs(t.dna.secondHalfFade)} pts` : "—"} over {t.dna.quarterGames}g (quarter-level)</p>
                  <p>{t.dna.shooting ? `Shooting (${t.dna.shooting.statGames}g): FT ${t.dna.shooting.ftPct ?? "—"}% · 3PT ${t.dna.shooting.pt3Pct ?? "—"}% · FG ${t.dna.shooting.fgPct ?? "—"}% · Fouls ${t.dna.shooting.foulsPerGame ?? "—"}/g` : "Shooting: no stat-enriched games yet — nothing invented"}</p>
                  <div className="mt-1.5 space-y-1 border-t border-yellow-950 pt-1.5">
                    {t.allGames.map((g: any) => (
                      <p key={g.id} className="font-mono">
                        {g.date} · {g.home} <span className="text-yellow-300">{g.hs}</span>–<span className="text-red-400">{g.as}</span> {g.away}{g.q ? " · Q✓" : ""}{g.st ? " · STATS✓" : ""}
                      </p>
                    ))}
                  </div>
                </div>
              </details>
            ))}
          </div>
          <p className="text-[9px] text-zinc-600 mb-6">Quota snapshot: {wh.quota?.remaining ?? "—"}/{wh.quota?.limit ?? "—"} — this page spent none of it.</p>
        </>
      )}
    </div>
  );
}
