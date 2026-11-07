import "dotenv/config";

import app from "./app";
import { logger } from "./lib/logger";
import { initHybridStore } from "./lib/hybridStore";

const rawPort = process.env["PORT"];

if (!rawPort) {
  throw new Error(
    "PORT environment variable is required but was not provided.",
  );
}

const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

// Hybrid warehouse: if DATABASE_URL is set, connect to Postgres
// (seeding from store.json when the tables are empty) and load the
// store from it; otherwise file mode. Falls back to file mode if
// Postgres is unreachable, so the server still starts. Must run before
// listen so the first request already sees the loaded data.
await initHybridStore();

app.listen(port, (err) => {
  if (err) {
    logger.error({ err }, "Error listening on port");
    process.exit(1);
  }

  logger.info({ port }, "Server listening");
});
