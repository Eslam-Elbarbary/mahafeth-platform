'use client';

import Image from 'next/image';
import { useRef, type CSSProperties } from 'react';

import type { MediaAsset } from '@/content/types';
import { cx } from '@/lib/cx';
import { useInViewOnce } from '@/lib/motion/in-view';

type AnimatedImageProps = {
  image: MediaAsset;
  sizes: string;
  /** CSS aspect-ratio, e.g. `4/5`. Defaults to the image's own ratio. */
  ratio?: string;
  /** Reveal direction of the clip-path wipe. */
  from?: 'bottom' | 'start';
  className?: string;
  eager?: boolean;
  /** Cursor mode; pass `false` when a parent link sets its own. */
  cursor?: 'view' | false;
};

/**
 * Image with the site's reveal language: clip-path wipe, zoom-out from 1.16, a light sweep once
 * revealed, hover depth, and the "View" cursor.
 */
export function AnimatedImage({
  image,
  sizes,
  ratio,
  from = 'bottom',
  className,
  eager,
  cursor = 'view',
}: AnimatedImageProps) {
  const ref = useRef<HTMLElement>(null);
  const shown = useInViewOnce(ref);
  const style = { '--ratio': ratio ?? `${image.width}/${image.height}` } as CSSProperties;

  return (
    <figure
      ref={ref}
      className={cx('aimg sweep', from === 'start' && 'aimg--start', shown && 'is-in', className)}
      style={style}
      data-cursor={cursor || undefined}
    >
      <div className="aimg__in">
        <Image
          src={image.src}
          alt={image.alt}
          width={image.width}
          height={image.height}
          sizes={sizes}
          loading={eager ? 'eager' : 'lazy'}
          style={image.position ? { objectPosition: image.position } : undefined}
        />
      </div>
    </figure>
  );
}
