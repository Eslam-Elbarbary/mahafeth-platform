import type { NextConfig } from 'next';

const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1', '[::1]', '0.0.0.0']);

/*
 * On Vercel the public URL comes from its system variables when not set explicitly. Without an
 * explicit API URL there is no backend, so the CMS is off and pages use the fallback content.
 */
const vercelHost = process.env.VERCEL_PROJECT_PRODUCTION_URL || process.env.VERCEL_URL;
const vercelUrl = process.env.VERCEL && vercelHost ? `https://${vercelHost}` : undefined;
if (vercelUrl) {
  process.env.NEXT_PUBLIC_SITE_URL ||= vercelUrl;
  if (!process.env.NEXT_PUBLIC_API_URL) {
    process.env.NEXT_PUBLIC_API_URL = `${process.env.NEXT_PUBLIC_SITE_URL}/api/v1`;
    process.env.CMS_ENABLED = 'false';
  }
}

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
const publicApiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api/v1';
/** Where this server reaches the backend; see `CMS_API_URL` in .env.example. */
const internalApiUrl = process.env.CMS_API_URL || publicApiUrl;

/*
 * Production builds and servers refuse development URLs and placeholder secrets, so a missing
 * production env file fails loudly instead of shipping links to localhost. A production build on a
 * developer machine opts out with ALLOW_LOCAL_URLS=true.
 */
if (process.env.NODE_ENV === 'production' && process.env.ALLOW_LOCAL_URLS !== 'true') {
  const problems: string[] = [];
  for (const [name, value] of [
    ['NEXT_PUBLIC_SITE_URL', siteUrl],
    ['NEXT_PUBLIC_API_URL', process.env.NEXT_PUBLIC_API_URL],
  ] as const) {
    if (!value) problems.push(`${name} is not set`);
    else if (!value.startsWith('https://') || LOCAL_HOSTS.has(new URL(value).hostname)) {
      problems.push(`${name} must be the public https URL (got ${value})`);
    }
  }
  if (/replace-with|change-me/i.test(process.env.REVALIDATE_SECRET ?? '')) {
    problems.push('REVALIDATE_SECRET is still the placeholder');
  }
  if (problems.length > 0) {
    throw new Error(`Production configuration:\n  - ${problems.join('\n  - ')}`);
  }
}

const backendOrigin = new URL(internalApiUrl).origin;
const proxyUploads = !siteUrl || new URL(siteUrl).origin !== backendOrigin;

/* Absolute media URLs are only accepted from the CDN in `CMS_MEDIA_URL`. */
const cdn = process.env.CMS_MEDIA_URL ? new URL(process.env.CMS_MEDIA_URL) : null;

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  env: vercelUrl
    ? {
        NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL!,
        NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL!,
        CMS_ENABLED: process.env.CMS_ENABLED ?? 'true',
      }
    : {},
  images: {
    formats: ['image/avif', 'image/webp'],
    remotePatterns: cdn
      ? [
          {
            protocol: cdn.protocol.replace(':', '') as 'http' | 'https',
            hostname: cdn.hostname,
            port: cdn.port,
            pathname: `${cdn.pathname.replace(/\/$/, '')}/**`,
          },
        ]
      : [],
  },
  /*
   * CMS uploads are linked as `/uploads/…` on the website's own origin. In production Nginx sends
   * that path straight to the backend; this rewrite covers `next start` / `next dev` without it and
   * is what the image optimizer uses, so it reads uploads as local files over the internal URL.
   */
  async rewrites() {
    return proxyUploads
      ? [{ source: '/uploads/:path*', destination: `${backendOrigin}/uploads/:path*` }]
      : [];
  },
};

export default nextConfig;
