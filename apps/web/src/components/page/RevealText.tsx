'use client';

import { Fragment, useRef, type CSSProperties, type ElementType } from 'react';

import { cx } from '@/lib/cx';
import { useInViewOnce } from '@/lib/motion/in-view';

const TEXT_OPTIONS: IntersectionObserverInit = { rootMargin: '0px 0px -12% 0px', threshold: 0.2 };
/* Total stagger is capped so long paragraphs finish in about a second. */
const MAX_STAGGER_MS = 1100;
const WORD_MS = 28;

type RevealTextProps = {
  as?: ElementType;
  text: string;
  className?: string;
};

/**
 * Paragraph that "reads in": words go from a dim, lowered state to full ink with a short stagger
 * once 20% visible. Words stay whole, so Arabic letter joining is preserved.
 */
export function RevealText({ as, text, className }: RevealTextProps) {
  const Tag = as ?? 'p';
  const ref = useRef<HTMLElement>(null);
  const shown = useInViewOnce(ref, { options: TEXT_OPTIONS });
  const words = text.trim().split(/\s+/);
  const step = Math.min(WORD_MS, MAX_STAGGER_MS / Math.max(1, words.length));

  return (
    <Tag ref={ref} className={cx('rtx', shown && 'is-in', className)}>
      {words.map((word, i) => (
        <Fragment key={i}>
          {i > 0 && ' '}
          <span style={{ '--d': `${Math.round(i * step)}ms` } as CSSProperties}>{word}</span>
        </Fragment>
      ))}
    </Tag>
  );
}
