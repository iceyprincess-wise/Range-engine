import { integer, pgTable, text } from "drizzle-orm/pg-core";

/**
 * teams — one row per known team (BasketAPI team id).
 *
 * Seed source: store.teams from the api-server warehouse
 * (artifacts/api-server/data/store.json) UNION the team ids + names
 * carried inside the stored games themselves. The map holds 28 teams,
 * but the 611 stored games reference 168 distinct team ids — the other
 * 140 come from the games. lib/db/seed-from-store.mjs does this union
 * and upserts teams before games, so the games -> teams foreign keys
 * (see games.ts) hold on a fresh database.
 */
export const teams = pgTable("teams", {
  id: integer("id").primaryKey(),
  name: text("name").notNull(),
});

export type Team = typeof teams.$inferSelect;
export type NewTeam = typeof teams.$inferInsert;
