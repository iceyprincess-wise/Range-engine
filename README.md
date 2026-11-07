# range-engine-v3
Advanced Basketball Forensic Analyzer.

## Layout

- `artifacts/api-server` — Express API (BasketAPI upstream, local warehouse in `data/`).
- `artifacts/mockup-sandbox` — the React app (Capacitor Android shell in `android/`).
- `lib/range-engine` — the analysis engine. `lib/db` — Postgres schema (Drizzle).

## Prerequisites

- Node 22, pnpm 10 (`corepack enable` then `pnpm --version`).
- A RapidAPI key for BasketAPI (`basketapi1.p.rapidapi.com`).
- For the Android APK: JDK 21 and the Android SDK (API 36, build-tools 36.0.0).

## Run locally

```sh
pnpm install
# api-server: copy artifacts/api-server/.env.example to .env and set
# RAPIDAPI_KEY; PORT must be 5000 (the mockup proxies /api there).
cd artifacts/api-server && pnpm dev
# mockup (new terminal, repo root): PORT=5173 BASE_PATH=/ pnpm --filter @workspace/mockup-sandbox dev
```

The api-server keeps its warehouse in `artifacts/api-server/data/`
(`store.json`, `quota.json`, `games-cache.json`); that directory is
git-ignored — the running server rewrites those files.

## Android APK

Pushes to `main` build a debug APK in GitHub Actions
(`.github/workflows/android-build.yml`, also runs unit tests).
Locally: `cd artifacts/mockup-sandbox && pnpm exec cap sync android`
then `cd android && ./gradlew assembleDebug`.

## Postgres (optional, hybrid with store.json)

The schema lives in `lib/db` (teams / games / analysis_history). The
api-server runs in one of two modes, picked by environment:

- **File mode** (`DATABASE_URL` unset, the default): the warehouse
  lives in `artifacts/api-server/data/store.json` only, exactly as
  before. Nothing about Postgres is needed.
- **Hybrid mode** (`DATABASE_URL` set): on startup the server seeds an
  empty database from `store.json` (teams first, from the searched map
  UNION the teams inside the stored games, so the games → teams
  foreign keys hold), then loads the warehouse from Postgres. Every
  `persist()` then writes BOTH Postgres and `store.json` (local
  mirror), so the file stays current in Termux and on Render. If
  Postgres is unreachable at startup the server logs a warning and
  falls back to file mode for that run. Quota, the games cache and the
  analysis archive stay file-only; `analysis_history` has no server
  writer. The in-memory store stays the runtime source of truth in
  both modes — no route changed for this.

One-time setup for hybrid mode (do this once, before the first
hybrid start):

```sh
# 1. Provision a Postgres database (e.g. Render free Postgres).
# 2. Create the tables from the repo migrations (from the repo root):
DATABASE_URL=postgres://user:password@host:5432/database pnpm --filter @workspace/db run push
# 3. Put DATABASE_URL in artifacts/api-server/.env (Termux) or the
#    Render dashboard (hosted). Never commit a real DATABASE_URL.
# 4. Start the server. First start seeds the empty tables from
#    store.json; later starts load from Postgres.
```

You can also backfill a database by hand at any time with
`DATABASE_URL=... pnpm --filter @workspace/db run seed` — same
upsert logic as the startup seed.

