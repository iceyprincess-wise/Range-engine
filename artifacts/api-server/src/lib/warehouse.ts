import fs from "node:fs";
import path from "node:path";

const DATA_DIR = path.join(process.cwd(), "data");
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
