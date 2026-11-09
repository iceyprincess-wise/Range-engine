import { Router, type Request, type Response } from "express";
import fs from "node:fs";
import path from "node:path";
import { markDirty, persist, store, resolveDataDir } from "../lib/warehouse";

const router = Router();
const INBOX_PATH = path.join(resolveDataDir(), "hybrid-inbox.json");

// The inbox is a STAGED copy of banked games, kept as a separate tracked
// file so it can travel by git push while the live store.json stays
// gitignored and keeps being rewritten by the running server. Games in
// the inbox are the raw stored game objects (homeTeam / awayTeam /
// tournament / startTimestamp / status all ride inside), so importing
// them is a plain add-if-missing into the live store — no provider call,
// no re-fetch, zero quota.
// Inbox v2 also carries the stats map + team list for its games: v1
// moved games only, so every restore silently lost the enrichment and
// the receiving server re-bought it from the provider (up to 6 calls
// per prematch). Old v1 files still read fine (maps default empty).
type InboxFile = { games: any[]; stats: Record<string, any>; teams: any[]; updatedAt: string | null; parseError?: boolean };

const readInbox = (): InboxFile => {
  let raw: string;
  try { raw = fs.readFileSync(INBOX_PATH, "utf8"); }
  catch { return { games: [], stats: {}, teams: [], updatedAt: null }; } // no inbox yet
  try {
    const parsed = JSON.parse(raw);
    if (parsed && Array.isArray(parsed.games)) {
      return {
        games: parsed.games,
        stats: parsed.stats && typeof parsed.stats === "object" ? parsed.stats : {},
        teams: Array.isArray(parsed.teams) ? parsed.teams : [],
        updatedAt: parsed.updatedAt ?? null,
      };
    }
    console.error("hybrid: inbox file has no games array — treating it as corrupt; export is disabled");
    return { games: [], stats: {}, teams: [], updatedAt: null, parseError: true };
  } catch (err) {
    console.error("hybrid: inbox file is CORRUPT — reads see an empty inbox; export is disabled until the file is fixed:", err);
    return { games: [], stats: {}, teams: [], updatedAt: null, parseError: true };
  }
};

// The finished-only invariant every other intake path enforces via
// rememberGames. Import/pull used to assign store.games directly with
// only a truthy-id check, banking unfinished/scoreless objects that
// then re-exported onward as if they were banked games.
const bankable = (g: any) =>
  !!g?.id && g?.status?.type === "finished" &&
  typeof g?.homeScore?.current === "number" && typeof g?.awayScore?.current === "number";

const mergeStatsTeams = (stats: any, teams: any) => {
  let statsAdded = 0, teamsAdded = 0;
  if (stats && typeof stats === "object") {
    for (const [gid, st] of Object.entries(stats)) {
      if (st && store.games[gid] && !store.stats[gid]) { store.stats[gid] = st; statsAdded++; }
    }
  }
  if (Array.isArray(teams)) {
    for (const tm of teams) {
      const key = typeof tm?.name === "string" ? tm.name.trim().toLowerCase() : "";
      if (key && tm?.id != null && !store.teams[key]) { store.teams[key] = { id: tm.id, name: tm.name }; teamsAdded++; }
    }
  }
  if (statsAdded || teamsAdded) markDirty();
  return { statsAdded, teamsAdded };
};

const writeInbox = (inbox: InboxFile) => {
  fs.mkdirSync(path.dirname(INBOX_PATH), { recursive: true });
  fs.writeFileSync(INBOX_PATH, JSON.stringify(inbox, null, 2));
};

const leagueOf = (g: any) =>
  (g.tournament && (g.tournament.uniqueTournament ? g.tournament.uniqueTournament.name : null)) ||
  (g.tournament && g.tournament.name) ||
  "Unknown";

const dt = (g: any) => (g.startTimestamp ? new Date(g.startTimestamp * 1000).toISOString().slice(0, 10) : "?");

