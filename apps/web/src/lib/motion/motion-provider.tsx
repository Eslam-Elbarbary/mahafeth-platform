'use client';

import { createContext, use, type ReactNode } from 'react';

import { siteConfig } from '@/config/site';

import './gsap';
import { useFinePointer, useReducedMotion } from './media';
import { usePerfGuard } from './perf-guard';
import { SmoothScroll } from './smooth-scroll';

type MotionContextValue = {
  /** `prefers-reduced-motion: reduce` — disables intro, pinning and reveals (legacy `RM`). */
  reducedMotion: boolean;
  /** `(hover:hover) and (pointer:fine)` — gates magnetic buttons, cursor, mega menu (legacy `FINE`). */
  finePointer: boolean;
};

const MotionContext = createContext<MotionContextValue>({
  reducedMotion: false,
  finePointer: false,
});

export function MotionProvider({ children }: { children: ReactNode }) {
  usePerfGuard();
  const reducedMotion = useReducedMotion();
  const finePointer = useFinePointer();

  return (
    <MotionContext value={{ reducedMotion, finePointer }}>
      <SmoothScroll enabled={siteConfig.motion.smoothScroll}>{children}</SmoothScroll>
    </MotionContext>
  );
}

export function useMotion(): MotionContextValue {
  return use(MotionContext);
}
