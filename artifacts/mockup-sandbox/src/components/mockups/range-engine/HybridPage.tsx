import { useEffect, useState } from "react";

type InboxGame = {
  id: number; date: string; home: string; away: string;
  hs: number | null; as: number | null; league: string;
  status: "new" | "already-exist" | "invalid";
};
type InboxData = {
  updatedAt: string | null; total: number; newCount: number; invalidCount: number;
  alreadyExistCount: number; games: InboxGame[];
};

// 🔀 HYBRID SYNC — move banked games between Termux and Render through a
// staged inbox file. Written from scratch for this page (not copied from
// WarehousePage, which stays locked). Every move here spends ZERO provider
// quota: it only moves games already banked on one side or the other.
export function HybridPage({ apiBase, onClose }: { apiBase: string; onClose: () => void }) {
  const [inbox, setInbox] = useState<InboxData | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [pullUrl, setPullUrl] = useState("https://range-engine-v3.onrender.com");
  const [pullErr, setPullErr] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [ffLeague, setFfLeague] = useState("nba");
  const [ffDays, setFfDays] = useState(7);
  const [ffResult, setFfResult] = useState<string | null>(null);

  const serverLabel = apiBase ? apiBase : "local api-server (same origin)";

  const loadInbox = async () => {
    setErr(null);
    try {
      const r = await fetch(`${apiBase}/api/v1/hybrid/inbox`);
      if (!r.ok) throw new Error("inbox request failed: HTTP " + r.status);
      setInbox(await r.json());
    } catch (e: any) {
      setErr(e?.message ?? "could not load inbox");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadInbox(); }, []);

  const doExport = async () => {
    setBusy("export"); setNotice(null); setErr(null);
    try {
      const r = await fetch(`${apiBase}/api/v1/hybrid/export`, { method: "POST" });
      const d = await r.json();
      if (!r.ok) throw new Error(d?.error ?? "export failed");
      setNotice(`Exported ${d.added} new game${d.added === 1 ? "" : "s"} to the inbox (total ${d.total}).${d.pruned ? ` Pruned ${d.pruned} unbankable game${d.pruned === 1 ? "" : "s"} (no final scores) from the inbox.` : ""}${d.skippedInvalid ? ` Skipped ${d.skippedInvalid} store game${d.skippedInvalid === 1 ? "" : "s"} with no final scores — they cannot be banked.` : ""} Commit + push the inbox file and Render auto-deploys it — then open this page on Render and Send to warehouse.`);
      await loadInbox();
    } catch (e: any) { setErr(e?.message ?? "export failed"); }
    finally { setBusy(null); }
  };

  const doImport = async (ids?: number[]) => {
    setBusy(ids ? "import-one" : "import"); setNotice(null); setErr(null);
    try {
      const r = await fetch(`${apiBase}/api/v1/hybrid/import`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(ids ? { ids } : {}),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d?.error ?? "import failed");
      setNotice(`Sent ${d.added} game${d.added === 1 ? "" : "s"} to this warehouse (${d.alreadyExist} already there).${d.skippedInvalid ? ` ${d.skippedInvalid} skipped — no final scores recorded, cannot be banked.` : ""}`);
      await loadInbox();
    } catch (e: any) { setErr(e?.message ?? "import failed"); }
    finally { setBusy(null); }
  };

  const doFreeBank = async () => {
    setBusy("freebank"); setNotice(null); setErr(null); setFfResult(null);
    try {
      const dates: string[] = [];
      const now = Date.now();
      for (let i = 1; i <= ffDays; i++) {
        dates.push(new Date(now - i * 86400000).toISOString().slice(0, 10).replace(/-/g, ""));
      }
      const r = await fetch(`${apiBase}/api/v1/freefeed/bank?league=${ffLeague}&dates=${dates.join(",")}`);
      const d = await r.json();
      if (!r.ok) throw new Error(d?.error ?? "free bank failed");
      setFfResult(
        `Banked ${d.banked} new game${d.banked === 1 ? "" : "s"} · ${d.alreadyBanked} already banked · ` +
        `${d.statsFilled} box-score stat set${d.statsFilled === 1 ? "" : "s"} filled` +
        (d.statsRemaining > 0 ? ` · ${d.statsRemaining} stat set(s) still pending — tap again to continue` : "") +
        (d.unresolvedTeams?.length ? ` · skipped unresolved team(s): ${d.unresolvedTeams.join(", ")}` : "") +
        `. Zero provider quota spent.`,
      );
    } catch (e: any) {
      setErr(e?.message ?? "free bank failed");
    } finally {
      setBusy(null);
    }
  };

  const doPull = async () => {
    setBusy("pull"); setNotice(null); setPullErr(null);
    try {
      const r = await fetch(`${apiBase}/api/v1/hybrid/pull`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sourceUrl: pullUrl.trim() }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d?.error ?? "pull failed");
      setNotice(`Pulled ${d.added} new game${d.added === 1 ? "" : "s"} from the source (${d.alreadyExist} already here, ${d.sourceGames} on the source).${d.skippedInvalid ? ` ${d.skippedInvalid} skipped — no final scores recorded, cannot be banked.` : ""}`);
      await loadInbox();
    } catch (e: any) { setPullErr(e?.message ?? "pull failed"); }
    finally { setBusy(null); }
  };

  const doCopy = async () => {
    try {
      await navigator.clipboard.writeText(JSON.stringify(inbox ?? { games: [], updatedAt: null }, null, 2));
      setCopied(true); setTimeout(() => setCopied(false), 2000);
    } catch {
      setNotice("Copy failed in this browser — the inbox JSON is shown below; long-press it to copy.");
    }
  };

  const doDownload = () => {
    const blob = new Blob([JSON.stringify(inbox ?? { games: [], updatedAt: null }, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "hybrid-inbox.json"; a.click();
    URL.revokeObjectURL(url);
  };

  const btn = "text-yellow-300 text-[10px] font-black px-2 py-1.5 rounded border border-yellow-700 bg-yellow-950/40 uppercase disabled:opacity-40";

  return (
    <div className="fixed inset-0 bg-black flex flex-col p-4 overflow-y-auto" style={{ zIndex: 9999 }}>
      <div className="flex items-center justify-between mb-1">
        <p className="text-yellow-400 font-black text-sm uppercase tracking-widest">🔀 Hybrid Sync</p>
        <button onClick={onClose} className="text-zinc-400 text-xl px-2">✕</button>
      </div>
      <p className="text-[10px] text-zinc-500 mb-1">Talking to: <span className="text-yellow-300 font-mono">{serverLabel}</span></p>
      <p className="text-[10px] text-zinc-500 mb-3">
        Move banked games between Termux and Render through a staged inbox. These moves spend{" "}
        <span className="text-yellow-300">zero provider quota</span> — they only move games already banked.
        Export writes this server&apos;s games into the inbox file; commit + push it and Render auto-deploys it.
        Pull fetches the other server&apos;s banked games straight into this warehouse.
      </p>
      {notice && <p className="text-[11px] text-green-400 mb-2">{notice}</p>}
      {err && <p className="text-[11px] text-red-400 mb-2">{err}</p>}

      <div className="flex flex-wrap gap-2 mb-3">
        <button onClick={doExport} disabled={busy !== null} className={btn}>⬆ Export current store to inbox</button>
        <button onClick={() => doImport()} disabled={busy !== null || (inbox?.newCount ?? 0) === 0} className={btn}>Send all new to warehouse</button>
        <button onClick={doCopy} disabled={busy !== null} className={btn}>{copied ? "✓ Copied" : "📋 Copy inbox JSON"}</button>
        <button onClick={doDownload} disabled={busy !== null} className={btn}>⬇ Download inbox file</button>
      </div>

      <div className="bg-zinc-900 border border-yellow-950 rounded-lg px-3 py-2 mb-3">
        <p className="text-[10px] font-bold uppercase tracking-widest text-yellow-500 mb-1">Pull from the other server</p>
        <div className="flex gap-2">
          <input
            value={pullUrl}
            onChange={(e) => setPullUrl(e.target.value)}
            className="flex-1 min-w-0 bg-black border border-yellow-900 rounded px-2 py-1.5 text-[11px] text-yellow-200 font-mono"
            placeholder="https://range-engine-v3.onrender.com"
          />
          <button onClick={doPull} disabled={busy !== null || pullUrl.trim() === ""} className={btn}>⬇ Pull from Render</button>
        </div>
        {pullErr && <p className="text-[11px] text-red-400 mt-1">{pullErr}</p>}
        <p className="text-[9px] text-zinc-600 mt-1">The source can be slow to wake on the free tier (up to ~90s) — the pull waits. Nothing is banked if it fails.</p>
      </div>

      <div className="bg-zinc-900 border border-yellow-950 rounded-lg px-3 py-2 mb-3">
        <p className="text-[10px] font-bold uppercase tracking-widest text-yellow-500 mb-1">Free bank — ESPN (no quota)</p>
        <div className="flex gap-2 items-center">
          <select value={ffLeague} onChange={(e) => setFfLeague(e.target.value)} className="bg-black border border-yellow-900 rounded px-2 py-1.5 text-[11px] text-yellow-200">
            <option value="nba">NBA</option>
            <option value="wnba">WNBA</option>
          </select>
          <label className="text-[10px] text-zinc-400">last
            <input type="number" min={1} max={14} value={ffDays} onChange={(e) => setFfDays(Math.max(1, Math.min(14, Number(e.target.value) || 1)))} className="w-12 mx-1 bg-black border border-yellow-900 rounded px-1 py-1 text-[11px] text-yellow-200" />
            days</label>
          <button onClick={doFreeBank} disabled={busy !== null} className={btn}>🏦 Bank free games</button>
        </div>
        {ffResult && <p className="text-[11px] text-green-400 mt-1">{ffResult}</p>}
        <p className="text-[9px] text-zinc-600 mt-1">Finished games + box-score stats from ESPN's public feed, banked straight into this warehouse. Teams are matched to warehouse ids by exact name — a game is skipped (and reported) if either team cannot be matched. The paid provider budget stays untouched for the leagues only it covers.</p>
      </div>

      {loading ? (
        <p className="text-zinc-500 text-xs mt-4">Reading inbox…</p>
      ) : !inbox ? (
        <p className="text-red-400 text-xs mt-4">Inbox could not be loaded.</p>
      ) : (
        <>
          <p className="text-[10px] text-yellow-600 mb-2 font-mono">
            Inbox {inbox.total} game{inbox.total === 1 ? "" : "s"} · {inbox.newCount} new · {inbox.alreadyExistCount} already in this warehouse{inbox.invalidCount ? ` · ${inbox.invalidCount} invalid (no final scores)` : ""}
            {inbox.updatedAt ? ` · updated ${new Date(inbox.updatedAt).toLocaleString()}` : ""}
          </p>
          {inbox.total === 0 && (
            <p className="text-zinc-500 text-xs mt-2">Inbox is empty — export this store to fill it, or pull from the other server.</p>
          )}
          {inbox.total > 0 && inbox.newCount === 0 && inbox.invalidCount === 0 && (
            <p className="text-zinc-500 text-xs mt-2">Every inbox game is already in this warehouse — nothing left to send.</p>
          )}
          {inbox.invalidCount > 0 && (
            <p className="text-red-400/80 text-xs mt-2">{inbox.invalidCount} inbox game{inbox.invalidCount === 1 ? "" : "s"} can never be sent — no final scores were recorded for {inbox.invalidCount === 1 ? "it" : "them"}. Exporting from the source prunes {inbox.invalidCount === 1 ? "it" : "them"}.</p>
          )}
          <div className="space-y-1.5">
            {inbox.games.map((g) => (
              <div key={g.id} className="bg-zinc-900 border border-yellow-950 rounded-lg px-3 py-2 flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-xs text-zinc-200 font-bold truncate">{g.home} vs {g.away} <span className="text-yellow-500">· {g.hs ?? "?"}–{g.as ?? "?"}</span></p>
                  <p className="text-[10px] text-zinc-500">{g.date} · {g.league} · #{g.id}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className={g.status === "new" ? "text-[10px] font-black uppercase text-green-400" : g.status === "invalid" ? "text-[10px] font-black uppercase text-red-400" : "text-[10px] font-black uppercase text-zinc-500"}>
                    {g.status === "new" ? "new" : g.status === "invalid" ? "no scores — can't send" : "already exist"}
                  </span>
                  {g.status === "new" && (
                    <button onClick={() => doImport([g.id])} disabled={busy !== null} className={btn}>Send</button>
                  )}
                </div>
              </div>
            ))}
          </div>
          <details className="mt-4">
            <summary className="text-[10px] text-zinc-500 cursor-pointer uppercase tracking-widest">Inbox JSON (manual copy fallback)</summary>
            <pre className="text-[9px] text-zinc-500 whitespace-pre-wrap break-all mt-1">{JSON.stringify(inbox, null, 2)}</pre>
          </details>
        </>
      )}
    </div>
  );
}
