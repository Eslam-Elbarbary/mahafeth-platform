'use client';

import { useRef, type ComponentPropsWithoutRef } from 'react';

import { cx } from '@/lib/cx';
import { useMagnetic } from '@/lib/motion/magnetic';

type ChipProps = Omit<ComponentPropsWithoutRef<'button'>, 'aria-pressed'> & { pressed: boolean };

/** Single-select toggle chip (`aria-pressed` drives the filled state). */
export function Chip({ pressed, className, ...rest }: ChipProps) {
  const ref = useRef<HTMLButtonElement>(null);
  useMagnetic(ref, 0.14);
  return (
    <button
      ref={ref}
      type="button"
      className={cx('chip', className)}
      aria-pressed={pressed}
      {...rest}
    />
  );
}
