CREATE TABLE "analysis_history" (
	"id" text PRIMARY KEY NOT NULL,
	"timestamp" text NOT NULL,
	"date" text NOT NULL,
	"league" text NOT NULL,
	"home_team" text NOT NULL,
	"away_team" text NOT NULL,
	"over_low" text NOT NULL,
	"over_high" text NOT NULL,
	"under_low" text NOT NULL,
	"under_high" text NOT NULL,
	"ko_time" text NOT NULL,
	"result" jsonb NOT NULL,
	"rerun_result" jsonb,
	"rerun_cmd" text,
	"outcome" text,
	"actual_total" double precision,
	"ft_score" text,
	"early_read" boolean,
	"bookmaker" text,
	"revalidation_requested" boolean,
	"revalidation_status" text,
	"last_revalidation_msg" text,
	"home_info_snap" jsonb,
	"away_info_snap" jsonb
);
--> statement-breakpoint
CREATE TABLE "games" (
	"id" integer PRIMARY KEY NOT NULL,
	"league" text NOT NULL,
	"home_team_id" integer NOT NULL,
	"away_team_id" integer NOT NULL,
	"home_team" text NOT NULL,
	"away_team" text NOT NULL,
	"home_score" integer,
	"away_score" integer,
	"start_timestamp" integer NOT NULL,
	"status" text NOT NULL,
	"raw" jsonb NOT NULL,
	"detailed_stats" jsonb
);
--> statement-breakpoint
CREATE TABLE "teams" (
	"id" integer PRIMARY KEY NOT NULL,
	"name" text NOT NULL
);
--> statement-breakpoint
CREATE INDEX "analysis_history_date_idx" ON "analysis_history" USING btree ("date");--> statement-breakpoint
CREATE INDEX "analysis_history_league_idx" ON "analysis_history" USING btree ("league");--> statement-breakpoint
CREATE INDEX "games_league_idx" ON "games" USING btree ("league");--> statement-breakpoint
CREATE INDEX "games_start_timestamp_idx" ON "games" USING btree ("start_timestamp");