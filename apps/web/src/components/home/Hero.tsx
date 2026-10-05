'use client';

import Image from 'next/image';
import { useEffect, useRef } from 'react';

import { ArrowButton } from '@/components/ui/ArrowButton';
import { Coin3D } from '@/components/ui/Coin3D';
import { PlayIcon } from '@/components/ui/icons';
import type { HeroContent } from '@/content/types';
import { gsap } from '@/lib/motion/gsap';
import { onHeroReveal, registerHeroSlot } from '@/lib/motion/hero-bus';
import { useMagnetic } from '@/lib/motion/magnetic';
import { useMotion } from '@/lib/motion/motion-provider';
import { onScrollFrame } from '@/lib/motion/scroll-frame';
import { openFilm } from '@/lib/overlays';

const COIN_RY = -16;
const COIN_RX = 8;
const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);

/**
 * Fixed hero on the back stage: 3D coin (idle spin + pointer tilt), staggered content reveal
 * triggered by the intro, and the scroll-linked fade/scale as the sheet slides over it.
 */
export function Hero({ content }: { content: HeroContent }) {
  const { reducedMotion, finePointer } = useMotion();
  const heroRef = useRef<HTMLElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const slotRef = useRef<HTMLDivElement>(null);
  const coinRef = useRef<HTMLDivElement>(null);
  const coinInRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const hintRef = useRef<HTMLDivElement>(null);
  const bgRef = useRef<HTMLDivElement>(null);
  const bgInRef = useRef<HTMLDivElement>(null);
  const playRef = useRef<HTMLButtonElement>(null);
  useMagnetic(playRef);

  useEffect(() => {
    registerHeroSlot(slotRef.current);
    return () => registerHeroSlot(null);
  }, []);

  useEffect(() => {
    const hero = heroRef.current!;
    const coin = coinRef.current!;
    const title = titleRef.current!;
    const els = Array.from(hero.querySelectorAll<HTMLElement>('.rv'));
    let titleTimer: ReturnType<typeof setTimeout> | undefined;
    let revealed = false;

    const off = onHeroReveal((fast) => {
      gsap.set(coin, { opacity: 1 });
      hero.classList.add('is-lit');
      if (fast) {
        gsap.killTweensOf(els);
        els.forEach((e) => {
          e.style.opacity = '1';
          e.style.transform = 'none';
        });
        title.classList.add('is-in');
        revealed = true;
        return;
      }
      if (revealed) return;
      revealed = true;
      gsap.to(els, {
        opacity: 1,
        y: 0,
        duration: 1,
        stagger: 0.1,
        ease: 'power3.out',
        clearProps: 'transform',
      });
      titleTimer = setTimeout(() => title.classList.add('is-in'), 70);
    });

    return () => {
      off();
      clearTimeout(titleTimer);
      gsap.killTweensOf(els);
    };
  }, []);

  useEffect(() => {
    const coin = coinRef.current!;
    const coinIn = coinInRef.current!;
    gsap.set(coin, { rotationY: COIN_RY, rotationX: COIN_RX });
    if (reducedMotion) return;
    const spin = gsap.to(coinIn, {
      rotationY: 13,
      duration: 6,
      yoyo: true,
      repeat: -1,
      ease: 'sine.inOut',
    });
    if (!finePointer) return () => void spin.kill();

    const qy = gsap.quickTo(coin, 'rotationY', { duration: 1.1, ease: 'power3' });
    const qx = gsap.quickTo(coin, 'rotationX', { duration: 1.1, ease: 'power3' });
    /* Backdrop drifts against the pointer for depth (same listener, transforms only). */
    const bgIn = bgInRef.current;
    const qbx = bgIn ? gsap.quickTo(bgIn, 'x', { duration: 1.6, ease: 'power3' }) : null;
    const qby = bgIn ? gsap.quickTo(bgIn, 'y', { duration: 1.6, ease: 'power3' }) : null;
    let raf = 0;
    let mx = 0;
    let my = 0;
    const move = (e: PointerEvent) => {
      mx = e.clientX;
      my = e.clientY;
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        const nx = mx / innerWidth - 0.5;
        const ny = my / innerHeight - 0.5;
        qy(COIN_RY + nx * 30);
        qx(COIN_RX - ny * 20);
        qbx?.(nx * -26);
        qby?.(ny * -18);
      });
    };
    addEventListener('pointermove', move, { passive: true });
    return () => {
      spin.kill();
      cancelAnimationFrame(raf);
      removeEventListener('pointermove', move);
      gsap.killTweensOf(coin, 'rotationX,rotationY');
      if (bgIn) gsap.killTweensOf(bgIn, 'x,y');
    };
  }, [reducedMotion, finePointer]);

  useEffect(() => {
    const hero = heroRef.current!;
    const inner = innerRef.current!;
    const hint = hintRef.current;
    const bg = bgRef.current;
    let isOff = false;
    return onScrollFrame((y) => {
      const p = clamp01(y / (innerHeight || 1));
      const e = p * p;
      inner.style.opacity = String(Math.max(0, 1 - p * 1.5));
      inner.style.transform = `translate3d(0,${(-e * 88).toFixed(2)}px,0) scale(${(1 - e * 0.1).toFixed(4)})`;
      if (hint) hint.style.opacity = String(Math.max(0, 1 - p * 3.2));
      if (bg)
        bg.style.transform = `translate3d(0,${(p * 90).toFixed(2)}px,0) scale(${(1 + p * 0.08).toFixed(4)})`;
      const o = p >= 1;
      if (o !== isOff) {
        isOff = o;
        hero.classList.toggle('is-off', o);
      }
    });
  }, []);

  return (
    <section className="hero" id="hero" ref={heroRef} aria-label={content.label}>
      <div className="hero__bg" ref={bgRef} aria-hidden="true">
        <div className="hero__bgIn" ref={bgInRef}>
          <Image
            src={content.backdrop.src}
            alt=""
            width={content.backdrop.width}
            height={content.backdrop.height}
            sizes="100vw"
            quality={70}
            loading="eager"
            fetchPriority="high"
            style={
              content.backdrop.position ? { objectPosition: content.backdrop.position } : undefined
            }
          />
        </div>
        <i className="hero__shade" />
        <i className="hero__dust" />
      </div>
      <div className="hero__in" id="heroIn" ref={innerRef}>
        <div className="hero__logo" id="heroLogoSlot" ref={slotRef}>
          <Coin3D ref={coinRef} innerRef={coinInRef} />
          <i className="coin__halo" />
        </div>
        <p className="hero__eyebrow rv">{content.eyebrow}</p>
        <h1 className="hero__h rv" ref={titleRef}>
          {content.titleLines.map((line, i) => (
            <span key={i} className="ln">
              <span>{line}</span>
            </span>
          ))}
        </h1>
        <p className="hero__sub rv">{content.sub}</p>
        <div className="hero__cta rv">
          <ArrowButton tone="white" href={content.cta.href} go={content.cta.go}>
            {content.cta.label}
          </ArrowButton>
          <button className="vplay" id="playFilm" ref={playRef} type="button" onClick={openFilm}>
            <span className="vplay__p">
              <PlayIcon />
            </span>
            <span>{content.film.label}</span>
          </button>
        </div>
      </div>
      <div className="hero__hint" id="heroHint" ref={hintRef} aria-hidden="true">
        <i />
        <span>{content.hint}</span>
      </div>
    </section>
  );
}
