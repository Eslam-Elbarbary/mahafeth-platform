'use client';

import { useRef, type ComponentPropsWithoutRef } from 'react';

import { cx } from '@/lib/cx';
import { useMagnetic } from '@/lib/motion/magnetic';

type PillProps = ComponentPropsWithoutRef<'button'> & {
  /** `.pill--fill` (brand green, magnetic). */
  fill?: boolean;
  /** `.pill--w` (full width). */
  block?: boolean;
};

export function Pill({ fill, block, className, type = 'button', ...rest }: PillProps) {
  const ref = useRef<HTMLButtonElement>(null);
  useMagnetic(ref, 0.2, !!fill);
  return (
    <button
      ref={ref}
      type={type}
      className={cx('pill', fill && 'pill--fill', block && 'pill--w', className)}
      {...rest}
    />
  );
}
