import { createHash, timingSafeEqual } from 'node:crypto';

import { revalidateTag } from 'next/cache';
import { type NextRequest, NextResponse } from 'next/server';

/*
 * On-demand revalidation, called by the backend after every successful admin write so CMS changes
 * appear without waiting for the ISR window. Authenticated with `REVALIDATE_SECRET`; disabled when
 * the secret is not configured.
 */

const ALLOWED_TAG = /^cms(?::[\w-]+)*$/;

const sameSecret = (given: string | null, expected: string) => {
  if (!given) return false;
  const [a, b] = [
    createHash('sha256').update(given).digest(),
    createHash('sha256').update(expected).digest(),
  ];
  return timingSafeEqual(a, b);
};

export async function POST(request: NextRequest) {
  const secret = process.env.REVALIDATE_SECRET;
  if (!secret || !sameSecret(request.headers.get('x-revalidate-secret'), secret)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body: unknown = await request.json().catch(() => ({}));
  const requested =
    typeof body === 'object' && body !== null && Array.isArray((body as { tags?: unknown }).tags)
      ? (body as { tags: unknown[] }).tags
      : ['cms'];
  const tags = requested.filter(
    (tag): tag is string => typeof tag === 'string' && ALLOWED_TAG.test(tag),
  );
  if (tags.length === 0) return NextResponse.json({ error: 'No valid tags' }, { status: 400 });

  for (const tag of tags) revalidateTag(tag, { expire: 0 });
  return NextResponse.json({ revalidated: tags, now: Date.now() });
}
