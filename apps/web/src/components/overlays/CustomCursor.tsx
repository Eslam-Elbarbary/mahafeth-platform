'use client';

import { useEffect, useRef, useState } from 'react';

import { ArrowUpRightIcon } from '@/components/ui/icons';
import { cx } from '@/lib/cx';
import { useDictionary } from '@/lib/i18n/dictionary-provider';
import { gsap } from '@/lib/motion/gsap';
import { useMotion } from '@/lib/motion/motion-provider';

type CursorKind = 'view' | 'explore' | 'click';
type CursorState = { on: boolean; kind: CursorKind };

/* Buttons get the compact "click" ring without needing a `data-cursor` attribute. */
const CLICKABLE = '.abtn, .hdr__cta, .vplay, .pill, .pg__b, .svc__btn';

function kindOf(target: EventTarget | null): CursorKind | null {
  if (!(target instanceof Element)) return null;
  const tagged = target.closest<HTMLElement>('[data-cursor]');
  if (tagged) {
    const kind = tagged.dataset.cursor;
    if (kind === 'view' || kind === 'explore' || kind === 'click') return kind;
  }
  return target.closest(CLICKABLE) ? 'click' : null;
}

/**
 * Frosted cursor that trails the pointer (fine pointers only). Its mode is derived from the
 * hovered element via one delegated `pointerover`: `[data-cursor="view|explore|click"]`, or
 * "click" for common buttons. The last kind is kept while fading out so the label doesn't flash.
 */
export function CustomCursor() {
  const ref = useRef<HTMLDivElement>(null);
  const { finePointer, reducedMotion } = useMotion();
  const { cursor: labels } = useDictionary();
  const [state, setState] = useState<CursorState>({ on: false, kind: 'explore' });
  const enabled = finePointer && !reducedMotion;

  useEffect(() => {
    const el = ref.current;
    if (!el || !enabled) return;
    const root = document.documentElement;
    root.classList.add('has-cur');
    const qx = gsap.quickTo(el, 'left', { duration: 0.35, ease: 'power3' });
    const qy = gsap.quickTo(el, 'top', { duration: 0.35, ease: 'power3' });
    let raf = 0;
    let px = 0;
    let py = 0;
    const move = (e: PointerEvent) => {
      px = e.clientX;
      py = e.clientY;
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        qx(px);
        qy(py);
      });
    };
    const over = (e: PointerEvent) => {
      const kind = kindOf(e.target);
      setState((prev) => {
        if (!kind) return prev.on ? { ...prev, on: false } : prev;
        return prev.on && prev.kind === kind ? prev : { on: true, kind };
      });
    };
    const out = (e: PointerEvent) => {
      if (!e.relatedTarget) setState((prev) => (prev.on ? { ...prev, on: false } : prev));
    };
    addEventListener('pointermove', move, { passive: true });
    document.addEventListener('pointerover', over, { passive: true });
    document.addEventListener('pointerout', out, { passive: true });
    return () => {
      cancelAnimationFrame(raf);
      removeEventListener('pointermove', move);
      document.removeEventListener('pointerover', over);
      document.removeEventListener('pointerout', out);
      root.classList.remove('has-cur');
      gsap.killTweensOf(el);
    };
  }, [enabled]);

  return (
    <div
      className={cx('cur', `cur--${state.kind}`, enabled && state.on && 'is-on')}
      id="cur"
      ref={ref}
      aria-hidden="true"
    >
      <span className="cur__t">{labels[state.kind]}</span>
      {state.kind === 'explore' && <ArrowUpRightIcon />}
    </div>
  );
}
