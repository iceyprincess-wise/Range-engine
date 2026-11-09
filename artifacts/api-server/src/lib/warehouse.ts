import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

/**
 * Data directory resolution. The server is normally started from
 * artifacts/api-server (so process.cwd()/data is right), but nothing
 * guarantees that: started from the repo root, every store/quota/cache
 * path silently pointed at a fresh empty <repo-root>/data instead.
 * Resolve once, preferring an explicit DATA_DIR, then a data dir that
 * already exists (cwd first, then the install location), and fall back
 * to cwd/data for first run. The module-relative candidates cover both
 * layouts: src/lib (../../data) and the esbuild bundle in dist (../data).
 */
export const resolveDataDir = (): string => {
  const candidates = [
    process.env.DATA_DIR,
    path.join(process.cwd(), "data"),
    path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "..", "data"),
    path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "data"),
  ].filter((c): c is string => !!c);
  for (const c of candidates) {
    try { if (fs.statSync(c).isDirectory()) return c; } catch { /* try next */ }
  }
  return path.join(process.cwd(), "data");
};

const DATA_DIR = resolveDataDir();
const STORE_PATH = path.join(DATA_DIR, "store.json");

export type StoredTeam = { id: number; name: string };
export type Store = { teams: Record<string, StoredTeam>; games: Record<string, any>; stats: Record<string, any> };

const loadStore = (): Store => {
  let raw: string;
  try { raw = fs.readFileSync(STORE_PATH, "utf8"); }
  catch { return { teams: {}, games: {}, stats: {} }; } // first run: no file yet
  try {
    const parsed = JSON.parse(raw);
    // Shape backfill: a parseable file missing a map used to leave it
    // undefined, and rememberGames then threw inside request handlers.
    for (const k of ["teams", "games", "stats"] as const) {
      if (!parsed[k] || typeof parsed[k] !== "object") {
        console.error(`warehouse: store.json is missing the "${k}" map — starting that map empty`);
        parsed[k] = {};
      }
    }
    // Debris purge: every legitimate intake (rememberGames, hybrid
    // import/pull, the free bank) banks finished games WITH final
    // scores only. Anything else in the file is pre-validation debris
    // — no consumer can use it (all skip scoreless games), but it
    // inflates the counts and poisons hybrid exports, staging games
    // that can never be sent. Drop it, loudly.
    const gamesMap = parsed.games as Record<string, any>;
    let dropped = 0;
    for (const [gid, g] of Object.entries(gamesMap)) {
      const bankableStored = g?.status?.type === "finished"
        && typeof g?.homeScore?.current === "number"
        && typeof g?.awayScore?.current === "number";
      if (!bankableStored) { delete gamesMap[gid]; dropped++; }
    }
    if (dropped > 0) {
      storePurged = dropped;
      console.error(`warehouse: dropped ${dropped} stored game(s) that can never be banked (not finished / no final scores)`);
    }
    return parsed as Store;
  } catch (err) {
    // A corrupt store must never be silently replaced by an empty one:
    // the next persist() would overwrite the only copy. Preserve the
    // bytes for manual recovery and say so, loudly.
    const backup = STORE_PATH + ".corrupt-" + Date.now();
    try { fs.renameSync(STORE_PATH, backup); } catch { /* keep booting */ }
    console.error(`warehouse: store.json is CORRUPT (${err instanceof Error ? err.message : err}) — preserved as ${backup}; starting with an empty store`);
    return { teams: {}, games: {}, stats: {} };
  }
};
let storePurged = 0;
export const store: Store = loadStore();

let dirty = false;
export const markDirty = () => { dirty = true; };