const view = (g: any) => ({
  id: g.id, date: dt(g),
  home: g.homeTeam?.name ?? "?", away: g.awayTeam?.name ?? "?",
  hs: g.homeScore?.current ?? null, as: g.awayScore?.current ?? null,
  league: leagueOf(g),
});

// A game that fails bankable() can NEVER enter the warehouse, so
// calling it "new" makes the inbox promise a send that always skips
// it. Three honest states instead.
const statusOf = (g: any) => (store.games[g.id] ? "already-exist" : bankable(g) ? "new" : "invalid");

// GET /v1/hybrid/inbox — read FRESH on every request (never cached at
// boot), so a pushed or hand-dropped inbox file is visible without a
// restart. Status is DERIVED from the live store on every read, never
// stored in a file (a stored status would lie after restarts).
router.get("/v1/hybrid/inbox", (_req: Request, res: Response) => {
  const inbox = readInbox();
  const games = inbox.games.map((g) => ({ ...view(g), status: statusOf(g) }));
  const newCount = games.filter((g) => g.status === "new").length;
  const invalidCount = games.filter((g) => g.status === "invalid").length;
  return res.json({ updatedAt: inbox.updatedAt, parseError: inbox.parseError === true, total: games.length, newCount, invalidCount, alreadyExistCount: games.length - newCount - invalidCount, games });
});

// GET /v1/hybrid/games — the live store's full raw game objects, for the
// pull endpoint. /api/v1/warehouse only returns display summaries
// (id/date/home/away/scores), which cannot be banked; this returns the
// bankable objects. Zero provider quota.
router.get("/v1/hybrid/games", (_req: Request, res: Response) => {
  const games = Object.values(store.games) as any[];
  const stats: Record<string, any> = {};
  for (const g of games) if (store.stats[g.id]) stats[g.id] = store.stats[g.id];
  return res.json({ total: games.length, games, stats, teams: Object.values(store.teams) });
});

// POST /v1/hybrid/export — append live-store games not already in the
// inbox. Append-only: exporting twice adds 0 the second time.
router.post("/v1/hybrid/export", (_req: Request, res: Response) => {
  const inbox = readInbox();
  // A corrupt inbox reads as empty; overwriting it with this store's
  // games would permanently destroy the staged games it actually
  // holds. Refuse instead.
  if (inbox.parseError) {
    return res.status(500).json({ error: "inbox file is corrupt — export refused so staged games are not destroyed; fix or remove hybrid-inbox.json first" });
  }
  // Prune staged games that can never be sent (no final scores): they
  // sat in the inbox labelled "new" forever while every import skipped
  // them. Export is also the wrong place to CREATE that poison — store
  // games failing bankable() are counted and skipped, never staged.
  const stagedBefore = inbox.games.length;
  inbox.games = inbox.games.filter((g: any) => bankable(g));
  const pruned = stagedBefore - inbox.games.length;
  const have = new Set(inbox.games.map((g: any) => g.id));
  let added = 0, skippedInvalid = 0;
  for (const g of Object.values(store.games) as any[]) {
    if (g?.id == null || have.has(g.id)) continue;
    if (!bankable(g)) { skippedInvalid++; continue; }
    inbox.games.push(g); have.add(g.id); added++;
  }
  let statsAdded = 0;
  for (const g of inbox.games) {
    const st = store.stats[g.id];
    if (st && !inbox.stats[g.id]) { inbox.stats[g.id] = st; statsAdded++; }
  }
  const teamByName = new Map<string, any>();
  for (const g of inbox.games) {
    for (const side of [g?.homeTeam, g?.awayTeam]) {
      if (side?.name && side?.id != null) teamByName.set(side.name.trim().toLowerCase(), { id: side.id, name: side.name });
    }
  }
  for (const t of Object.values(store.teams) as any[]) {
    if (t?.name && t?.id != null) teamByName.set(t.name.trim().toLowerCase(), { id: t.id, name: t.name });
  }
  const teamsChanged = inbox.teams.length !== teamByName.size;
  inbox.teams = [...teamByName.values()];
  // updatedAt means "the inbox content changed" — the old code bumped
  // it on every export, even one that added nothing.
  if (added > 0 || statsAdded > 0 || teamsChanged || pruned > 0) inbox.updatedAt = new Date().toISOString();
  writeInbox(inbox);
  return res.json({ added, skippedInvalid, pruned, statsAdded, teams: inbox.teams.length, total: inbox.games.length });
});

