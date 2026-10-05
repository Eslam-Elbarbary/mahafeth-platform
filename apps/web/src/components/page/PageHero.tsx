'use client';

import Image from 'next/image';
import { useEffect, useRef, useState, type ReactNode } from 'react';

import { SmartLink } from '@/components/ui/SmartLink';
import type { PageHeroContent } from '@/content/types';
import { cx } from '@/lib/cx';
import { gsap } from '@/lib/motion/gsap';
import { useMotion } from '@/lib/motion/motion-provider';
import { onScrollFrame } from '@/lib/motion/scroll-frame';

/* Lets the page-transition curtain start lifting before the title rises. */
const REVEAL_DELAY_MS = 380;
const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);

type PageHeroProps = {
  content: PageHeroContent;
  crumbs: { home: string; current: string; parent?: { label: string; href: string } };
  scrollHint?: string;
  /** Oversized outline figure behind the heading (the 404 page). */
  mark?: string;
  /** Extra content under the lede (status badge, facts, CTA …). */
  children?: ReactNode;
};

/**
 * Cinematic opening for internal pages — the home hero's language at page scale: background media
 * with a dark shade, green glow and drifting dust, masked title lines that rise in (`.is-in`), and
 * the same scroll parallax (media drifts down and zooms, content lifts and fades) plus pointer drift.
 */
export function PageHero({ content, crumbs, scrollHint, mark, children }: PageHeroProps) {
  const { reducedMotion, finePointer } = useMotion();
  const ref = useRef<HTMLElement>(null);
  const bgRef = useRef<HTMLDivElement>(null);
  const bgInRef = useRef<HTMLDivElement>(null);
  const inRef = useRef<HTMLDivElement>(null);
  const [lit, setLit] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setLit(true), reducedMotion ? 0 : REVEAL_DELAY_MS);
    return () => clearTimeout(t);
  }, [reducedMotion]);

  useEffect(() => {
    const hero = ref.current;
    const bg = bgRef.current;
    const inner = inRef.current;
    if (!hero || !bg || !inner || reducedMotion) return;
    const off = onScrollFrame((y) => {
      const p = clamp01(y / (hero.offsetHeight || 1));
      bg.style.transform = `translate3d(0,${(p * 120).toFixed(2)}px,0) scale(${(1 + p * 0.08).toFixed(4)})`;
      inner.style.opacity = String(Math.max(0, 1 - p * 1.6));
      inner.style.transform = `translate3d(0,${(-p * p * 80).toFixed(2)}px,0)`;
      hero.style.setProperty('--hp', p.toFixed(3));
    });
    return () => {
      off();
      hero.style.removeProperty('--hp');
      bg.style.removeProperty('transform');
      inner.style.removeProperty('opacity');
      inner.style.removeProperty('transform');
    };
  }, [reducedMotion]);

  useEffect(() => {
    const bgIn = bgInRef.current;
    if (!bgIn || reducedMotion || !finePointer) return;
    const qx = gsap.quickTo(bgIn, 'x', { duration: 1.6, ease: 'power3' });
    const qy = gsap.quickTo(bgIn, 'y', { duration: 1.6, ease: 'power3' });
    let raf = 0;
    let mx = 0;
    let my = 0;
    const move = (e: PointerEvent) => {
      mx = e.clientX;
      my = e.clientY;
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        qx((mx / innerWidth - 0.5) * -24);
        qy((my / innerHeight - 0.5) * -16);
      });
    };
    addEventListener('pointermove', move, { passive: true });
    return () => {
      cancelAnimationFrame(raf);
      removeEventListener('pointermove', move);
      gsap.killTweensOf(bgIn, 'x,y');
    };
  }, [reducedMotion, finePointer]);

  const { media } = content;

  return (
    <section className={cx('phero', lit && 'is-in')} ref={ref}>
      <div className="phero__bg" ref={bgRef} aria-hidden="true">
        <div className="phero__bgIn" ref={bgInRef}>
          <Image
            src={media.src}
            alt=""
            fill
            sizes="100vw"
            quality={72}
            loading="eager"
            fetchPriority="high"
            style={media.position ? { objectPosition: media.position } : undefined}
          />
        </div>
        <i className="phero__shade" />
        <i className="phero__dust" />
      </div>

      <div className="wrap phero__in" ref={inRef}>
        {mark && (
          <span className="phero__mark" aria-hidden="true">
            {mark}
          </span>
        )}
        <nav className="phero__crumbs" aria-label={crumbs.home}>
          <SmartLink href="/">{crumbs.home}</SmartLink>
          {crumbs.parent && (
            <>
              <i aria-hidden="true" />
              <SmartLink href={crumbs.parent.href}>{crumbs.parent.label}</SmartLink>
            </>
          )}
          <i aria-hidden="true" />
          <span aria-current="page">{crumbs.current}</span>
        </nav>
        {content.eyebrow && <p className="phero__eyebrow">{content.eyebrow}</p>}
        <h1 className="phero__h">
          {content.titleLines.map((line, i) => (
            <span key={i} className="ln">
              <span>{line}</span>
            </span>
          ))}
        </h1>
        {content.lede && <p className="phero__lede">{content.lede}</p>}
        {children && <div className="phero__extra">{children}</div>}
      </div>

      {scrollHint && (
        <div className="phero__hint" aria-hidden="true">
          <i />
          <span>{scrollHint}</span>
        </div>
      )}
    </section>
  );
}
