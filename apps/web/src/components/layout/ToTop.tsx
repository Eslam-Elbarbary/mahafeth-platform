'use client';

import { useRef, useState } from 'react';

import { cx } from '@/lib/cx';
import { useDictionary } from '@/lib/i18n/dictionary-provider';
import { useScrollFrame } from '@/lib/motion/scroll-frame';
import { useScrollTo } from '@/lib/motion/scroll-to';

/** Back-to-top button with a scroll-progress ring; appears after 700px. */
export function ToTop() {
  const dict = useDictionary();
  const scrollTo = useScrollTo();
  const [on, setOn] = useState(false);
  const ringRef = useRef<SVGCircleElement>(null);

  useScrollFrame((y) => {
    setOn(y > 700);
    const ring = ringRef.current;
    if (!ring) return;
    const h = document.documentElement.scrollHeight - innerHeight;
    ring.style.strokeDashoffset = String(1 - (h > 0 ? Math.min(1, y / h) : 0));
  });

  return (
    <button
      className={cx('totop', on && 'is-on')}
      id="totop"
      type="button"
      aria-label={dict.toTop}
      onClick={() => scrollTo(0)}
    >
      <svg className="totop__ring" viewBox="0 0 36 36" aria-hidden="true">
        <circle ref={ringRef} cx="18" cy="18" r="16.5" pathLength={1} />
      </svg>
      <svg viewBox="0 0 24 24">
        <path d="M12 19V6M6 12l6-6 6 6" />
      </svg>
    </button>
  );
}
