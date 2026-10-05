'use client';

import { useEffect, type RefObject } from 'react';

import { gsap } from './gsap';
import { useMotion } from './motion-provider';

/**
 * Magnetic hover (legacy `MHF.magnetic`): the element drifts toward the pointer by `strength`
 * of the offset from its centre. Fine pointers only, never under reduced motion.
 * Legacy strengths: `.rcard` .08, `.chip` .14, everything else .2.
 */
export function useMagnetic(ref: RefObject<HTMLElement | null>, strength = 0.2, enabled = true) {
  const { finePointer, reducedMotion } = useMotion();

  useEffect(() => {
    const el = ref.current;
    if (!el || !enabled || !finePointer || reducedMotion) return;
    const qx = gsap.quickTo(el, 'x', { duration: 0.55, ease: 'power3' });
    const qy = gsap.quickTo(el, 'y', { duration: 0.55, ease: 'power3' });
    let raf = 0;
    let ex = 0;
    let ey = 0;
    const move = (e: PointerEvent) => {
      ex = e.clientX;
      ey = e.clientY;
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        const r = el.getBoundingClientRect();
        qx((ex - (r.left + r.width / 2)) * strength);
        qy((ey - (r.top + r.height / 2)) * strength);
      });
    };
    const leave = () => {
      qx(0);
      qy(0);
    };
    el.addEventListener('pointermove', move);
    el.addEventListener('pointerleave', leave);
    return () => {
      cancelAnimationFrame(raf);
      el.removeEventListener('pointermove', move);
      el.removeEventListener('pointerleave', leave);
      gsap.killTweensOf(el, 'x,y');
      gsap.set(el, { clearProps: 'x,y' });
    };
  }, [ref, strength, enabled, finePointer, reducedMotion]);
}
