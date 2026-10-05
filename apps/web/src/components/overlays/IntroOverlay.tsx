'use client';

import { Fragment, useEffect, useRef, useState } from 'react';

import { Coin3D } from '@/components/ui/Coin3D';
import type { IntroContent } from '@/content/types';
import { gsap, ScrollTrigger } from '@/lib/motion/gsap';
import { getHeroSlot, requestHeroReveal } from '@/lib/motion/hero-bus';
import { REDUCED_MOTION_QUERY } from '@/lib/motion/media';

const FONT_FALLBACK_MS = 1100;
const SCROLL_LOCK_SAFETY_MS = 6500;

function releaseScroll() {
  const root = document.documentElement;
  root.classList.remove('no-scroll');
  root.removeAttribute('data-intro');
}

/**
 * First-visit intro (legacy `intro()`): ring draws, the coin unmasks and settles, the name rises,
 * then the coin flies into the hero logo slot while the black box slides up. Gated by
 * `html[data-intro="1"]`, which the boot script sets once per session (never with reduced motion).
 */
export function IntroOverlay({ words }: IntroContent) {
  const [done, setDone] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);
  const slotRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<SVGSVGElement>(null);
  const coinRef = useRef<HTMLDivElement>(null);
  const nameRef = useRef<HTMLDivElement>(null);
  const lineRef = useRef<HTMLElement>(null);
  const flyerRef = useRef<HTMLDivElement>(null);
  const flyCoinRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = document.documentElement;
    const safety = setTimeout(() => {
      if (
        !document.body.classList.contains('menu-open') &&
        !document.querySelector('.film.is-on, .pm.is-on')
      ) {
        root.classList.remove('no-scroll');
      }
    }, SCROLL_LOCK_SAFETY_MS);

    if (root.getAttribute('data-intro') !== '1' || matchMedia(REDUCED_MOTION_QUERY).matches) {
      releaseScroll();
      requestHeroReveal(true);
      ScrollTrigger.refresh();
      return () => clearTimeout(safety);
    }

    const flyerEl = flyerRef.current;
    const flyCoinEl = flyCoinRef.current;
    let cancelled = false;
    let started = false;
    let ctx: gsap.Context | undefined;

    const run = () => {
      if (started || cancelled) return;
      started = true;
      try {
        sessionStorage.setItem('mhf-seen', '1');
      } catch {}

      const box = boxRef.current!;
      const slot = slotRef.current!;
      const ring = ringRef.current!;
      const coin = coinRef.current!;
      const name = nameRef.current!;
      const line = lineRef.current!;
      const flyer = flyerRef.current!;
      const flyCoin = flyCoinRef.current!;

      ctx = gsap.context(() => {
        const wordEls = name.querySelectorAll('.w > span');
        gsap.set(wordEls, { y: 0, yPercent: 115, opacity: 0 });
        gsap.set(coin, {
          opacity: 0,
          clipPath: 'circle(0% at 50% 50%)',
          rotationY: -38,
          rotationX: 6,
          scale: 0.82,
        });

        gsap
          .timeline({ defaults: { ease: 'power3.out' } })
          .to(ring, { strokeDashoffset: 0, duration: 1.15, ease: 'power2.inOut' }, 0)
          .to(coin, { opacity: 1, duration: 0.45 }, 0.18)
          .to(
            coin,
            {
              clipPath: 'circle(52% at 50% 50%)',
              rotationY: 0,
              rotationX: 0,
              scale: 1,
              duration: 1.2,
            },
            0.18,
          )
          .to(wordEls, { yPercent: 0, opacity: 1, duration: 0.8, stagger: 0.09 }, 0.82)
          .to(line, { scaleX: 1, duration: 0.85, ease: 'power3.inOut' }, 1.08)
          .addLabel('out', 2.8)
          .to([name, line, ring], { opacity: 0, y: -12, duration: 0.42, ease: 'power2.in' }, 'out')
          /* Fly to the hero logo slot: transforms only, no relayout. */
          .add(() => {
            const heroSlot = getHeroSlot();
            if (!heroSlot) return;
            const a = slot.getBoundingClientRect();
            const b = heroSlot.getBoundingClientRect();
            gsap.set(flyer, {
              left: a.left,
              top: a.top,
              width: a.width,
              height: a.height,
              opacity: 1,
              x: 0,
              y: 0,
              scale: 1,
            });
            gsap.set(flyCoin, { opacity: 1, rotationY: 0, rotationX: 0 });
            gsap.set(coin, { opacity: 0 });
            gsap.to(flyer, {
              x: b.left + b.width / 2 - (a.left + a.width / 2),
              y: b.top + b.height / 2 - (a.top + a.height / 2),
              scale: b.width / a.width,
              duration: 1.15,
              ease: 'expo.inOut',
            });
            gsap.to(flyCoin, { rotationY: -16, rotationX: 8, duration: 1.15, ease: 'expo.inOut' });
          }, 'out+=.08')
          .to(box, { yPercent: -100, duration: 1.05, ease: 'expo.inOut' }, 'out+=.12')
          .add(() => requestHeroReveal(false), 'out+=.5')
          .add(() => {
            gsap.set(flyer, { opacity: 0 });
            releaseScroll();
            ScrollTrigger.refresh();
            setDone(true);
          }, 'out+=1.28');
      });
    };

    void document.fonts?.ready.then(run);
    const fallback = setTimeout(run, FONT_FALLBACK_MS);

    return () => {
      cancelled = true;
      clearTimeout(safety);
      clearTimeout(fallback);
      if (!started) return;
      gsap.killTweensOf([flyerEl, flyCoinEl]);
      ctx?.revert();
      releaseScroll();
      requestHeroReveal(true);
    };
  }, []);

  if (done) return null;

  return (
    <>
      <div className="intro" id="intro" ref={boxRef} aria-hidden="true">
        <div className="intro__in">
          <div className="intro__slot" id="introSlot" ref={slotRef}>
            <svg
              className="intro__ring"
              id="introRing"
              ref={ringRef}
              viewBox="0 0 100 100"
              aria-hidden="true"
            >
              <circle cx="50" cy="50" r="48" pathLength="1" />
            </svg>
            <Coin3D ref={coinRef} />
          </div>
          <div className="intro__name" id="introName" ref={nameRef}>
            {words.map((word, i) => (
              <Fragment key={i}>
                {i > 0 && ' '}
                <span className="w">
                  <span>{word}</span>
                </span>
              </Fragment>
            ))}
          </div>
          <i className="intro__line" id="introLine" ref={lineRef} />
        </div>
      </div>
      <div className="flyer" id="flyer" ref={flyerRef} aria-hidden="true">
        <Coin3D ref={flyCoinRef} />
      </div>
    </>
  );
}
