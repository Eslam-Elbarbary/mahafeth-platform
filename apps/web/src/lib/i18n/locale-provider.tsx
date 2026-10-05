'use client';

import { createContext, use, useCallback, type ReactNode } from 'react';

import { LOCALE_COOKIE, localeDirection, type Direction, type Locale } from './config';

type LocaleContextValue = {
  locale: Locale;
  dir: Direction;
  /** Persists the preference the same way the legacy site did (localStorage) plus a cookie for `proxy.ts`. */
  rememberLocale: (locale: Locale) => void;
};

const LocaleContext = createContext<LocaleContextValue | null>(null);

export function LocaleProvider({ locale, children }: { locale: Locale; children: ReactNode }) {
  const rememberLocale = useCallback((next: Locale) => {
    try {
      localStorage.setItem(LOCALE_COOKIE, next);
    } catch {}
    document.cookie = `${LOCALE_COOKIE}=${next}; path=/; max-age=31536000; samesite=lax`;
  }, []);

  return (
    <LocaleContext value={{ locale, dir: localeDirection[locale], rememberLocale }}>
      {children}
    </LocaleContext>
  );
}

export function useLocale(): LocaleContextValue {
  const ctx = use(LocaleContext);
  if (!ctx) throw new Error('useLocale must be used inside <LocaleProvider>');
  return ctx;
}
