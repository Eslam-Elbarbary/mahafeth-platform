'use client';

import { useRef, type ComponentPropsWithoutRef, type ElementType } from 'react';

import { cx, withDelay } from '@/lib/cx';
import { useInViewOnce } from '@/lib/motion/in-view';

type RevealProps<T extends ElementType> = {
  as?: T;
  /** `s` = rise + scale (`.rv--s`), `r` = slide from the inline end (`.rv--r`). */
  variant?: 's' | 'r';
  /** `--d` transition delay in ms. */
  delay?: number;
  options?: IntersectionObserverInit;
} & Omit<ComponentPropsWithoutRef<T>, 'as'>;

/** `.rv` element that gains `.is-in` the first time it scrolls into view. */
export function Reveal<T extends ElementType = 'div'>({
  as,
  variant,
  delay,
  options,
  className,
  style,
  ...rest
}: RevealProps<T>) {
  const Tag = (as ?? 'div') as ElementType;
  const ref = useRef<HTMLElement>(null);
  const shown = useInViewOnce(ref, { options });
  return (
    <Tag
      ref={ref}
      className={cx('rv', variant && `rv--${variant}`, shown && 'is-in', className)}
      style={withDelay(style, delay)}
      {...rest}
    />
  );
}
