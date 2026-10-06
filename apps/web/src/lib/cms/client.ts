import { connection } from 'next/server';

import { siteConfig } from '@/config/site';

/*
 * Server-side reader for the public CMS API (`apps/backend`, `/api/v1`). Every failure mode —
 * disabled, unreachable, slow, non-2xx, malformed — resolves to a result instead of throwing, so
 * callers can fall back to temporary content and pages keep rendering without the backend.
 */

/** `CMS_ENABLED=false` skips the API entirely (e.g. builds with no backend around). */
export const cmsEnabled = process.env.CMS_ENABLED !== 'false';

/**
 * Where this server reads the API. `CMS_API_URL` (server-only) lets production skip the public
 * round trip through Nginx, e.g. `http://127.0.0.1:4000/api/v1`; browsers keep using
 * `NEXT_PUBLIC_API_URL`.
 */
const cmsApiUrl = process.env.CMS_API_URL || siteConfig.apiUrl;

const TIMEOUT_MS = 3000;

export type CmsResult<T> =
  | { state: 'ok'; data: T }
  /** The CMS answered 404: the resource does not exist (or is not published). */
  | { state: 'missing' }
  /** Disabled, unreachable, timed out, 5xx or malformed — use fallback content. */
  | { state: 'unavailable' };

let warned = false;
function warnOnce(reason: string) {
  if (warned) return;
  warned = true;
  console.warn(`[cms] ${reason} — serving fallback content (${cmsApiUrl}).`);
}

/*
 * CMS content is read at request time and never stored in the Next data cache, so an admin save is
 * visible on the next page request. Within one render, callers dedupe through React `cache()`.
 * `connection()` sits outside the try block: it is what keeps CMS-backed routes out of build-time
 * prerendering, and catching it would freeze the fallback content into a static page.
 */
export async function cmsFetch<T>(
  path: string,
  { isValid }: { isValid: (body: unknown) => body is T },
): Promise<CmsResult<T>> {
  if (!cmsEnabled) return { state: 'unavailable' };
  await connection();
  try {
    const res = await fetch(`${cmsApiUrl}${path}`, {
      headers: { Accept: 'application/json' },
      cache: 'no-store',
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (res.status === 404) return { state: 'missing' };
    if (!res.ok) {
      warnOnce(`${path} answered ${res.status}`);
      return { state: 'unavailable' };
    }
    const body: unknown = await res.json();
    if (!isValid(body)) {
      warnOnce(`${path} returned an unexpected payload`);
      return { state: 'unavailable' };
    }
    return { state: 'ok', data: body };
  } catch (error) {
    warnOnce(error instanceof Error ? error.message : String(error));
    return { state: 'unavailable' };
  }
}

/**
 * Media `url`s are absolute (CDN, allowed by `CMS_MEDIA_URL`) or backend-relative (`/uploads/…`).
 * Relative ones stay on the website's own origin, where `/uploads` is routed to the backend
 * (Nginx in production, the rewrite in next.config.ts otherwise), so the image optimizer treats
 * them as local files and never fetches from a private address.
 */
export const cmsMediaUrl = (url: string) =>
  /^(https?:)?\/\//i.test(url) ? url : `/${url.replace(/^\/+/, '')}`;
