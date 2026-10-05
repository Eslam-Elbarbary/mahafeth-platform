'use client';

import { useEffect, useRef } from 'react';

import { Reveal } from '@/components/ui/Reveal';
import type { FigureStat } from '@/content/types';
import { gsap } from '@/lib/motion/gsap';
import { observeOnce } from '@/lib/motion/in-view';
import { useMotion } from '@/lib/motion/motion-provider';

const COUNTER_OPTIONS: IntersectionObserverInit = { threshold: 0.5 };
const format = (n: number) => n.toLocaleString('en-US');

/** Counts from 0 to `value` over 2.2s once half visible (legacy `counters()`); writes the text node directly. */
export function Counter({ value, plus }: Pick<FigureStat, 'value' | 'plus'>) {
  const ref = useRef<HTMLElement>(null);
  const { reducedMotion } = useMotion();

  useEffect(() => {
    const el = ref.current;
    const text = el?.firstChild;
    if (!el || !text) return;
    const prefix = plus ? '+' : '';
    if (reducedMotion) {
      text.nodeValue = prefix + format(value);
      return;
    }
    let tween: gsap.core.Tween | undefined;
    const stop = observeOnce(
      el,
      () => {
        const o = { v: 0 };
        tween = gsap.to(o, {
          v: value,
          duration: 2.2,
          ease: 'power3.out',
          onUpdate: () => {
            text.nodeValue = prefix + format(Math.round(o.v));
          },
        });
      },
      COUNTER_OPTIONS,
    );
    return () => {
      stop();
      tween?.kill();
    };
  }, [value, plus, reducedMotion]);

  return (
    <b className="ltr" ref={ref}>
      0
    </b>
  );
}

export function Figures({ figures }: { figures: FigureStat[] }) {
  return (
    <div className="figs" id="figs">
      {figures.map((fig, i) => (
        <Reveal key={fig.label} className="fig" delay={i * 70}>
          <Counter {...fig} />
          <span>{fig.label}</span>
        </Reveal>
      ))}
    </div>
  );
}
