'use client';

import Image from 'next/image';
import { useCallback, useEffect, useRef, useState } from 'react';

import { Reveal } from '@/components/ui/Reveal';
import { SectionLabel } from '@/components/ui/SectionLabel';
import type { LeadershipContent, LeadershipMember } from '@/content/types';
import { cx } from '@/lib/cx';
import { useInViewOnce } from '@/lib/motion/in-view';
import { useMotion } from '@/lib/motion/motion-provider';

const Q_OPTIONS: IntersectionObserverInit = { threshold: 0.12 };
const WAS_MS = 950;
const DECISIVE_DRAG = 0.14;

/**
 * Leadership messages (legacy `quotes()`): a horizontal scroll-snap track with mouse drag,
 * keyboard arrows and dots; the portrait wipes to the speaker nearest the track centre.
 */
export function LeadershipQuotes({
  content,
  members,
}: {
  content: LeadershipContent;
  members: LeadershipMember[];
}) {
  const { reducedMotion } = useMotion();
  const qRef = useRef<HTMLDivElement>(null);
  const qIn = useInViewOnce(qRef, { options: Q_OPTIONS });
  const trackRef = useRef<HTMLDivElement>(null);
  const [cur, setCur] = useState(0);
  const [was, setWas] = useState<number[]>([]);
  const curRef = useRef(0);
  const timers = useRef(new Set<ReturnType<typeof setTimeout>>());
  const n = members.length;

  const setActive = useCallback((i: number) => {
    const old = curRef.current;
    if (i === old) return;
    curRef.current = i;
    setCur(i);
    setWas((w) => [...w.filter((x) => x !== old), old]);
    const t = setTimeout(() => {
      timers.current.delete(t);
      setWas((w) => w.filter((x) => x !== old));
    }, WAS_MS);
    timers.current.add(t);
  }, []);

  /* Move the track only — scrollIntoView would drag the page vertically too. */
  const goTo = useCallback(
    (index: number) => {
      const track = trackRef.current;
      if (!track || !n) return;
      const i = (index + n) % n;
      const item = track.children[i];
      if (!item) return;
      const tr = track.getBoundingClientRect();
      const it = item.getBoundingClientRect();
      const delta = it.left + it.width / 2 - (tr.left + tr.width / 2);
      track.scrollTo({
        left: track.scrollLeft + delta,
        behavior: reducedMotion ? 'auto' : 'smooth',
      });
    },
    [n, reducedMotion],
  );

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    const items = Array.from(track.children) as HTMLElement[];
    const pending = timers.current;
    const isRtl = () => document.documentElement.dir === 'rtl';

    const nearest = () => {
      const r = track.getBoundingClientRect();
      const cx = r.left + r.width / 2;
      let best = 0;
      let bd = Infinity;
      items.forEach((it, i) => {
        const b = it.getBoundingClientRect();
        const d = Math.abs(b.left + b.width / 2 - cx);
        if (d < bd) {
          bd = d;
          best = i;
        }
      });
      return best;
    };

    let raf = 0;
    const onScroll = () => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        setActive(nearest());
      });
    };

    /* Mouse drag (touch scrolls natively). Measure the nearest slide before snapping resumes. */
    let down = false;
    let sx = 0;
    let sl = 0;
    let moved = 0;
    let startIdx = 0;
    const onDown = (e: PointerEvent) => {
      if (e.pointerType === 'touch') return;
      down = true;
      sx = e.clientX;
      sl = track.scrollLeft;
      moved = 0;
      startIdx = curRef.current;
      track.classList.add('is-drag');
      try {
        track.setPointerCapture(e.pointerId);
      } catch {}
    };
    const onMove = (e: PointerEvent) => {
      if (!down) return;
      e.preventDefault();
      moved = e.clientX - sx;
      track.scrollLeft = sl - moved;
    };
    const release = () => {
      if (!down) return;
      down = false;
      const w = items[0] ? items[0].getBoundingClientRect().width : track.clientWidth;
      let target = nearest();
      /* A decisive swipe moves a whole slide even without crossing the middle. */
      if (Math.abs(moved) > w * DECISIVE_DRAG && target === startIdx) {
        target = startIdx + (moved > 0 ? 1 : -1) * (isRtl() ? 1 : -1);
      }
      target = Math.max(0, Math.min(items.length - 1, target));
      track.classList.remove('is-drag');
      goTo(target);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') {
        e.preventDefault();
        goTo(curRef.current + (isRtl() ? -1 : 1));
      }
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        goTo(curRef.current + (isRtl() ? 1 : -1));
      }
    };

    track.addEventListener('scroll', onScroll, { passive: true });
    track.addEventListener('pointerdown', onDown);
    track.addEventListener('pointermove', onMove);
    track.addEventListener('pointerup', release);
    track.addEventListener('pointercancel', release);
    track.addEventListener('lostpointercapture', release);
    track.addEventListener('keydown', onKey);
    return () => {
      cancelAnimationFrame(raf);
      track.removeEventListener('scroll', onScroll);
      track.removeEventListener('pointerdown', onDown);
      track.removeEventListener('pointermove', onMove);
      track.removeEventListener('pointerup', release);
      track.removeEventListener('pointercancel', release);
      track.removeEventListener('lostpointercapture', release);
      track.removeEventListener('keydown', onKey);
      pending.forEach(clearTimeout);
      pending.clear();
    };
  }, [goTo, setActive, n]);

  if (n === 0) return null;
  return (
    <section className="sec lead-q" id="leadership">
      <div className="wrap">
        <SectionLabel>{content.label}</SectionLabel>
        <Reveal as="h2" className="big" delay={90}>
          {content.title}
        </Reveal>
        <div className={cx('q', qIn && 'is-in')} id="q" ref={qRef}>
          <Reveal className="q__pics" variant="s" delay={120} data-cursor="view">
            {members.map((q, i) => (
              <figure
                key={q.id}
                className={cx('q__pic', i === cur && 'is-on', was.includes(i) && 'was')}
              >
                <Image
                  src={q.photo.src}
                  alt={q.photo.alt}
                  width={q.photo.width}
                  height={q.photo.height}
                  sizes="(max-width: 1000px) 100vw, 540px"
                />
              </figure>
            ))}
          </Reveal>
          <Reveal className="q__body" variant="r" delay={220}>
            <div
              className="q__ls"
              id="qTrack"
              ref={trackRef}
              tabIndex={0}
              role="group"
              aria-label={content.trackLabel}
            >
              {members.map((q, i) => (
                <blockquote key={q.id} className={cx('q__it', i === cur && 'is-on')}>
                  <p>{q.quote}</p>
                  <footer>
                    <b>{q.name}</b>
                    <span>{q.role}</span>
                  </footer>
                </blockquote>
              ))}
            </div>
            <div className="q__bar">
              <div className="q__dots" id="qDots" role="tablist" aria-label={content.dotsLabel}>
                {members.map((q, i) => (
                  <button
                    key={q.id}
                    type="button"
                    role="tab"
                    aria-label={`${content.dotLabel} ${i + 1}`}
                    className={cx(i === cur && 'is-on')}
                    onClick={() => goTo(i)}
                  />
                ))}
              </div>
              <span className="q__swipe" aria-hidden="true">
                <svg viewBox="0 0 24 16">
                  <path d="M9 3 3 8l6 5M15 3l6 5-6 5M3 8h18" />
                </svg>
                {content.swipeHint}
              </span>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
