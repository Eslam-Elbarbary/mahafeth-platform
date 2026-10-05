'use client';

import Lenis from 'lenis';
import 'lenis/dist/lenis.css';
import { createContext, use, useEffect, useState, type ReactNode } from 'react';

import { gsap, ScrollTrigger } from './gsap';
import { useReducedMotion } from './media';

const LenisContext = createContext<Lenis | null>(null);

/*
 * Lenis driven by the GSAP ticker so ScrollTrigger pins/scrubs stay in sync.
 * Disabled (native scrolling, like the design source) unless `enabled` and motion is allowed.
 */
export function SmoothScroll({ enabled, children }: { enabled: boolean; children: ReactNode }) {
  const reduced = useReducedMotion();
  const [lenis, setLenis] = useState<Lenis | null>(null);

  useEffect(() => {
    if (!enabled || reduced) return;
    const instance = new Lenis({ autoRaf: false });
    instance.on('scroll', ScrollTrigger.update);
    const tick = (time: number) => instance.raf(time * 1000);
    gsap.ticker.add(tick);
    const publish = requestAnimationFrame(() => setLenis(instance));
    return () => {
      cancelAnimationFrame(publish);
      gsap.ticker.remove(tick);
      instance.destroy();
      setLenis(null);
    };
  }, [enabled, reduced]);

  return <LenisContext value={lenis}>{children}</LenisContext>;
}

/** `null` when smooth scrolling is off — callers fall back to `window.scrollTo`. */
export function useLenis(): Lenis | null {
  return use(LenisContext);
}
