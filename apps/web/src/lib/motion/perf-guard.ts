'use client';

import { useEffect } from 'react';

import { REDUCED_MOTION_QUERY } from './media';

type NavigatorWithMemory = Navigator & { deviceMemory?: number };

/*
 * Port of the legacy `perfGuard()`: measures the first ~2.2s of frames and adds
 * `perf-lite` / `perf-mid` on <html>, which strip the heaviest aura layers in CSS.
 */
export function usePerfGuard() {
  useEffect(() => {
    const root = document.documentElement;
    if (matchMedia(REDUCED_MOTION_QUERY).matches) {
      root.classList.add('perf-lite');
      return;
    }
    const nav = navigator as NavigatorWithMemory;
    if (nav.deviceMemory && nav.deviceMemory <= 4) root.classList.add('perf-lite');
    if (nav.hardwareConcurrency && nav.hardwareConcurrency <= 4) root.classList.add('perf-lite');
    if (root.classList.contains('perf-lite')) return;

    const frames: number[] = [];
    let last = performance.now();
    const started = last;
    let raf = 0;

    const tick = (now: number) => {
      frames.push(now - last);
      last = now;
      if (now - started < 2200) {
        raf = requestAnimationFrame(tick);
        return;
      }
      frames.shift();
      if (frames.length < 8) return;
      const sorted = [...frames].sort((a, b) => a - b);
      const median = sorted[Math.floor(sorted.length / 2)] ?? 0;
      if (median > 34) root.classList.add('perf-lite');
      else if (median > 21) root.classList.add('perf-mid');
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);
}
