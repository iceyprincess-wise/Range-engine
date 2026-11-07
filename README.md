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

## Postgres (optional, future cutover)

The schema lives in `lib/db` (teams / games / analysis_history).
With a database provisioned, backfill it from the warehouse with
`DATABASE_URL=... pnpm --filter @workspace/db run seed` — teams are
upserted from banked games first, so the games → teams foreign keys
hold. The api-server still reads `store.json` until the cutover lands.

