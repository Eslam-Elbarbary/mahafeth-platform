import { NextResponse, type NextRequest } from 'next/server';

import {
  defaultLocale,
  isLocale,
  LOCALE_COOKIE,
  LOCALE_HEADER,
  localizePath,
  type Locale,
} from '@/lib/i18n/config';

/** Legacy static-site entry points and their App Router equivalents. */
const LEGACY_PATHS: Record<string, string> = {
  '/index.html': '/',
  '/projects.html': '/projects',
};

export function proxy(request: NextRequest) {
  const url = request.nextUrl.clone();
  const queryLocale = url.searchParams.get('lang');
  const pathLocale = url.pathname.split('/')[1];

  if (isLocale(pathLocale)) {
    // Old `?lang=` links still win over the path, then the param is dropped.
    if (!isLocale(queryLocale)) {
      const headers = new Headers(request.headers);
      headers.set(LOCALE_HEADER, pathLocale);
      return NextResponse.next({ request: { headers } });
    }
    url.searchParams.delete('lang');
    url.pathname = localizePath(url.pathname, queryLocale);
    return NextResponse.redirect(url);
  }

  const cookieLocale = request.cookies.get(LOCALE_COOKIE)?.value;
  // The design source always opens in Arabic unless the visitor chose otherwise.
  const locale: Locale = isLocale(queryLocale)
    ? queryLocale
    : isLocale(cookieLocale)
      ? cookieLocale
      : defaultLocale;

  const path = LEGACY_PATHS[url.pathname] ?? url.pathname;
  url.searchParams.delete('lang');
  url.pathname = path === '/' ? `/${locale}` : `/${locale}${path}`;
  return NextResponse.redirect(url);
}

export const config = {
  matcher: [
    '/((?!api|_next|_vercel|favicon.ico|robots.txt|sitemap.xml|.*\\.(?:png|jpe?g|webp|avif|gif|svg|ico|woff2?|mp4|webm|txt|xml|json)$).*)',
  ],
};
