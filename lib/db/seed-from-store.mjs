// Backfill the Postgres warehouse from the api-server store.json.
//
// Usage (from lib/db, after `pnpm install`):
//   DATABASE_URL=postgres://user:pass@host:5432/db node ./seed-from-store.mjs [store.json path]
//   DATABASE_URL=... pnpm --filter @workspace/db run seed
//
// Teams are upserted FIRST from the union of store.teams and every
// homeTeam/awayTeam inside store.games, so the games -> teams foreign
// keys hold. Games are then upserted (idempotent: re-running the seed
// refreshes rows instead of duplicating them). Everything runs in one
// transaction. The store path defaults to the api-server data dir;
// pass a path explicitly when the store lives elsewhere.
import fs from "node:fs";
import path from "node:path";
import pg from "pg";

const { Pool } = pg;

if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL is required (provision a Postgres database first).");
  process.exit(1);
}

function findStore() {
  const candidates = [
    process.argv[2],
    path.join(process.cwd(), "artifacts/api-server/data/store.json"),
    path.join(process.cwd(), "data/store.json"),
    path.join(process.cwd(), "..", "artifacts/api-server/data/store.json"),
  ].filter(Boolean);
  for (const c of candidates) {
    try {
      if (fs.statSync(c).isFile()) return c;
    } catch {
      // try next
    }
  }
  return null;
}

const storePath = findStore();
if (!storePath) {
  console.error("store.json not found. Pass its path: node ./seed-from-store.mjs /path/to/store.json");
  process.exit(1);
}

const store = JSON.parse(fs.readFileSync(storePath, "utf8"));
const games = Object.values(store.games || {});
const stats = store.stats || {};

// Union: searched teams map + every team id/name inside the games.
const teams = new Map();
for (const t of Object.values(store.teams || {})) {
  if (t && t.id != null && t.name) teams.set(t.id, t.name);
}
for (const g of games) {
  for (const side of [g.homeTeam, g.awayTeam]) {
    if (side && side.id != null && side.name && !teams.has(side.id)) teams.set(side.id, side.name);
  }
}

const leagueOf = (g) =>
  (g.tournament && (g.tournament.uniqueTournament ? g.tournament.uniqueTournament.name : null)) ||
  (g.tournament && g.tournament.name) ||
  "Unknown";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const client = await pool.connect();
let teamCount = 0;
let gameCount = 0;
let skipped = 0;
try {
  await client.query("BEGIN");
  for (const [id, name] of teams) {
    await client.query(
      "INSERT INTO teams (id, name) VALUES ($1, $2) ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name",
      [id, name]
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
      ]
    );
    gameCount++;
  }
  await client.query("COMMIT");
} catch (err) {
  await client.query("ROLLBACK");
  throw err;
} finally {
  client.release();
  await pool.end();
}

// FK proof: no game may reference a missing team.
const checkPool = new Pool({ connectionString: process.env.DATABASE_URL });
const orphan = await checkPool.query(
  "SELECT count(*)::int AS n FROM games g LEFT JOIN teams t ON t.id IN (g.home_team_id, g.away_team_id) WHERE t.id IS NULL"
);
await checkPool.end();

console.log("seeded from " + storePath);
console.log("teams upserted: " + teamCount + " (from " + Object.keys(store.teams || {}).length + " searched + games)");
console.log("games upserted: " + gameCount + ", skipped (incomplete): " + skipped);
console.log("games referencing a missing team (must be 0): " + orphan.rows[0].n);
if (orphan.rows[0].n !== 0) process.exit(1);
