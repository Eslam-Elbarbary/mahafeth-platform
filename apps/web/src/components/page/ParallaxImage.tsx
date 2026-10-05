'use client';

import Image from 'next/image';
import { useEffect, useRef, type CSSProperties } from 'react';

import type { MediaAsset } from '@/content/types';
import { cx } from '@/lib/cx';
import { gsap } from '@/lib/motion/gsap';
import { useInViewOnce } from '@/lib/motion/in-view';
import { useMotion } from '@/lib/motion/motion-provider';

type ParallaxImageProps = {
  image: MediaAsset;
  sizes: string;
  /** CSS aspect-ratio of the frame, e.g. `21/9`. */
  ratio?: string;
  /** Travel in percent of the image height (scrubbed over the frame's pass through the viewport). */
  strength?: number;
  caption?: string;
  className?: string;
};

/**
 * Framed image scrubbed by ScrollTrigger (same technique as the About figures): the oversized
 * image travels against the scroll while the frame reveals with a clip-path. Static under
 * reduced motion.
 */
export function ParallaxImage({
  image,
  sizes,
  ratio = '21/9',
  strength = 12,
  caption,
  className,
}: ParallaxImageProps) {
  const { reducedMotion } = useMotion();
  const ref = useRef<HTMLElement>(null);
  const shown = useInViewOnce(ref);

  useEffect(() => {
    const frame = ref.current;
    const img = frame?.querySelector('img');
    if (!frame || !img || reducedMotion) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(
        img,
        { yPercent: -strength },
        {
          yPercent: strength,
          ease: 'none',
          scrollTrigger: { trigger: frame, start: 'top bottom', end: 'bottom top', scrub: true },
        },
      );
    }, frame);
    return () => ctx.revert();
  }, [reducedMotion, strength]);

  return (
    <figure
      ref={ref}
      className={cx('pimg', shown && 'is-in', className)}
      style={{ '--ratio': ratio, '--travel': `${strength * 2}%` } as CSSProperties}
      data-cursor="view"
    >
      <div className="pimg__in">
        <Image
          src={image.src}
          alt={image.alt}
          width={image.width}
          height={image.height}
          sizes={sizes}
          style={image.position ? { objectPosition: image.position } : undefined}
        />
      </div>
      {caption && <figcaption className="pimg__cap">{caption}</figcaption>}
    </figure>
  );
}
