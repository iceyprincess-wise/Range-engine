import type { NextFunction, Request, Response } from "express";

/**
 * Per-IP fixed-window rate limiter for the public /api surface.
 *
 * No auth exists on these routes and every prematch/sync call can spend
 * RapidAPI quota, so an open loop — or a stranger who finds the URL —
 * could burn the daily quota. 600 requests / 10 minutes per IP is far
 * above one user's real use (the mockup polls quota and tournaments a
 * few times a minute) and stops a flood. The window map is pruned on
 * an interval so it cannot grow without bound.
 */
const WINDOW_MS = 10 * 60 * 1000;
const MAX_REQUESTS = 600;
const hits = new Map<string, { count: number; resetAt: number }>();

setInterval(() => {
  const now = Date.now();
  for (const [ip, h] of hits) if (h.resetAt <= now) hits.delete(ip);
}, WINDOW_MS).unref();

export const rateLimit = (req: Request, res: Response, next: NextFunction) => {
  const ip = req.ip || req.socket?.remoteAddress || "unknown";
  const now = Date.now();
  const h = hits.get(ip);
  if (!h || h.resetAt <= now) {
    hits.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    return next();
  }
  h.count++;
  if (h.count > MAX_REQUESTS) {
    res.setHeader("Retry-After", Math.ceil((h.resetAt - now) / 1000));
    return res.status(429).json({ error: "rate limit exceeded, try again shortly" });
  }
  return next();
};

export default rateLimit;
