import { boolean, doublePrecision, index, jsonb, pgTable, text } from "drizzle-orm/pg-core";

/**
 * analysis_history — one row per analysis in the mockup history.
 *
 * Source: HistoryEntry (lib/range-engine/src/types.ts), today kept in
 * browser localStorage (key rangengine_v3_history, capped at 50) and
 * exported to artifacts/api-server/data/analysis-archive-export.json.
 * Verified against that export (16 rows, 2026-07-26..2026-07-31): every
 * required field is present; ids are millisecond-timestamp strings;
 * timestamp is a locale string ("31/07/2026, 23:36:37") and date is
 * "YYYY-MM-DD" — both kept as text, exactly as stored, no parsing.
 * result / rerun_result are the full EngineOutput objects, kept as
 * JSONB; home/away info snapshots are free-form JSONB (present on
 * 12 of 16 rows). The archive receipts (AnalysisArchiveEntry) are NOT
 * a table: they are derived 1:1 from these rows (see storage.ts
 * saveHistory), so they belong in a view/query, not in storage.
 */
export const analysisHistory = pgTable(
  "analysis_history",
  {
    id: text("id").primaryKey(),
    timestamp: text("timestamp").notNull(),
    date: text("date").notNull(),
    league: text("league").notNull(),
    homeTeam: text("home_team").notNull(),
    awayTeam: text("away_team").notNull(),
    overLow: text("over_low").notNull(),
    overHigh: text("over_high").notNull(),
    underLow: text("under_low").notNull(),
    underHigh: text("under_high").notNull(),
    koTime: text("ko_time").notNull(),
    result: jsonb("result").notNull(),
    rerunResult: jsonb("rerun_result"),
    rerunCmd: text("rerun_cmd"),
    outcome: text("outcome"),
    actualTotal: doublePrecision("actual_total"),
    ftScore: text("ft_score"),
    earlyRead: boolean("early_read"),
    bookmaker: text("bookmaker"),
    revalidationRequested: boolean("revalidation_requested"),
    revalidationStatus: text("revalidation_status"),
    lastRevalidationMsg: text("last_revalidation_msg"),
    homeInfoSnap: jsonb("home_info_snap"),
    awayInfoSnap: jsonb("away_info_snap"),
  },
  (t) => [
    index("analysis_history_date_idx").on(t.date),
    index("analysis_history_league_idx").on(t.league),
  ],
);

export type AnalysisHistory = typeof analysisHistory.$inferSelect;
export type NewAnalysisHistory = typeof analysisHistory.$inferInsert;
