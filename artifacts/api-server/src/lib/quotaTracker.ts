import fs from "node:fs";
import path from "node:path";

const QPATH = path.join(process.cwd(), "data", "quota.json");

export const quota: { limit: number | null; remaining: number | null; updatedAt: number | null } = {
  limit: null,
  remaining: null,
  updatedAt: null,
};

try { Object.assign(quota, JSON.parse(fs.readFileSync(QPATH, "utf8"))); } catch { /* first run */ }

export const updateQuotaFromResponse = (response: Response) => {
  const lim = response.headers.get("x-ratelimit-requests-limit");
  const rem = response.headers.get("x-ratelimit-requests-remaining");
  if (rem === null) return;
  quota.limit = lim !== null ? Number(lim) : quota.limit;
  quota.remaining = Number(rem);
  quota.updatedAt = Date.now();
  try {
    fs.mkdirSync(path.dirname(QPATH), { recursive: true });
    fs.writeFileSync(QPATH, JSON.stringify(quota));
  } catch { /* non-fatal */ }
};
