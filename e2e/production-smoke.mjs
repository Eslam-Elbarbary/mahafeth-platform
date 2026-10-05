/**
 * Post-deploy smoke test: read-only HTTP checks against a running website, API and (optionally)
 * admin. Safe to point at production — it never signs in or writes.
 *
 *   SMOKE_WEB_URL=https://mahafeth.com SMOKE_ADMIN_URL=https://admin.mahafeth.com pnpm test:smoke
 *
 * SMOKE_API_URL defaults to `${SMOKE_WEB_URL}/api/v1` (Nginx routes it to the backend).
 */
const WEB = (process.env.SMOKE_WEB_URL ?? 'http://localhost:3000').replace(/\/$/, '');
const API = (process.env.SMOKE_API_URL ?? `${WEB}/api/v1`).replace(/\/$/, '');
const ADMIN = process.env.SMOKE_ADMIN_URL?.replace(/\/$/, '');
const API_ORIGIN = new URL(API).origin;
const isLocal = (url) => /^(localhost|127\.0\.0\.1|\[::1\])$/.test(new URL(url).hostname);

let step = 0;
let failures = 0;
async function check(name, fn) {
  try {
    const detail = await fn();
    console.log(`  ok ${++step} - ${name}${detail ? ` (${detail})` : ''}`);
  } catch (error) {
    failures += 1;
    console.log(`  FAIL ${++step} - ${name}: ${error.message}`);
  }
}
function assert(condition, message) {
  if (!condition) throw new Error(message);
}
async function get(url, init) {
  const res = await fetch(url, {
    redirect: 'manual',
    signal: AbortSignal.timeout(15_000),
    ...init,
  });
  return { res, text: await res.text() };
}

console.log(`Smoke test — web ${WEB}, api ${API}${ADMIN ? `, admin ${ADMIN}` : ''}`);

await check('backend /health reports ok without internals', async () => {
  const { res, text } = await get(`${API_ORIGIN}/health`);
  assert(res.status === 200, `status ${res.status}`);
  const body = JSON.parse(text);
  assert(body.status === 'ok' && body.database === 'ok', text);
  const keys = Object.keys(body).sort().join(',');
  assert(keys === 'database,status,timestamp,uptime', `unexpected fields ${keys}`);
  return `uptime ${body.uptime}s`;
});

await check('public API answers', async () => {
  const { res, text } = await get(`${API}/projects`);
  assert(res.status === 200, `status ${res.status}`);
  return `${JSON.parse(text).data.length} projects`;
});

let arabicHtml = '';
for (const [locale, dir] of [
  ['ar', 'rtl'],
  ['en', 'ltr'],
]) {
  await check(`/${locale} renders with lang="${locale}" dir="${dir}"`, async () => {
    const { res, text } = await get(`${WEB}/${locale}`);
    assert(res.status === 200, `status ${res.status}`);
    assert(new RegExp(`<html[^>]*lang="${locale}"`).test(text), 'lang attribute');
    assert(new RegExp(`<html[^>]*dir="${dir}"`).test(text), 'dir attribute');
    if (locale === 'ar') arabicHtml = text;
  });
}

await check('metadata: canonical, hreflang and og:image use the site URL', async () => {
  const canonical = arabicHtml.match(/<link rel="canonical" href="([^"]+)"/)?.[1];
  const og = arabicHtml.match(/<meta property="og:image" content="([^"]+)"/)?.[1];
  assert(canonical?.startsWith(WEB), `canonical ${canonical}`);
  assert(/hrefLang="en"|hreflang="en"/.test(arabicHtml), 'hreflang alternate');
  // The share image is content: Settings → SEO (or the page's SEO tab) in the admin.
  if (!og) return 'warning: no og:image — set one in Settings → SEO';
  assert(og.startsWith(WEB) || !og.includes('/uploads/'), `og:image ${og}`);
  return `og:image ${og}`;
});

