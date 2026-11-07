import { markDirty, registerPgPersist, store } from "./warehouse";

/**
 * Hybrid warehouse: Postgres + store.json working together.
 *
 * Mode is picked by environment, once, at startup:
 * - DATABASE_URL unset  -> FILE mode. Behaviour is byte-identical to
 *   before this patch: the in-memory store loads from store.json and
 *   persist() writes store.json only.
 * - DATABASE_URL set    -> POSTGRES mode. On startup (awaited in
 *   index.ts before app.listen) the server connects to Postgres; if
 *   the tables are empty it seeds them from the in-memory store
 *   (same union logic as lib/db/seed-from-store.mjs: searched teams
 *   UNION the team ids+names carried inside the stored games, teams
 *   upserted before games so the games -> teams FKs hold); then it
 *   loads teams/games/stats from Postgres into the in-memory store,
 *   which stays the single runtime source of truth — every route keeps
 *   reading `store` unchanged. persist() then DUAL-WRITES: store.json
 *   (local mirror, still written synchronously as before) AND
 *   Postgres (async fire-and-forget, see syncToPostgres).
 * - DATABASE_URL set but Postgres unreachable (or the tables missing
 *   because the one-time migrations were never run) -> the server logs
 *   a clear warning and falls back to FILE mode for that run. The
 *   server still starts and serves from store.json; nothing crashes.
 *
 * What stays file-only, by design: quota.json (ephemeral rate-limit
 * state), games-cache.json (tournament schedule cache) and
 * analysis-archive-export.json (a mockup download, not server data).
 * analysis_history has no server writer today and this patch adds
 * none — it is only backfilled by the mockup export / seed tooling.
 *
 * Why a DYNAMIC import of @workspace/db: lib/db/src/index.ts throws
 * at module-evaluation time when DATABASE_URL is missing, so a static
 * top-level import would crash the server in file mode. The dynamic
 * import below only runs when DATABASE_URL is set, and esbuild keeps
 * dynamically imported modules lazy in the bundle, so file mode never
 * evaluates it at all.
 */

// Minimal structural type for the pg Pool behind @workspace/db. The
// adapter only needs query() and connect(), so it does not depend on
// the pg type definitions directly.
type PgClient = {
  query: (text: string, params?: unknown[]) => Promise<{ rows: any[] }>;
  release: () => void;
};
type PgPool = {
  query: (text: string, params?: unknown[]) => Promise<{ rows: any[] }>;
  connect: () => Promise<PgClient>;
};

let syncRunning = false;
let syncPending = false;

// Same league derivation as lib/db/seed-from-store.mjs and the
// league-DNA measure tool: uniqueTournament name, else tournament
// name, else "Unknown".
const leagueOf = (g: any) =>
  (g.tournament && (g.tournament.uniqueTournament ? g.tournament.uniqueTournament.name : null)) ||
  (g.tournament && g.tournament.name) ||
  "Unknown";

// Upsert the WHOLE in-memory store into Postgres (teams first, then
// games), in one transaction. Idempotent: re-running refreshes rows
// instead of duplicating them. Mirrors lib/db/seed-from-store.mjs,
// including its skip guard for incomplete games (a game with a missing
// team id/name or startTimestamp can never satisfy the FKs / NOT NULL
// columns, so it is skipped and counted, not crashed on).
const upsertStore = async (pool: PgPool) => {
  const games = Object.values(store.games || {});
  const stats = store.stats || {};
  const teams = new Map<number, string>();
  for (const t of Object.values(store.teams || {})) {
    if (t && t.id != null && t.name) teams.set(t.id, t.name);
  }
  for (const g of games) {
    for (const side of [g.homeTeam, g.awayTeam]) {
      if (side && side.id != null && side.name && !teams.has(side.id)) teams.set(side.id, side.name);
    }
  }
  let teamCount = 0, gameCount = 0, skipped = 0;
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    for (const [id, name] of teams) {
      await client.query(
        "INSERT INTO teams (id, name) VALUES ($1, $2) ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name",
        [id, name],
      );
      teamCount++;
    }
    for (const g of games) {
      const hid = g.homeTeam ? g.homeTeam.id : null;
      const aid = g.awayTeam ? g.awayTeam.id : null;
      if (g.id == null || hid == null || aid == null || !g.homeTeam.name || !g.awayTeam.name || g.startTimestamp == null) {
        skipped++;
        continue;
      }
      await client.query(
        "INSERT INTO games (id, league, home_team_id, away_team_id, home_team, away_team, home_score, away_score, start_timestamp, status, raw, detailed_stats) " +
          "VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) " +
          "ON CONFLICT (id) DO UPDATE SET league=EXCLUDED.league, home_team_id=EXCLUDED.home_team_id, away_team_id=EXCLUDED.away_team_id, home_team=EXCLUDED.home_team, away_team=EXCLUDED.away_team, home_score=EXCLUDED.home_score, away_score=EXCLUDED.away_score, start_timestamp=EXCLUDED.start_timestamp, status=EXCLUDED.status, raw=EXCLUDED.raw, detailed_stats=EXCLUDED.detailed_stats",
        [
          g.id,
          leagueOf(g),
          hid,
          aid,
          g.homeTeam.name,
          g.awayTeam.name,
          g.homeScore ? g.homeScore.current : null,
          g.awayScore ? g.awayScore.current : null,
          g.startTimestamp,
          g.status ? g.status.type : "finished",
          JSON.stringify(g),
          stats[g.id] ? JSON.stringify(stats[g.id]) : null,
        ],
      );
      gameCount++;
    }
    await client.query("COMMIT");
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
  return { teams: teamCount, games: gameCount, skipped };
};

