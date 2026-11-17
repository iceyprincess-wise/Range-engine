import type { HistoryEntry, AnalysisArchiveEntry } from "@workspace/range-engine";
import type { GameTournament } from "./tournamentLabels";
export const HISTORY_KEY = "rangengine_v3_history";
export const ARCHIVE_KEY = "splendor_analysis_archive";

export function loadHistory(): HistoryEntry[] {
  try {
    // D-2026-11-17-32: a non-array valid JSON value used to be returned
    // as-is and crashed consumers (.filter outside any try).
    const v = JSON.parse(localStorage.getItem(HISTORY_KEY) ?? "[]");
    return Array.isArray(v) ? v : [];
  } catch {
    return [];
  }
}

export function loadAnalysisArchive(): AnalysisArchiveEntry[] {
  try {
    // D-2026-11-17-32: same non-array guard as loadHistory.
    const v = JSON.parse(localStorage.getItem(ARCHIVE_KEY) ?? "[]");
    return Array.isArray(v) ? v : [];
  } catch {
    return [];
  }
}

export function saveHistory(h: HistoryEntry[]) {
  try {
    // D-2026-11-17-31: build the receipts FIRST and defensively — a
    // legacy entry without `result` used to throw here AFTER the
    // history write but BEFORE the archive write, freezing every future
    // archive update. A result-less entry is skipped, never fatal.
    // D-2026-11-17-30 (continued): receipts are built from the FULL list
    // passed in, not the trimmed 50 — an entry dropped by the trim in
    // the same save must still reach the archive.
    const receipts: AnalysisArchiveEntry[] = [];
    for (const entry of h) {
      const r: any = (entry as any)?.result;
      if (!r || typeof r.lb !== "number" || typeof r.hb !== "number" || typeof r.midpoint !== "number") continue;
      receipts.push({
        id: entry.id,
        date: entry.date,
        timestamp: entry.timestamp,
        teams: `${entry.homeTeam} vs ${entry.awayTeam}`,
        league: entry.league,
        finalRange: `${r.lb.toFixed(1)} - ${r.hb.toFixed(1)}`,
        midpoint: r.midpoint.toFixed(1),
        bookmaker: entry.bookmaker || "Sportybet",
        decision: r.decision,
        outcome: entry.outcome || "PENDING",
        confidence: r.confidence,
      });
    }
    const trimmed = h.slice(0, 50);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(trimmed));

    // D-2026-11-17-30: the "archive" used to be overwritten from the
    // trimmed history on every save, so the oldest receipt vanished
    // with the 51st entry and win-rate history was silently rewritten.
    // Merge cumulatively by id instead — never truncate from the trim.
    const merged = new Map<string, AnalysisArchiveEntry>();
    for (const old of loadAnalysisArchive()) merged.set(old.id, old);
    for (const receipt of receipts) merged.set(receipt.id, receipt);
    localStorage.setItem(ARCHIVE_KEY, JSON.stringify([...merged.values()]));
  } catch (e) {
    console.warn("Failed to save analysis archive", e);
  }
}

// ─── Research Cache Helpers ─────────────────────────────────────────────────
export const RESEARCH_CACHE_PREFIX = "rangengine_v3_research_v1:";
export const RESEARCH_CACHE_TTL = 1000 * 60 * 60 * 6; // 6 hours

export function makeResearchCacheKey(
  league: string,
  home: string,
  away: string,
  gameId = "",
  bookmaker = "",
  fixtureDate = "",
) {
  // D-2026-11-17-35: unlabeled, conditionally-included parts collided —
  // (gameId "x") and (bookmaker "x") produced the same key. Every part
  // is always present and labelled, so distinct triples can never share
  // a key. (Keys change shape once; old entries are simply missed and
  // refetched.)
  const parts = [
    `l:${encodeURIComponent(league.trim().toLowerCase())}`,
    `h:${encodeURIComponent(home.trim().toLowerCase())}`,
    `a:${encodeURIComponent(away.trim().toLowerCase())}`,
    `g:${encodeURIComponent(String(gameId).trim().toLowerCase())}`,
    `b:${encodeURIComponent(String(bookmaker).trim().toLowerCase())}`,
    `d:${encodeURIComponent(String(fixtureDate).trim())}`,
  ];
  return RESEARCH_CACHE_PREFIX + parts.join(":");
}

export function saveResearchCache(key: string, payload: any) {
  try {
    const entry = { ts: Date.now(), payload };
    localStorage.setItem(key, JSON.stringify(entry));
  } catch (e) {
    console.warn("Failed to save research cache", e);
  }
}

export function loadResearchCache(key: string): { ts: number; payload: any } | null {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (e) {
    return null;
  }
}

export function isResearchCacheValid(entry: { ts: number; payload: any } | null) {
  if (!entry) return false;
  return Date.now() - entry.ts < RESEARCH_CACHE_TTL;
}

