'use client';

import Image from 'next/image';
import { useEffect, useRef, type CSSProperties } from 'react';

import { ArrowButton } from '@/components/ui/ArrowButton';
import { Reveal } from '@/components/ui/Reveal';
import { SectionLabel } from '@/components/ui/SectionLabel';
import { SmartLink } from '@/components/ui/SmartLink';
import { StatusBadge } from '@/components/ui/StatusBadge';
import type { MediaAsset, ShowcaseContent, ShowcaseProject } from '@/content/types';
import { cx } from '@/lib/cx';
import { gsap, ScrollTrigger } from '@/lib/motion/gsap';
import { useMagnetic } from '@/lib/motion/magnetic';
import { useMotion } from '@/lib/motion/motion-provider';
import { useScrollTo } from '@/lib/motion/scroll-to';

import { SaudiMap } from './SaudiMap';

/* Reveal windows over progress 0..1: slide 0 is shown, the rest wipe in after a 22% lead. */
const LEAD = 0.22;
const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);
const pad2 = (v: number) => String(v).padStart(2, '0');

/* Stat values that are all years (e.g. "2027") are not counted up. */
const isYearOnly = (nums: number[]) => nums.every((v) => v >= 1900 && v <= 2100);

/** Writes to the React-owned text node in place so reconciliation keeps working. */
function setText(el: Element | null, text: string) {
  const node = el?.firstChild;
  if (node && node.nodeType === Node.TEXT_NODE) node.nodeValue = text;
}

type Window = { s: number; e: number };

function buildWindows(n: number): Window[] {
  const seg = (1 - LEAD) / Math.max(1, n - 1);
  const tr = seg * 0.62;
  return Array.from({ length: n }, (_, i) => {
    if (i === 0) return { s: 0, e: 0 };
    const s = LEAD + (i - 1) * seg;
    return { s, e: s + tr };
  });
}

/** `.pg__b` — `is-on` and the `--p` progress bar are written by the stack's scroll handler. */
function PagerButton({ index, name }: { index: number; name: string }) {
  const ref = useRef<HTMLButtonElement>(null);
  useMagnetic(ref);
  return (
    <button ref={ref} className="pg__b" type="button" data-i={index} aria-label={name}>
      <span className="pg__t">{name}</span>
      <span className="pg__bar">
        <i />
      </span>
    </button>
  );
}

type ProjectsShowcaseProps = {
  content: ShowcaseContent;
  /** Featured projects (`getFeaturedProjects`). */
  projects: ShowcaseProject[];
  badge: MediaAsset;
};

/**
 * Featured projects (legacy `stack()`): the viewport pins for 3.2 screens and each slide's curtain
 * (`--amt`) is scrubbed by scroll; pager bars (`--p`), active text and map pin follow.
 * Reduced motion falls back to a plain stacked list.
 */
