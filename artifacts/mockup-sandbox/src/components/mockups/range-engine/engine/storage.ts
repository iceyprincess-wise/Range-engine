import type { HistoryEntry, AnalysisArchiveEntry } from "./types";
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
) {
  const parts = [
    encodeURIComponent(league.trim().toLowerCase()),
    encodeURIComponent(home.trim().toLowerCase()),
    encodeURIComponent(away.trim().toLowerCase()),
  ];
  if (gameId) parts.push(encodeURIComponent(String(gameId).trim().toLowerCase()));
  if (bookmaker) parts.push(encodeURIComponent(String(bookmaker).trim().toLowerCase()));
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

// ─── Auto-Research Engine (deterministic seed — consistent per team+league) ──
