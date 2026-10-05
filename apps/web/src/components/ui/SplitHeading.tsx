'use client';

import { Fragment, useRef, type ElementType } from 'react';

import { cx } from '@/lib/cx';
import { useInViewOnce } from '@/lib/motion/in-view';

const SPLIT_OPTIONS: IntersectionObserverInit = { threshold: 0.2 };
const WORD_STAGGER_MS = 70;

type Word = { text: string; delay: number };

function splitLines(lines: string[]): Word[][] {
  let index = 0;
  return lines.map((line) =>
    line
      .trim()
      .split(/\s+/)
      .map((text) => ({ text, delay: index++ * WORD_STAGGER_MS })),
  );
}

type SplitHeadingProps = {
  as?: ElementType;
  lines: string[];
  className?: string;
  id?: string;
};

/**
 * `[data-split]` heading (legacy `splitText`): every word is masked and rises in with a
 * 70ms stagger once the heading is 20% visible.
 */
export function SplitHeading({ as, lines, className, id }: SplitHeadingProps) {
  const Tag = as ?? 'h2';
  const ref = useRef<HTMLElement>(null);
  const shown = useInViewOnce(ref, { options: SPLIT_OPTIONS });
  const words = splitLines(lines);

  return (
    <Tag ref={ref} id={id} data-split="" className={cx(className, shown && 'is-in')}>
      {words.map((line, li) => (
        <Fragment key={li}>
          {li > 0 && <br />}
          {line.map((word, wi) => (
            <Fragment key={wi}>
              {wi > 0 && ' '}
              <span className="w">
                <span style={{ transitionDelay: `${word.delay}ms` }}>{word.text}</span>
              </span>
            </Fragment>
          ))}
        </Fragment>
      ))}
    </Tag>
  );
}
