'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

import type { MediaAsset } from '@/content/types';
import { cx } from '@/lib/cx';
import { useDictionary } from '@/lib/i18n/dictionary-provider';
import { onFilmOpen } from '@/lib/overlays';

type FilmModalProps = {
  src: string;
  poster: MediaAsset;
  label: string;
};

/** Corporate film dialog (legacy `film()`): locks scroll, autoplays, Escape/backdrop close, restores focus. */
export function FilmModal({ src, poster, label }: FilmModalProps) {
  const dict = useDictionary();
  const [open, setOpen] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const openerRef = useRef<HTMLElement | null>(null);

  const close = useCallback(() => {
    setOpen(false);
    document.documentElement.classList.remove('no-scroll');
    videoRef.current?.pause();
    openerRef.current?.focus({ preventScroll: true });
  }, []);

  useEffect(
    () =>
      onFilmOpen(() => {
        openerRef.current = document.activeElement as HTMLElement | null;
        document.documentElement.classList.add('no-scroll');
        setOpen(true);
      }),
    [],
  );

  useEffect(() => {
    if (!open) return;
    videoRef.current?.play().catch(() => {});
    closeRef.current?.focus({ preventScroll: true });
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, close]);

  useEffect(() => () => document.documentElement.classList.remove('no-scroll'), []);

  return (
    <div className={cx('film', open && 'is-on')} id="film" aria-hidden={!open}>
      <div className="film__bd" id="filmBd" onClick={close} />
      <div className="film__box" role="dialog" aria-modal="true" aria-label={label}>
        <button
          className="film__x"
          id="filmX"
          ref={closeRef}
          type="button"
          aria-label={dict.film.close}
          onClick={close}
        >
          ✕
        </button>
        <video ref={videoRef} controls playsInline preload="none" poster={poster.src}>
          {src && <source src={src} type="video/mp4" />}
        </video>
      </div>
    </div>
  );
}
