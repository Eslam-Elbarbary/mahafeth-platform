'use client';

import { useEffect } from 'react';

import { useScrollTo } from './scroll-to';

/**
 * In-page anchors (legacy `anchors()`): smooth scroll to `#id` with a 20px offset (`#top` → 0),
 * then update the URL hash without adding a history entry. Bare `#` links do nothing.
 */
export function AnchorScroll() {
  const scrollTo = useScrollTo();

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented) return;
      const a = (e.target as Element | null)?.closest<HTMLAnchorElement>('a[href^="#"]');
      if (!a) return;
      const id = a.getAttribute('href')!.slice(1);
      if (!id) {
        e.preventDefault();
        return;
      }
      const target = document.getElementById(id);
      if (!target) return;
      e.preventDefault();
      const top = id === 'top' ? 0 : target.getBoundingClientRect().top + window.pageYOffset - 20;
      scrollTo(top);
      window.history.replaceState(null, '', `#${id}`);
    };
    document.addEventListener('click', onClick);
    return () => document.removeEventListener('click', onClick);
  }, [scrollTo]);

  return null;
}
