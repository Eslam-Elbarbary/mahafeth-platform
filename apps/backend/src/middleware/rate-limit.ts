import type { Request, RequestHandler } from 'express';

import { HttpError } from '../lib/http-error.js';

interface Window {
  count: number;
  resetAt: number;
}

interface RateLimitOptions {
  max: number;
  windowMs: number;
  /** Bucket of the request; the client IP by default. Return `null` to skip limiting. */
  key?: (req: Request) => string | null;
  /** Only responses with status >= 400 count (e.g. failed sign-ins), checked when they finish. */
  failuresOnly?: boolean;
  message?: string;
}

/**
 * Fixed-window limiter kept in memory. Good enough for a single backend instance; move to a
 * shared store (Redis) before scaling horizontally.
 */
export function rateLimit({
  max,
  windowMs,
  key = (req) => req.ip ?? 'unknown',
  failuresOnly = false,
  message = 'Too many requests, please try again later',
}: RateLimitOptions): RequestHandler {
  const hits = new Map<string, Window>();

  const windowOf = (bucket: string, now: number) => {
    let entry = hits.get(bucket);
    if (!entry || entry.resetAt <= now) {
      if (hits.size > 10_000) {
        for (const [k, w] of hits) if (w.resetAt <= now) hits.delete(k);
      }
      entry = { count: 0, resetAt: now + windowMs };
      hits.set(bucket, entry);
    }
    return entry;
  };

  return (req, res, next) => {
    if (req.method === 'OPTIONS') return next();
    const bucket = key(req);
    if (bucket === null) return next();

    const now = Date.now();
    const entry = windowOf(bucket, now);
    if (entry.count >= max) {
      res.setHeader('Retry-After', Math.ceil((entry.resetAt - now) / 1000));
      throw new HttpError(429, message, 'RATE_LIMITED');
    }

    if (failuresOnly) {
      res.on('finish', () => {
        if (res.statusCode >= 400 && res.statusCode !== 429)
          windowOf(bucket, Date.now()).count += 1;
      });
    } else {
      entry.count += 1;
      res.setHeader('RateLimit-Limit', max);
      res.setHeader('RateLimit-Remaining', Math.max(0, max - entry.count));
    }
    next();
  };
}
