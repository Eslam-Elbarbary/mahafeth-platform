export const locales = ['ar', 'en'] as const;

export type Locale = (typeof locales)[number];
export type Direction = 'rtl' | 'ltr';

export const defaultLocale: Locale = 'ar';

export const localeDirection: Record<Locale, Direction> = {
  ar: 'rtl',
  en: 'ltr',
};

/** Same key the legacy site used in localStorage; mirrored to a cookie so `proxy.ts` can read it. */
export const LOCALE_COOKIE = 'mhf-lang';

/** Request header `proxy.ts` sets to the path locale, for boundaries without params (404). */
export const LOCALE_HEADER = 'x-mhf-locale';

export function isLocale(value: unknown): value is Locale {
  return typeof value === 'string' && (locales as readonly string[]).includes(value);
}

export function otherLocale(locale: Locale): Locale {
  return locale === 'ar' ? 'en' : 'ar';
}

/** Replaces (or adds) the locale segment of a pathname. */
export function localizePath(pathname: string, locale: Locale): string {
  const segments = pathname.split('/');
  if (isLocale(segments[1])) segments[1] = locale;
  else segments.splice(1, 0, locale);
  return segments.join('/') || `/${locale}`;
}