export function ProjectsShowcase({ content, projects, badge }: ProjectsShowcaseProps) {
  const { reducedMotion } = useMotion();
  const scrollTo = useScrollTo();
  const stackRef = useRef<HTMLDivElement>(null);
  const vpRef = useRef<HTMLDivElement>(null);
  const { focusCity } = content;
  const n = projects.length;

  useEffect(() => {
    const stack = stackRef.current;
    const vp = vpRef.current;
    if (!stack || !vp || !n) return;
    const slides = Array.from(vp.querySelectorAll<HTMLElement>('.sl'));
    const bullets = Array.from(vp.querySelectorAll<HTMLButtonElement>('.pg__b'));
    const pins = Array.from(vp.querySelectorAll<SVGGElement>('.pin'));
    const countEl = vp.querySelector('.pg__n');
    const beacon = vp.querySelector<SVGGElement>('.map__beacon');
    const capEl = vp.querySelector('.map__cap b');
    const pinOf = new Map(content.pins.map((pin) => [pin.city, pin]));

    if (reducedMotion) {
      slides.forEach((s) => {
        s.classList.add('is-txt');
        s.style.setProperty('--amt', '1');
      });
      return;
    }

    const win = buildWindows(n);
    const own = (i: number) => ({ a: i === 0 ? 0 : win[i]!.s, b: i === n - 1 ? 1 : win[i + 1]!.s });
    let cur = -1;

    /* Stats of the incoming slide count up from zero; originals are restored on completion. */
    const counters = new Map<HTMLElement, { tween: gsap.core.Tween; text: string }>();
    const countUp = (slide: HTMLElement | undefined) => {
      slide?.querySelectorAll<HTMLElement>('.sl__kf dd > span').forEach((span) => {
        const prev = counters.get(span);
        prev?.tween.kill();
        const text = prev?.text ?? span.textContent ?? '';
        const nums = (text.match(/\d+/g) ?? []).map(Number);
        if (!nums.length || isYearOnly(nums)) return;
        const o = { t: 0 };
        const tween = gsap.to(o, {
          t: 1,
          duration: 1.2,
          delay: 0.25,
          ease: 'power3.out',
          onUpdate: () =>
            setText(
              span,
              text.replace(/\d+/g, (m) => String(Math.round(Number(m) * o.t))),
            ),
          onComplete: () => setText(span, text),
        });
        counters.set(span, { tween, text });
      });
    };

    const paint = (p: number) => {
      let act = 0;
      for (let i = 0; i < n; i++) {
        const w = win[i]!;
        const amt = i === 0 ? 1 : clamp01((p - w.s) / (w.e - w.s));
        slides[i]?.style.setProperty('--amt', amt.toFixed(4));
        /* The slide underneath recedes (scale + dim) while this one's curtain opens. */
        if (i > 0) slides[i - 1]?.style.setProperty('--out', amt.toFixed(4));
        if (amt >= 0.58) act = i;
        const o = own(i);
        bullets[i]?.style.setProperty('--p', clamp01((p - o.a) / (o.b - o.a)).toFixed(4));
      }
      if (act === cur) return;
      const first = cur === -1;
      cur = act;
      slides.forEach((s, k) => s.classList.toggle('is-txt', k === act));
      bullets.forEach((b, k) => b.classList.toggle('is-on', k === act));
      const city = focusCity ?? projects[act]?.city;
      pins.forEach((pin) => pin.classList.toggle('is-on', pin.dataset.city === city));
      setText(countEl, pad2(act + 1));
      const pin = city ? pinOf.get(city) : undefined;
      if (pin) {
        if (beacon) beacon.style.transform = `translate(${pin.x}px, ${pin.y}px)`;
        setText(capEl, pin.label);
      }
      if (!first) countUp(slides[act]);
    };

    const st = ScrollTrigger.create({
      trigger: stack,
      start: 'top top',
      end: () => `+=${Math.round(innerHeight * 3.2)}`,
      pin: vp,
      pinSpacing: true,
      anticipatePin: 1,
      invalidateOnRefresh: true,
      onUpdate: (self) => paint(self.progress),
      onRefresh: (self) => paint(self.progress),
    });
    paint(0);

    const goTo = (index: number) => {
      const i = Math.max(0, Math.min(n - 1, index));
      const target = i === 0 ? 0.05 : Math.min(0.98, win[i]!.e + 0.03);
      scrollTo(st.start + target * (st.end - st.start));
    };

    const onBullet = (e: MouseEvent) => goTo(Number((e.currentTarget as HTMLElement).dataset.i));
    bullets.forEach((b) => b.addEventListener('click', onBullet));

    /* Nav/footer/mega links with `data-go` scroll the pinned stack instead of jumping to #projects. */
    const onGo = (e: MouseEvent) => {
      const a = (e.target as Element | null)?.closest<HTMLAnchorElement>('a[data-go]');
      if (!a) return;
      const url = new URL(a.href, location.href);
      if (url.pathname !== location.pathname) return;
      e.preventDefault();
      goTo(Number(a.dataset.go));
    };
    document.addEventListener('click', onGo, true);

    return () => {
      document.removeEventListener('click', onGo, true);
      bullets.forEach((b) => b.removeEventListener('click', onBullet));
      st.kill(true);
      counters.forEach(({ tween, text }, span) => {
        tween.kill();
        setText(span, text);
      });
      slides.forEach((s) => {
        s.style.removeProperty('--amt');
        s.style.removeProperty('--out');
        s.classList.remove('is-txt');
      });
      bullets.forEach((b) => {
        b.style.removeProperty('--p');
        b.classList.remove('is-on');
      });
    };
  }, [reducedMotion, n, focusCity, projects, content.pins, scrollTo]);

  const initialCity = focusCity ?? projects[0]?.city ?? 'jeddah';

  return (
    <section className="show" id="projects">
      <div className="wrap show__hd">
        <div>
          <SectionLabel>{content.label}</SectionLabel>
          <Reveal as="h2" className="big" delay={90}>
            {content.title}
          </Reveal>
        </div>
        <ArrowButton reveal={180} href={content.cta.href}>
          {content.cta.label}
        </ArrowButton>
      </div>
      <div className={cx('stack', reducedMotion && 'is-plain')} id="stack" ref={stackRef}>
        <div className="stack__vp" id="stackVp" ref={vpRef}>
          {projects.map((project, i) => (
            <article
              key={project.slug}
              className="sl"
              data-i={i}
              data-city={project.city}
              style={{ '--i': i } as CSSProperties}
            >
              <div className="sl__stk">
                <div className="sl__img">
                  <Image
                    src={project.image.src}
                    alt={project.image.alt}
                    width={project.image.width}
                    height={project.image.height}
                    sizes="100vw"
                    style={
                      project.image.position
                        ? { objectPosition: project.image.position }
                        : undefined
                    }
                  />
                </div>
                <div className="sl__shade" aria-hidden="true" />
                <SmartLink
                  className="sl__link"
                  href={project.href}
                  aria-label={project.linkLabel}
                  data-cursor="explore"
                />
                <div className="sl__top">
                  <span className="sl__badge">
                    <Image
                      src={badge.src}
                      alt=""
                      width={badge.width}
                      height={badge.height}
                      sizes="48px"
                    />
                  </span>
                  <StatusBadge status={project.status} label={project.statusLabel} />
                </div>
                <div className="sl__name">
                  <h3>{project.name}</h3>
                  <p>{project.location}</p>
                  <span className="sl__cta" aria-hidden="true">
                    {content.exploreLabel}
                    <i />
                  </span>
                </div>
                <dl className="sl__kf">
                  {project.facts.map((fact) => (
                    <div key={fact.label}>
                      <dd>
                        <span>{fact.value}</span>
                        {fact.unit && <small>{fact.unit}</small>}
                      </dd>
                      <dt>{fact.label}</dt>
                    </div>
                  ))}
                </dl>
              </div>
            </article>
          ))}
          <div className="pg" id="pg" aria-label={content.pagerLabel}>
            <span className="pg__c" aria-hidden="true">
              <b className="pg__n">01</b>
              <span>/ {pad2(n)}</span>
            </span>
            {projects.map((project, i) => (
              <PagerButton key={project.slug} index={i} name={project.name} />
            ))}
          </div>
          <SaudiMap pins={content.pins} focusCity={focusCity} initialCity={initialCity} />
        </div>
      </div>
    </section>
  );
}
