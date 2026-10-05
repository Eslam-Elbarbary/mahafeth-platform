'use client';

import { useCallback } from 'react';

import { useMotion } from './motion-provider';
import { useLenis } from './smooth-scroll';

/** Smooth page scroll to an absolute offset — Lenis when enabled, native smooth scroll otherwise. */
export function useScrollTo() {
  const lenis = useLenis();
  const { reducedMotion } = useMotion();

  return useCallback(
    (top: number) => {
      if (lenis) lenis.scrollTo(top, { immediate: reducedMotion });
      else window.scrollTo({ top, behavior: reducedMotion ? 'auto' : 'smooth' });
    },
    [lenis, reducedMotion],
  );
}
