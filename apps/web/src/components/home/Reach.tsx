'use client';

import { useEffect, useRef, useState } from 'react';

import { ArrowButton } from '@/components/ui/ArrowButton';
import { ArrowIcon } from '@/components/ui/icons';
import { Reveal } from '@/components/ui/Reveal';
import { SectionLabel } from '@/components/ui/SectionLabel';
import type { ReachContent, ReachItem } from '@/content/types';
import { cx } from '@/lib/cx';
import { observeOnce } from '@/lib/motion/in-view';
import { useMagnetic } from '@/lib/motion/magnetic';
import { useMotion } from '@/lib/motion/motion-provider';

import { REACH_FIGURES } from './ReachFigures';

const SECTION_OPTIONS: IntersectionObserverInit = { threshold: 0.25 };
const HOVER_DELAY_MS = 90;

function ReachCard({
  item,
  index,
  active,
  onSelect,
  onHover,
}: {
  item: ReachItem;
  index: number;
  active: boolean;
  onSelect: () => void;
  onHover?: () => void;
}) {
  const ref = useRef<HTMLButtonElement>(null);
  useMagnetic(ref, 0.08);
  return (
    <button
      ref={ref}
      className={cx('rcard', active && 'is-on')}
      type="button"
      data-k={item.key}
      data-i={index}
      aria-pressed={active}
      onClick={onSelect}
      onMouseEnter={onHover}
    >
      <span className="rcard__go">
        <ArrowIcon />
      </span>
      <span className="rcard__t">{item.title}</span>
    </button>
  );
}

/**
 * "Tell us your interests" (legacy `reach()`): cards swap the copy (with the `is-sw` re-entry
 * animation), the line illustration and the CTA's pre-selected interest. Illustrations start
 * drawing once the section is a quarter visible.
 */
export function Reach({ content }: { content: ReachContent }) {
  const { finePointer } = useMotion();
  const sectionRef = useRef<HTMLElement>(null);
  const [cur, setCur] = useState(0);
  const curRef = useRef(0);
  const [switched, setSwitched] = useState(false);
  const [figsOn, setFigsOn] = useState(false);
  const hoverTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const item = content.items[cur];

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const stop = observeOnce(el, () => setFigsOn(true), SECTION_OPTIONS);
    return () => {
      stop();
      clearTimeout(hoverTimer.current);
    };
  }, []);

  const select = (i: number) => {
    if (i === curRef.current) return;
    curRef.current = i;
    setCur(i);
    setSwitched(true);
  };

  const hover = (i: number) => {
    clearTimeout(hoverTimer.current);
    hoverTimer.current = setTimeout(() => select(i), HOVER_DELAY_MS);
  };

  return (
    <section className="reach" id="contact" ref={sectionRef}>
      <div className="wrap">
        <div className="reach__hd">
          <SectionLabel>{content.label}</SectionLabel>
          <Reveal as="h2" className="big" delay={90}>
            {content.title}
          </Reveal>
        </div>
        <div className="reach__g">
          <Reveal className={cx('reach__c', switched && 'is-sw')} delay={150} id="reachContent">
            {item && (
              <>
                <h3 id="reachT" key={`t${cur}`}>
                  {item.title}
                </h3>
                <p id="reachD" key={`d${cur}`}>
                  {item.body}
                </p>
                <ArrowButton href="#interest" id="reachBtn" interest={item.key}>
                  {item.button}
                </ArrowButton>
              </>
            )}
          </Reveal>
          <Reveal className="reach__fig" variant="s" delay={220} id="reachFig">
            {content.items.map((it, i) => (
              <svg
                key={it.key}
                className={cx('rfig', figsOn && i === cur && 'is-on')}
                data-i={i}
                viewBox="0 0 200 200"
                aria-hidden="true"
              >
                <g className="rfig__g">{REACH_FIGURES[it.key]}</g>
              </svg>
            ))}
          </Reveal>
          <Reveal className="reach__cards" delay={290} id="reachCards">
            {content.items.map((it, i) => (
              <ReachCard
                key={it.key}
                item={it}
                index={i}
                active={i === cur}
                onSelect={() => select(i)}
                onHover={finePointer ? () => hover(i) : undefined}
              />
            ))}
          </Reveal>
        </div>
      </div>
    </section>
  );
}
