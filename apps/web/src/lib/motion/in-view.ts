'use client';

import { useEffect, useState, type RefObject } from 'react';

import { useMotion } from './motion-provider';

/** Legacy `MHF.reveal` defaults. */
export const REVEAL_OPTIONS: IntersectionObserverInit = {
  rootMargin: '0px 0px -8% 0px',
  threshold: 0.12,
};

type Pool = { io: IntersectionObserver; callbacks: Map<Element, () => void> };
const pools = new Map<string, Pool>();

function poolFor(options: IntersectionObserverInit): Pool {
  const key = `${options.rootMargin ?? ''}|${String(options.threshold ?? '')}`;
  let pool = pools.get(key);
  if (!pool) {
    const callbacks = new Map<Element, () => void>();
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const cb = callbacks.get(entry.target);
        callbacks.delete(entry.target);
        io.unobserve(entry.target);
        cb?.();
      });
    }, options);
    pool = { io, callbacks };
    pools.set(key, pool);
  }
  return pool;
}

/** One shared IntersectionObserver per option set; fires `cb` once, the first time `el` enters. */
export function observeOnce(
  el: Element,
  cb: () => void,
  options: IntersectionObserverInit = REVEAL_OPTIONS,
) {
  const pool = poolFor(options);
  pool.callbacks.set(el, cb);
  pool.io.observe(el);
  return () => {
    pool.callbacks.delete(el);
    pool.io.unobserve(el);
  };
}

/**
 * `true` once the element has entered the viewport (legacy `.is-in`), or immediately when the
 * user prefers reduced motion — exactly like `MHF.reveal`.
 */
export function useInViewOnce(
  ref: RefObject<Element | null>,
  {
    options = REVEAL_OPTIONS,
    enabled = true,
  }: { options?: IntersectionObserverInit; enabled?: boolean } = {},
): boolean {
  const { reducedMotion } = useMotion();
  const [seen, setSeen] = useState(false);
  const { rootMargin, threshold } = options;

  useEffect(() => {
    const el = ref.current;
    if (!enabled || !el || seen || reducedMotion) return;
    return observeOnce(el, () => setSeen(true), { rootMargin, threshold });
  }, [ref, enabled, seen, reducedMotion, rootMargin, threshold]);

  return enabled && (seen || reducedMotion);
}
