import fs from "node:fs";
import path from "node:path";
import { resolveDataDir } from "./warehouse";

const QPATH = path.join(resolveDataDir(), "quota.json");

export const quota: { limit: number | null; remaining: number | null; updatedAt: number | null } = {
  limit: null,
  remaining: null,
  updatedAt: null,
};

try { Object.assign(quota, JSON.parse(fs.readFileSync(QPATH, "utf8"))); } catch { /* first run */ }

export const updateQuotaFromResponse = (response: Response) => {
  const lim = response.headers.get("x-ratelimit-requests-limit");
  const rem = response.headers.get("x-ratelimit-requests-remaining");
  // Assign each header independently when it parses to a finite
  // number: the old code returned early when `remaining` was absent,
  // so `limit` never updated either, and a non-numeric header wrote
  // NaN into quota.json (serialised as null on disk).
  const limN = lim !== null ? Number(lim) : NaN;
  const remN = rem !== null ? Number(rem) : NaN;
  if (Number.isFinite(limN)) quota.limit = limN;
  if (Number.isFinite(remN)) quota.remaining = remN;
  if (!Number.isFinite(limN) && !Number.isFinite(remN)) return;
  quota.updatedAt = Date.now();
  try {
    fs.mkdirSync(path.dirname(QPATH), { recursive: true });
    fs.writeFileSync(QPATH, JSON.stringify(quota));
  } catch { /* non-fatal */ }
};
