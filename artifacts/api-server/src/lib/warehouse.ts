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
  try { return JSON.parse(fs.readFileSync(STORE_PATH, "utf8")); }
  catch { return { teams: {}, games: {}, stats: {} }; }
};
export const store: Store = loadStore();
if (!store.stats) store.stats = {};

let dirty = false;
export const markDirty = () => { dirty = true; };
export const persist = () => {
  if (!dirty) return;
  try {
    fs.mkdirSync(DATA_DIR, { recursive: true });
    fs.writeFileSync(STORE_PATH, JSON.stringify(store));
    dirty = false;
  } catch (err) { console.error("warehouse persist failed:", err); }
};
setInterval(persist, 30_000).unref();

const isFinished = (e: any) => e?.status?.type === "finished";
export const rememberGames = (events: any[]) => {
  for (const e of events) {
    if (!e?.id || !isFinished(e)) continue;
    if (!store.games[e.id]) { store.games[e.id] = e; markDirty(); }
  }
};
