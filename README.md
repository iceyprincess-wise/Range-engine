# range-engine-v3
Advanced Basketball Forensic Analyzer.

## Layout

- `artifacts/api-server` — Express API (BasketAPI upstream, local warehouse in `data/`).
- `artifacts/mockup-sandbox` — the React app (Capacitor Android shell in `android/`).
- `lib/range-engine` — the analysis engine.

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

## Storage (file mode only)

The warehouse lives in `artifacts/api-server/data/store.json` — there is
no database. The server reads the store at startup and writes it back
whenever it changes (every 30 s when dirty). Moving games between the
Termux server and the Render server goes through the Hybrid Sync inbox
page (Hybrid button on the home page): export the store to
`artifacts/api-server/data/hybrid-inbox.json`, commit + push that one
file, and send the staged games to the warehouse from the page — or pull
the other server's games straight in. No database, no provisioning, no
paid plan.