// Replace the in-memory store contents with what Postgres holds.
// The `store` object identity is kept (routes hold that reference),
// only its three maps are swapped.
const loadFromPostgres = async (pool: PgPool) => {
  const teamRows = await pool.query("SELECT id, name FROM teams");
  const gameRows = await pool.query("SELECT id, raw, detailed_stats FROM games");
  const nextTeams: Record<string, { id: number; name: string }> = {};
  for (const t of teamRows.rows) nextTeams[t.id] = { id: t.id, name: t.name };
  const nextGames: Record<string, any> = {};
  const nextStats: Record<string, any> = {};
  for (const g of gameRows.rows) {
    nextGames[g.id] = g.raw;
    if (g.detailed_stats) nextStats[g.id] = g.detailed_stats;
  }
  store.teams = nextTeams;
  store.games = nextGames;
  store.stats = nextStats;
  return { teams: teamRows.rows.length, games: gameRows.rows.length };
};

// Dual-write half of persist(): upsert the whole store to Postgres.
// Fire-and-forget from persist() — it never throws outward. Overlapping
// persists are coalesced (a run already in flight just flags a re-run
// instead of piling up transactions). On failure the error is logged
// and the store is re-marked dirty, so the 30s persist interval retries
// the database write; the store.json mirror written just before is
// still current, so no data is lost.
const syncToPostgres = async (pool: PgPool): Promise<void> => {
  if (syncRunning) { syncPending = true; return; }
  syncRunning = true;
  try {
    do {
      syncPending = false;
      await upsertStore(pool);
    } while (syncPending);
  } catch (err) {
    console.error(
      "Hybrid store: Postgres dual-write failed (store.json mirror is still current; will retry on next persist):",
      err instanceof Error ? err.message : err,
    );
    markDirty();
  } finally {
    syncRunning = false;
  }
};

// Called from index.ts before app.listen. Returns the mode the server
// will run in. File mode needs nothing; Postgres mode seeds an empty
// database from the store, loads from Postgres, and registers the
// dual-write hook. Any failure here falls back to file mode — the
// server must still start.
export const initHybridStore = async (): Promise<"postgres" | "file"> => {
  if (!process.env.DATABASE_URL) {
    console.log("Hybrid store: DATABASE_URL not set — file mode (store.json only).");
    return "file";
  }
  try {
    const { pool } = (await import("@workspace/db")) as { pool: PgPool };
    const { rows } = await pool.query("SELECT count(*)::int AS n FROM games");
    if (rows[0].n === 0) {
      const s = await upsertStore(pool);
      console.log(
        `Hybrid store: Postgres tables empty — seeded ${s.games} games and ${s.teams} teams from store.json (${s.skipped} skipped as incomplete).`,
      );
    }
    const loaded = await loadFromPostgres(pool);
    registerPgPersist(() => { void syncToPostgres(pool); });
    console.log(
      `Hybrid store: Postgres mode — loaded ${loaded.games} games and ${loaded.teams} teams from Postgres (store.json stays as local mirror).`,
    );
    return "postgres";
  } catch (err) {
    console.error(
      "Hybrid store: Postgres unavailable — falling back to file mode (store.json) for this run.",
      err instanceof Error ? err.message : err,
    );
    console.error("Hybrid store: if the tables are missing, run the one-time migrations first (see README, Postgres section).");
    return "file";
  }
};
