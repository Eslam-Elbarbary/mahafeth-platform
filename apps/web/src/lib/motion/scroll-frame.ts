'use client';

import { useEffect, useRef } from 'react';

type ScrollFn = (y: number) => void;

/*
 * One rAF-throttled scroll/resize loop shared by every consumer (header state, hero fade,
 * to-top ring …) — port of `MHF.onScroll` from the legacy `site.js`.
 */
const listeners = new Set<ScrollFn>();
let queued = false;
let attached = false;

function run() {
  queued = false;
  const y = window.pageYOffset;
  listeners.forEach((fn) => {
    try {
      fn(y);
    } catch {}
  });
}

function schedule() {
  if (queued) return;
  queued = true;
  requestAnimationFrame(run);
}

function attach() {
  if (attached) return;
  attached = true;
  addEventListener('scroll', schedule, { passive: true });
  addEventListener('resize', schedule, { passive: true });
}

function detach() {
  if (!attached || listeners.size) return;
  attached = false;
  removeEventListener('scroll', schedule);
  removeEventListener('resize', schedule);
}

export function onScrollFrame(fn: ScrollFn): () => void {
  listeners.add(fn);
  attach();
  fn(window.pageYOffset);
  return () => {
    listeners.delete(fn);
    detach();
  };
}

export function useScrollFrame(fn: ScrollFn) {
  const ref = useRef(fn);
  useEffect(() => {
    ref.current = fn;
  });
  useEffect(() => onScrollFrame((y) => ref.current(y)), []);
}