// POST /v1/hybrid/import — body {ids?: number[]} (all "new" inbox games
// when omitted). Add-if-missing + markDirty, then persist so the games
// land in store.json. Idempotent: a second call adds 0.
router.post("/v1/hybrid/import", (req: Request, res: Response) => {
  const inbox = readInbox();
  // Same refusal as export: a corrupt inbox reads as empty, and
  // importing from it would report "added 0" as if the send had
  // worked while the staged games stay invisible.
  if (inbox.parseError) {
    return res.status(500).json({ error: "inbox file is corrupt — import refused; fix or remove hybrid-inbox.json first" });
  }
  const body = (req.body ?? {}) as { ids?: unknown };
  const wanted = Array.isArray(body.ids) && body.ids.length > 0
    ? new Set((body.ids as unknown[]).map((x) => Number(x)).filter((n) => Number.isFinite(n)))
    : null;
  let added = 0, alreadyExist = 0, skippedInvalid = 0;
  for (const g of inbox.games) {
    if (!g?.id) { skippedInvalid++; continue; }
    if (wanted && !wanted.has(Number(g.id))) continue;
    if (!bankable(g)) { skippedInvalid++; continue; }
    if (store.games[g.id]) { alreadyExist++; continue; }
    store.games[g.id] = g; markDirty(); added++;
  }
  const merged = mergeStatsTeams(inbox.stats, inbox.teams);
  if (added > 0 || merged.statsAdded > 0 || merged.teamsAdded > 0) persist();
  return res.json({ added, alreadyExist, skippedInvalid, ...merged, total: inbox.games.length });
});

// POST /v1/hybrid/pull — body {sourceUrl}. Fetches the source server's
// full banked games and merges the missing ones. Long timeout: a Render
// free-tier instance can take ~60s to wake from spin-down. Any failure
// returns a clear error object and banks nothing — never a partial state.
router.post("/v1/hybrid/pull", async (req: Request, res: Response) => {
  const body = (req.body ?? {}) as { sourceUrl?: unknown };
  const sourceUrl = typeof body.sourceUrl === "string" ? body.sourceUrl.trim().replace(/\/+$/, "") : "";
  if (!sourceUrl || !/^https?:\/\//i.test(sourceUrl)) {
    return res.status(400).json({ error: "sourceUrl is required and must start with http:// or https://" });
  }
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 90_000);
  try {
    const r = await fetch(sourceUrl + "/api/v1/hybrid/games", { signal: ctrl.signal });
    if (!r.ok) {
      return res.status(502).json({ error: "pull failed: source returned HTTP " + r.status + " — is the source server on the hybrid-sync build?" });
    }
    const data = (await r.json()) as { games?: unknown; stats?: unknown; teams?: unknown };
    const games = Array.isArray(data?.games) ? data.games as any[] : [];
    let added = 0, alreadyExist = 0, skippedInvalid = 0;
    for (const g of games) {
      if (!bankable(g)) { skippedInvalid++; continue; }
      if (store.games[g.id]) { alreadyExist++; continue; }
      store.games[g.id] = g; markDirty(); added++;
    }
    const merged = mergeStatsTeams(data?.stats, data?.teams);
    if (added > 0 || merged.statsAdded > 0 || merged.teamsAdded > 0) persist();
    return res.json({ added, alreadyExist, skippedInvalid, ...merged, sourceGames: games.length });
  } catch (err: any) {
    const msg = err?.name === "AbortError"
      ? "pull failed: source did not respond within 90s (it may be waking from spin-down — try again)"
      : ("pull failed: " + (err?.message ?? "unreachable source"));
    return res.status(502).json({ error: msg });
  } finally {
    clearTimeout(timer);
  }
});

export default router;
