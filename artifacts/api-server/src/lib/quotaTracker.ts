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

// Daily-reset rollover: RapidAPI quotas reset daily, but the persisted
// snapshot never expired — a low `remaining` from yesterday kept
// blocking enrichment and settle-fetch forever, and no code read
// updatedAt to notice. A snapshot from a previous UTC day is reset to
// UNKNOWN (null), never to an invented number: the gates treat null as
// "unmeasured" and the next real response re-measures it.
const startOfUtcDay = (t: number) => { const d = new Date(t); return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()); };
export const rolloverQuotaIfStaleDay = () => {
  if (quota.updatedAt == null) return;
  if (startOfUtcDay(quota.updatedAt) >= startOfUtcDay(Date.now())) return;
  quota.limit = null; quota.remaining = null; quota.updatedAt = Date.now();
  try {
    fs.mkdirSync(path.dirname(QPATH), { recursive: true });
    fs.writeFileSync(QPATH, JSON.stringify(quota));
  } catch { /* non-fatal */ }
  console.log("quota: snapshot predates today (UTC) — reset to unknown until the next provider response");
};
rolloverQuotaIfStaleDay();
setInterval(rolloverQuotaIfStaleDay, 60 * 60 * 1000).unref();

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