// ─── Tournaments Bank ─────────────────────────────────────────────────
// The tournaments list used to live ONLY in RangeEngine state:
// re-entering the page after a Render disk wipe got an empty
// free payload (count 0 / updatedAt null) and the list vanished
// until someone paid for an UPDATE (D-2026-11-11-06). The
// banked copy for today survives reloads and server wipes, so
// re-entry shows the last fresh list with 0 API calls.
export const TOURNAMENTS_KEY_PREFIX = "rangengine_v3_tournaments_v1:";
export interface BankedTournaments {
  date: string;
  updatedAt: string | null;
  count: number;
  tournaments: GameTournament[];
}
export function saveTournamentsBank(payload: any, day: string) {
  try {
    if (!payload || !Array.isArray(payload.tournaments)) return;
    // Never let a wiped-server empty payload (count 0,
    // updatedAt null, stale) overwrite a good banked list for
    // today, and never bank another day's stale list under
    // today's key.
    if (payload.stale === true) return;
    if (payload.updatedAt == null && payload.tournaments.length === 0) return;
    // Never bank a PARTIAL tournament list as the fallback for
    // later entry (D-2026-11-15-03): the server reports partial
    // updates with updatedAt set and stale false, and deliberately
    // does NOT cache them to disk — but this bank accepted them,
    // so a later entry would show an incomplete list as if
    // complete. A partial list is fine on screen for this session;
    // it just must not overwrite the last complete banked list.
    if (payload.partial === true) return;
    const banked: BankedTournaments = {
      date: day,
      updatedAt: payload.updatedAt ?? null,
      count: payload.tournaments.length,
      tournaments: payload.tournaments,
    };
    localStorage.setItem(TOURNAMENTS_KEY_PREFIX + day, JSON.stringify(banked));
  } catch { /* best-effort */ }
}
export function loadTournamentsBank(day: string): BankedTournaments | null {
  try {
    const raw = localStorage.getItem(TOURNAMENTS_KEY_PREFIX + day);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || !Array.isArray(parsed.tournaments)) return null;
    return parsed as BankedTournaments;
  } catch { return null; }
}

// ─── Forensic export (manual, hash-gated) ───

// TEMP forensic export — only activates when the URL ends with #export-archive
if (typeof window !== "undefined" && window.location.hash === "#export-archive") {
  const addBtn = () => {
    const btn = document.createElement("button");
    btn.textContent = "⬇ Export Analysis Archive JSON";
    btn.style.cssText =
      "position:fixed;bottom:24px;left:50%;transform:translateX(-50%);z-index:99999;" +
      "padding:14px 22px;background:#eab308;color:#000;font-weight:700;border-radius:12px;border:0;";
    btn.onclick = () => {
      // D-2026-11-17-37: a corrupt stored value used to throw out of
      // the click handler — export [] for that section instead.
      const safeParse = (key: string): any[] => {
        try {
          const v = JSON.parse(localStorage.getItem(key) ?? "[]");
          return Array.isArray(v) ? v : [];
        } catch { return []; }
      };
      const payload = {
        exportedAt: new Date().toISOString(),
        history: safeParse(HISTORY_KEY),
        archive: safeParse(ARCHIVE_KEY),
      };
      const a = document.createElement("a");
      a.href = URL.createObjectURL(new Blob([JSON.stringify(payload)], { type: "application/json" }));
      a.download = "analysis-archive-export.json";
      a.click();
      btn.textContent = "✓ Exported to Downloads";
    };
    document.body.appendChild(btn);
  };
  if (document.readyState === "complete") addBtn();
  else window.addEventListener("load", addBtn);
}

// ─── Settle-attempt memory (D-2026-11-11-13) ─────────────────────────
// The Archive auto-settle used to re-probe every due-but-unbanked
// receipt on EVERY page load + Archive open: the in-memory attempted
// set resets on reload, and the server kept no per-fixture failure
// memory, so one unbanked receipt cost up to 2 provider calls per
// load, forever. Persist the last attempt per receipt id: a failed
// attempt is not retried for 24h. A game banked by another path in
// the meantime still settles on the next attempt after the window.
export const SETTLE_ATTEMPTS_KEY = "rangengine_v3_settle_attempts_v1";
export const SETTLE_RETRY_MS = 24 * 3600 * 1000;
export function loadSettleAttempts(): Record<string, number> {
  try {
    const parsed = JSON.parse(localStorage.getItem(SETTLE_ATTEMPTS_KEY) ?? "{}");
    if (!parsed || typeof parsed !== "object") return {};
    return parsed as Record<string, number>;
  } catch { return {}; }
}
export function isSettleAttemptDue(id: string, nowMs: number = Date.now()): boolean {
  try {
    const last = loadSettleAttempts()[id];
    return typeof last !== "number" || nowMs - last >= SETTLE_RETRY_MS;
  } catch { return true; }
}
export function recordSettleAttempt(id: string, nowMs: number = Date.now()): void {
  try {
    const attempts = loadSettleAttempts();
    // Prune stale entries so the map cannot grow past the history cap.
    for (const [k, v] of Object.entries(attempts)) if (typeof v !== "number" || nowMs - v >= SETTLE_RETRY_MS) delete attempts[k];
    attempts[id] = nowMs;
    localStorage.setItem(SETTLE_ATTEMPTS_KEY, JSON.stringify(attempts));
  } catch { /* best-effort: the in-memory attempted set still bounds this load */ }
}
