import { integer, pgTable, text } from "drizzle-orm/pg-core";

/**
 * teams — one row per known team (BasketAPI team id).
 *
 * Seed source: store.teams from the api-server warehouse
 * (artifacts/api-server/data/store.json). The map holds 28 teams, but the
 * 611 stored games reference 168 distinct team ids, so 140 team ids used
 * by games are NOT in the map yet. The teams table therefore starts as
 * the 28 known rows and is backfilled from games on first import.
 *
 * Deliberately NO foreign key from games to teams (v1): a FK would reject
 * every insert for those 140 teams. Add the FK only after the backfill.
 */
export const teams = pgTable("teams", {
  id: integer("id").primaryKey(),
  name: text("name").notNull(),
});

export type Team = typeof teams.$inferSelect;
export type NewTeam = typeof teams.$inferInsert;
