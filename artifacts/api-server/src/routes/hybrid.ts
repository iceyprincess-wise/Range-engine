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
type InboxFile = { games: any[]; updatedAt: string | null };

const readInbox = (): InboxFile => {
  try {
    const parsed = JSON.parse(fs.readFileSync(INBOX_PATH, "utf8"));
    if (parsed && Array.isArray(parsed.games)) return { games: parsed.games, updatedAt: parsed.updatedAt ?? null };
    return { games: [], updatedAt: null };
  } catch { return { games: [], updatedAt: null }; }
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

const statusOf = (g: any) => (store.games[g.id] ? "already-exist" : "new");

// GET /v1/hybrid/inbox — read FRESH on every request (never cached at
// boot), so a pushed or hand-dropped inbox file is visible without a
// restart. Status is DERIVED from the live store on every read, never
// stored in a file (a stored status would lie after restarts).
router.get("/v1/hybrid/inbox", (_req: Request, res: Response) => {
  const inbox = readInbox();
  const games = inbox.games.map((g) => ({ ...view(g), status: statusOf(g) }));
  const newCount = games.filter((g) => g.status === "new").length;
  return res.json({ updatedAt: inbox.updatedAt, total: games.length, newCount, alreadyExistCount: games.length - newCount, games });
});

// GET /v1/hybrid/games — the live store's full raw game objects, for the
// pull endpoint. /api/v1/warehouse only returns display summaries
// (id/date/home/away/scores), which cannot be banked; this returns the
// bankable objects. Zero provider quota.
router.get("/v1/hybrid/games", (_req: Request, res: Response) => {
  const games = Object.values(store.games) as any[];
  return res.json({ total: games.length, games });
});

// POST /v1/hybrid/export — append live-store games not already in the
// inbox. Append-only: exporting twice adds 0 the second time.
router.post("/v1/hybrid/export", (_req: Request, res: Response) => {
  const inbox = readInbox();
  const have = new Set(inbox.games.map((g: any) => g.id));
  let added = 0;
  for (const g of Object.values(store.games) as any[]) {
    if (g?.id == null || have.has(g.id)) continue;
    inbox.games.push(g); have.add(g.id); added++;
  }
  inbox.updatedAt = new Date().toISOString();
  writeInbox(inbox);
  return res.json({ added, total: inbox.games.length });
});

// POST /v1/hybrid/import — body {ids?: number[]} (all "new" inbox games
// when omitted). Add-if-missing + markDirty, then persist so the games
// land in store.json. Idempotent: a second call adds 0.
router.post("/v1/hybrid/import", (req: Request, res: Response) => {
  const inbox = readInbox();
  const body = (req.body ?? {}) as { ids?: unknown };
  const wanted = Array.isArray(body.ids) && body.ids.length > 0
    ? new Set((body.ids as unknown[]).map((x) => Number(x)).filter((n) => Number.isFinite(n)))
    : null;
  let added = 0, alreadyExist = 0;
  for (const g of inbox.games) {
    if (!g?.id) continue;
    if (wanted && !wanted.has(Number(g.id))) continue;
    if (store.games[g.id]) { alreadyExist++; continue; }
    store.games[g.id] = g; markDirty(); added++;
  }
  if (added > 0) persist();
  return res.json({ added, alreadyExist, total: inbox.games.length });
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
    const data = (await r.json()) as { games?: unknown };
    const games = Array.isArray(data?.games) ? data.games as any[] : [];
    let added = 0, alreadyExist = 0;
    for (const g of games) {
      if (!g?.id) continue;
      if (store.games[g.id]) { alreadyExist++; continue; }
      store.games[g.id] = g; markDirty(); added++;
    }
    if (added > 0) persist();
    return res.json({ added, alreadyExist, sourceGames: games.length });
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
