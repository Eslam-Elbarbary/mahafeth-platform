'use client';

import { usePathname } from 'next/navigation';
import { useCallback } from 'react';

import type { Locale } from './config';
import { useLocale } from './locale-provider';

export function isHomePath(pathname: string, locale: Locale): boolean {
  return pathname === `/${locale}` || pathname === `/${locale}/`;
}

/**
 * Content href → real URL. `#id` stays an in-page anchor on the home page and becomes
 * `/{locale}#id` elsewhere; `/path` gets the locale prefix; tel:/https:/`#` pass through.
 */
export function resolveHref(href: string, locale: Locale, onHome: boolean): string {
  if (href === '#') return href;
  if (href.startsWith('#')) {
    if (onHome) return href;
    return href === '#top' ? `/${locale}` : `/${locale}${href}`;
  }
  if (href.startsWith('/')) return `/${locale}${href === '/' ? '' : href}`;
  return href;
}

export function isInternalRoute(url: string): boolean {
  return url.startsWith('/') && !url.startsWith('//');
}

export function useResolveHref() {
  const { locale } = useLocale();
  const pathname = usePathname();
  const onHome = isHomePath(pathname, locale);
  return useCallback((href: string) => resolveHref(href, locale, onHome), [locale, onHome]);
}
