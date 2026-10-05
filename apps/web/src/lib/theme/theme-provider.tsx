'use client';

import { createContext, use, useCallback, useSyncExternalStore, type ReactNode } from 'react';

import { siteConfig } from '@/config/site';
import { REDUCED_MOTION_QUERY } from '@/lib/motion/media';

export type Theme = 'dark' | 'light';

const THEME_STORAGE_KEY = 'mhf-theme';

type ThemeContextValue = {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  /** Circular View Transition reveal centred on `origin` (the toggle button), as in the design source. */
  toggleTheme: (origin?: HTMLElement | null) => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

function readTheme(): Theme {
  return document.documentElement.getAttribute('data-theme') === 'light' ? 'light' : 'dark';
}

function subscribe(onChange: () => void) {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
  return () => observer.disconnect();
}

function applyTheme(theme: Theme) {
  const root = document.documentElement;
  root.setAttribute('data-theme', theme);
  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch {}
  document
    .querySelector('meta[name="theme-color"]')
    ?.setAttribute('content', siteConfig.themeColor[theme]);
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const theme = useSyncExternalStore(subscribe, readTheme, () => 'dark' as const);

  const setTheme = useCallback((next: Theme) => applyTheme(next), []);

  const toggleTheme = useCallback((origin?: HTMLElement | null) => {
    const next: Theme = readTheme() === 'dark' ? 'light' : 'dark';
    const root = document.documentElement;
    if (origin) {
      const r = origin.getBoundingClientRect();
      root.style.setProperty('--vt-x', `${r.left + r.width / 2}px`);
      root.style.setProperty('--vt-y', `${r.top + r.height / 2}px`);
    }
    const reduced = matchMedia(REDUCED_MOTION_QUERY).matches;
    if (document.startViewTransition && !reduced) {
      document.startViewTransition(() => applyTheme(next));
    } else {
      applyTheme(next);
    }
  }, []);

  return <ThemeContext value={{ theme, setTheme, toggleTheme }}>{children}</ThemeContext>;
}

export function useTheme(): ThemeContextValue {
  const ctx = use(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used inside <ThemeProvider>');
  return ctx;
}
