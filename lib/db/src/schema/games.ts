import { index, integer, jsonb, pgTable, text } from "drizzle-orm/pg-core";
import { teams } from "./teams";

/**
 * games — one row per finished game in the warehouse.
 *
 * Source: store.games from the api-server warehouse
 * (artifacts/api-server/data/store.json), keyed by BasketAPI event id.
 * Verified against the real store (2026-11-07, 611 games):
 * - every id is a unique integer; every game has a tournament name and
 *   integer home/away team ids and names; startTimestamp is a unix
 *   seconds integer; status is "finished" for all 611 rows.
 * - 610 of 611 games have integer home/away scores; 1 game
 *   (id 16667843, CBI U15 Fem) has no final score, so the score
 *   columns are nullable.
 * - league is the tournament display name used by the league-DNA
 *   measure tool (tournament.uniqueTournament?.name || tournament.name).
 * - raw is the full BasketAPI event object, kept verbatim.
 * - detailed_stats holds the per-game enrichment from store.stats
 *   (freeThrowsScored, rebounds, totalFouls, ...), keyed by game id.
 *   71 of 611 games have it; the rest are NULL. It lives here as a
 *   column instead of a fourth table because it is strictly 1:1 with
 *   a game and is only ever read together with that game.
 *
 * FKs to teams hold because the backfill (lib/db/seed-from-store.mjs)
 * upserts every team id referenced by games — from the games
 * themselves, not just the 28-team store.teams map — before games.
 */
export const games = pgTable(
  "games",
  {
    id: integer("id").primaryKey(),
    league: text("league").notNull(),
    homeTeamId: integer("home_team_id").notNull().references(() => teams.id),
    awayTeamId: integer("away_team_id").notNull().references(() => teams.id),
    homeTeam: text("home_team").notNull(),
    awayTeam: text("away_team").notNull(),
    homeScore: integer("home_score"),
    awayScore: integer("away_score"),
    startTimestamp: integer("start_timestamp").notNull(),
    status: text("status").notNull(),
    raw: jsonb("raw").notNull(),
    detailedStats: jsonb("detailed_stats"),
  },
  (t) => [
    index("games_league_idx").on(t.league),
    index("games_start_timestamp_idx").on(t.startTimestamp),
  ],
);

export type Game = typeof games.$inferSelect;
export type NewGame = typeof games.$inferInsert;
