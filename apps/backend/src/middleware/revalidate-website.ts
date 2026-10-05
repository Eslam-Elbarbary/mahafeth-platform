import type { RequestHandler } from 'express';

import { env } from '../config/env.js';
import { logger } from '../lib/logger.js';

/*
 * After a successful admin write, asks the website to drop its cached CMS responses so the change
 * is live immediately instead of after the ISR window. Bursts (e.g. several image edits) are
 * coalesced into one call; failures are logged and never affect the admin response.
 */

const DEBOUNCE_MS = 500;
const TIMEOUT_MS = 5000;
/** Admin modules whose data the public website does not render. */
const IGNORED_PREFIXES = ['/leads', '/users'];

let timer: NodeJS.Timeout | undefined;

async function revalidate() {
  if (!env.WEB_REVALIDATE_URL || !env.REVALIDATE_SECRET) return;
  try {
    const res = await fetch(env.WEB_REVALIDATE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-revalidate-secret': env.REVALIDATE_SECRET },
      body: JSON.stringify({ tags: ['cms'] }),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (!res.ok) logger.warn({ status: res.status }, 'website revalidation rejected');
    else logger.debug('website revalidated');
  } catch (error) {
    logger.warn({ err: error }, 'website revalidation failed');
  }
}

export const revalidateWebsite: RequestHandler = (req, res, next) => {
  const enabled = env.WEB_REVALIDATE_URL && env.REVALIDATE_SECRET;
  const isWrite = req.method !== 'GET' && req.method !== 'HEAD' && req.method !== 'OPTIONS';
  if (enabled && isWrite && !IGNORED_PREFIXES.some((prefix) => req.path.startsWith(prefix))) {
    res.on('finish', () => {
      if (res.statusCode >= 400) return;
      clearTimeout(timer);
      timer = setTimeout(() => void revalidate(), DEBOUNCE_MS);
    });
  }
  next();
};
