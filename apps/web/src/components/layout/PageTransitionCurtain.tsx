'use client';

import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useRef } from 'react';

import type { MediaAsset } from '@/content/types';
import { REDUCED_MOTION_QUERY } from '@/lib/motion/media';

const COVER_MS = 620;
const REVEAL_MS = 1000;

function reveal(el: HTMLElement, timers: Set<ReturnType<typeof setTimeout>>) {
  requestAnimationFrame(() =>
    requestAnimationFrame(() => {
      document.documentElement.classList.remove('pt-cover');
      el.classList.remove('is-in');
      el.classList.add('is-out');
      const t = setTimeout(() => {
        el.classList.remove('is-out');
        timers.delete(t);
      }, REVEAL_MS);
      timers.add(t);
    }),
  );
}

/**
 * Black curtain with the seal between pages (legacy `pageTransition`): internal links to another
 * page slide it up over 620ms, navigate, then it lifts away on the new route. First paint after a
 * hard navigation is covered via `html.pt-cover` (set by the boot script).
 */
export function PageTransitionCurtain({ seal }: { seal: MediaAsset }) {
  const ref = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const pathname = usePathname();
  const timers = useRef(new Set<ReturnType<typeof setTimeout>>());

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const pending = timers.current;
    const root = document.documentElement;
    if (root.classList.contains('pt-cover') || el.classList.contains('is-in')) {
      if (matchMedia(REDUCED_MOTION_QUERY).matches) {
        root.classList.remove('pt-cover');
        el.classList.remove('is-in');
      } else reveal(el, pending);
    }
  }, [pathname]);

  useEffect(() => {
    const el = ref.current;
    const pending = timers.current;
    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey)
        return;
      const a = (e.target as Element | null)?.closest<HTMLAnchorElement>('a[href]');
      if (!a || !el || a.target === '_blank' || a.hasAttribute('download')) return;
      const url = new URL(a.href, location.href);
      if (url.origin !== location.origin || url.pathname === location.pathname) return;
      if (matchMedia(REDUCED_MOTION_QUERY).matches) return;
      e.preventDefault();
      el.classList.add('is-in');
      const t = setTimeout(() => {
        pending.delete(t);
        router.push(`${url.pathname}${url.search}${url.hash}`);
      }, COVER_MS);
      pending.add(t);
    };
    document.addEventListener('click', onClick, true);
    return () => {
      document.removeEventListener('click', onClick, true);
      pending.forEach(clearTimeout);
      pending.clear();
    };
  }, [router]);

  return (
    <div className="pt" id="pt" ref={ref} aria-hidden="true">
      <Image src={seal.src} alt="" width={seal.width} height={seal.height} />
    </div>
  );
}