export const persist = () => {
  if (!dirty) return;
  try {
    fs.mkdirSync(DATA_DIR, { recursive: true });
    // Atomic write: a kill mid-write used to truncate store.json in
    // place; the truncated file then booted as an "empty" store.
    const tmp = STORE_PATH + ".tmp";
    fs.writeFileSync(tmp, JSON.stringify(store));
    fs.renameSync(tmp, STORE_PATH);
    dirty = false;
  } catch (err) { console.error("warehouse persist failed:", err); }
};
setInterval(persist, 30_000).unref();
if (storePurged > 0) { markDirty(); persist(); }

const isFinished = (e: any) => e?.status?.type === "finished";
const hasScores = (e: any) =>
  typeof e?.homeScore?.current === "number" && typeof e?.awayScore?.current === "number";
export const rememberGames = (events: any[]) => {
  for (const e of events) {
    if (!e?.id || !isFinished(e) || !hasScores(e)) continue;
    const existing = store.games[e.id];
    if (!existing) { store.games[e.id] = e; markDirty(); continue; }
    // First-write-wins used to freeze a scoreless copy forever: every
    // scored consumer skips it, and the corrected provider payload was
    // discarded on every later fetch. A scored copy upgrades a
    // scoreless stored copy; anything else about the stored copy stays.
    if (!hasScores(existing)) { store.games[e.id] = e; markDirty(); }
  }
};

// ── Boot auto-restore ────────────────────────────────────────────────
// Render's free-tier disk is ephemeral: every redeploy starts with an
// empty data dir, so the warehouse booted at 0 games until someone
// opened the Hybrid page and tapped "Send all new to warehouse". The
// inbox file ships WITH the repo (it is the one tracked data file), so
// a server that boots with an EMPTY store restores itself from it —
// same finished+scored validation (rememberGames) as every other
// intake, plus the inbox's stats/teams merged add-if-missing. Games
// banked only on this server and never exported are NOT in the inbox
// and are still lost on a wipe; they can be re-banked (the free ESPN
// bank is re-runnable). Set RANGE_DISABLE_AUTORESTORE=1 to opt out.
const autoRestoreFromInbox = () => {
  if (process.env.RANGE_DISABLE_AUTORESTORE === "1") return;
  if (Object.keys(store.games).length > 0) return;
  let raw: string;
  try { raw = fs.readFileSync(path.join(DATA_DIR, "hybrid-inbox.json"), "utf8"); }
  catch { return; } // no inbox file: nothing to restore from
  let parsed: any;
  try { parsed = JSON.parse(raw); }
  catch (err) {
    // A corrupt inbox must never fail silently at boot: the warehouse
    // stays empty and, without this line, nothing anywhere says why.
    console.error("warehouse: auto-restore FAILED — hybrid-inbox.json is corrupt (unparseable); warehouse NOT restored. Fix or remove the file:", err);
    return;
  }
  if (!Array.isArray(parsed?.games)) {
    console.error("warehouse: auto-restore FAILED — hybrid-inbox.json has no games array; warehouse NOT restored. Fix or remove the file.");
    return;
  }
  const games: any[] = parsed.games;
  if (!games.length) return;
  rememberGames(games);
  let statsAdded = 0, teamsAdded = 0;
  if (parsed.stats && typeof parsed.stats === "object") {
    for (const [gid, st] of Object.entries(parsed.stats)) {
      if (st && store.games[gid] && !store.stats[gid]) { store.stats[gid] = st; statsAdded++; }
    }
  }
  if (Array.isArray(parsed.teams)) {
    for (const tm of parsed.teams) {
      const key = typeof tm?.name === "string" ? tm.name.trim().toLowerCase() : "";
      if (key && tm?.id != null && !store.teams[key]) { store.teams[key] = { id: tm.id, name: tm.name }; teamsAdded++; }
    }
  }
  const restored = Object.keys(store.games).length;
  if (restored > 0) {
    markDirty(); persist();
    console.log(`warehouse: auto-restored ${restored} games (+${statsAdded} stats, +${teamsAdded} teams) from hybrid-inbox.json after an empty boot`);
  }
};
autoRestoreFromInbox();
