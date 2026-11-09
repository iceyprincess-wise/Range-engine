import type { HistoryEntry, AnalysisArchiveEntry } from "@workspace/range-engine";
export const HISTORY_KEY = "rangengine_v3_history";
export const ARCHIVE_KEY = "splendor_analysis_archive";

export function loadHistory(): HistoryEntry[] {
  try {
    return JSON.parse(localStorage.getItem(HISTORY_KEY) ?? "[]");
  } catch {
    return [];
  }
}

export function loadAnalysisArchive(): AnalysisArchiveEntry[] {
  try {
    return JSON.parse(localStorage.getItem(ARCHIVE_KEY) ?? "[]");
  } catch {
    return [];
  }
}

export function saveHistory(h: HistoryEntry[]) {
  try {
    const trimmed = h.slice(0, 50);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(trimmed));

    const archiveReceipts = trimmed.map((entry) => ({
      id: entry.id,
      date: entry.date,
      timestamp: entry.timestamp,
      teams: `${entry.homeTeam} vs ${entry.awayTeam}`,
      league: entry.league,
      finalRange: `${entry.result.lb.toFixed(1)} - ${entry.result.hb.toFixed(1)}`,
      midpoint: entry.result.midpoint.toFixed(1),
      bookmaker: entry.bookmaker || "Sportybet",
      decision: entry.result.decision,
      outcome: entry.outcome || "PENDING",
      confidence: entry.result.confidence,
    }));

    localStorage.setItem(ARCHIVE_KEY, JSON.stringify(archiveReceipts));
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
  const parts = [
    encodeURIComponent(league.trim().toLowerCase()),
    encodeURIComponent(home.trim().toLowerCase()),
    encodeURIComponent(away.trim().toLowerCase()),
  ];
  if (gameId) parts.push(encodeURIComponent(String(gameId).trim().toLowerCase()));
  if (bookmaker) parts.push(encodeURIComponent(String(bookmaker).trim().toLowerCase()));
  if (fixtureDate) parts.push(encodeURIComponent(String(fixtureDate).trim()));
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
      const payload = {
        exportedAt: new Date().toISOString(),
        history: JSON.parse(localStorage.getItem(HISTORY_KEY) ?? "[]"),
        archive: JSON.parse(localStorage.getItem(ARCHIVE_KEY) ?? "[]"),
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
