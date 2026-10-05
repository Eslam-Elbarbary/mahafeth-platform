'use client';

import { useGSAP } from '@gsap/react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

let registered = false;

/** Same ticker settings as the legacy `app.js`: uncapped fps (follows 120Hz+ displays) and lag smoothing. */
export function registerGsap() {
  if (registered || typeof window === 'undefined') return;
  gsap.registerPlugin(ScrollTrigger, useGSAP);
  gsap.ticker.fps(-1);
  gsap.ticker.lagSmoothing(1000, 16);
  registered = true;
}

registerGsap();

/** Batched `ScrollTrigger.refresh()` for anything that changes layout (accordions, fonts, locale). */
let refreshQueued = false;
export function refreshScrollTriggers() {
  if (refreshQueued || typeof window === 'undefined') return;
  refreshQueued = true;
  requestAnimationFrame(() => {
    refreshQueued = false;
    ScrollTrigger.refresh();
  });
}

export { gsap, ScrollTrigger, useGSAP };