await check('no localhost URLs in the HTML of a public deployment', async () => {
  if (isLocal(WEB)) return 'skipped: local target';
  assert(!/localhost|127\.0\.0\.1/.test(arabicHtml), 'found a localhost reference');
});

await check(
  'CMS upload is served on the website origin and through the image optimizer',
  async () => {
    const optimized = arabicHtml.match(/\/_next\/image\?url=(%2Fuploads%2F[^&"]+)[^"]*/);
    let upload = optimized ? decodeURIComponent(optimized[1]) : null;
    if (!upload) {
      const { text } = await get(`${API}/projects`);
      upload = JSON.parse(text).data.find((p) => p.coverImage?.url?.startsWith('/uploads/'))
        ?.coverImage.url;
    }
    assert(upload, 'no /uploads image found on the page or in the projects API');

    const direct = await fetch(`${WEB}${upload}`, { signal: AbortSignal.timeout(15_000) });
    assert(direct.status === 200, `${upload} → ${direct.status}`);
    assert(direct.headers.get('x-content-type-options') === 'nosniff', 'nosniff header');

    const image = await fetch(`${WEB}/_next/image?url=${encodeURIComponent(upload)}&w=640&q=75`, {
      headers: { Accept: 'image/avif,image/webp,image/*' },
      signal: AbortSignal.timeout(30_000),
    });
    assert(image.status === 200, `optimizer → ${image.status} ${await image.text()}`);
    assert(image.headers.get('content-type')?.startsWith('image/'), 'optimizer content type');
    return `${upload} → ${image.headers.get('content-type')}`;
  },
);

await check('robots.txt points at the sitemap on the site URL', async () => {
  const { res, text } = await get(`${WEB}/robots.txt`);
  assert(res.status === 200, `status ${res.status}`);
  assert(text.includes(`Sitemap: ${WEB}/sitemap.xml`), text);
});

await check('sitemap.xml lists both locales on the site URL', async () => {
  const { res, text } = await get(`${WEB}/sitemap.xml`);
  assert(res.status === 200, `status ${res.status}`);
  const locs = [...text.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
  assert(locs.length > 0, 'no <loc> entries');
  assert(
    locs.every((loc) => loc.startsWith(`${WEB}/`)),
    `foreign URL ${locs.find((l) => !l.startsWith(WEB))}`,
  );
  assert(locs.some((l) => l.includes('/ar')) && locs.some((l) => l.includes('/en')), 'locales');
  return `${locs.length} URLs`;
});

await check('unknown page returns the localized 404', async () => {
  const { res, text } = await get(`${WEB}/ar/smoke-test-missing-page`);
  assert(res.status === 404, `status ${res.status}`);
  // Next streams the not-found UI inside its error shell; the Arabic copy is in the payload.
  assert(/[\u0600-\u06FF]/.test(text), 'Arabic 404 content');
});

await check('revalidation endpoint refuses unauthenticated calls', async () => {
  const { res } = await get(`${WEB}/api/revalidate`, { method: 'POST', body: '{}' });
  // 401 from Next, or 403/404 when Nginx blocks the path from the internet (recommended).
  assert([401, 403, 404].includes(res.status), `status ${res.status}`);
  return `status ${res.status}`;
});

if (ADMIN) {
  for (const path of ['/', '/login', '/settings/content', '/users', '/audit-logs']) {
    await check(`admin ${path} serves the SPA (direct load / refresh)`, async () => {
      const { res, text } = await get(`${ADMIN}${path}`);
      assert(res.status === 200, `status ${res.status}`);
      assert(/<div id="root">/.test(text), 'SPA shell');
    });
  }
  await check('admin origin proxies the API', async () => {
    const { res } = await get(`${ADMIN}/api/v1/auth/me`);
    assert(res.status === 401, `status ${res.status}`);
  });
}

console.log(failures ? `\n${failures} check(s) failed` : `\nAll ${step} checks passed`);
process.exit(failures ? 1 : 0);
