'use client';

import Image from 'next/image';
import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

import { ArrowIcon, CloseIcon } from '@/components/ui/icons';
import type { ProjectDetailLabels, ProjectGalleryItem } from '@/content/types';
import { cx } from '@/lib/cx';
import { useLocale } from '@/lib/i18n/locale-provider';

const pad = (n: number) => String(n).padStart(2, '0');

type ProjectLightboxProps = {
  items: ProjectGalleryItem[];
  index: number;
  open: boolean;
  labels: ProjectDetailLabels['gallery'];
  onClose: () => void;
  onStep: (delta: 1 | -1) => void;
  onSelect: (index: number) => void;
};

/**
 * Fullscreen gallery dialog (same contract as the film modal): locks scroll, Escape/backdrop
 * close, arrow keys follow reading direction, focus moves in and is restored on close.
 * Portalled to `<body>` because `.page__body` is its own stacking context; client-only, so the
 * parent mounts it after the first open.
 */
export function ProjectLightbox({
  items,
  index,
  open,
  labels,
  onClose,
  onStep,
  onSelect,
}: ProjectLightboxProps) {
  const { locale } = useLocale();
  const closeRef = useRef<HTMLButtonElement>(null);
  const openerRef = useRef<HTMLElement | null>(null);
  const item = items[index];

  useEffect(() => {
    if (!open) return;
    const root = document.documentElement;
    openerRef.current = document.activeElement as HTMLElement | null;
    root.classList.add('no-scroll');
    closeRef.current?.focus({ preventScroll: true });
    const rtl = locale === 'ar';
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      else if (e.key === 'ArrowLeft') onStep(rtl ? 1 : -1);
      else if (e.key === 'ArrowRight') onStep(rtl ? -1 : 1);
    };
    document.addEventListener('keydown', onKey);
    const opener = openerRef;
    return () => {
      document.removeEventListener('keydown', onKey);
      root.classList.remove('no-scroll');
      opener.current?.focus({ preventScroll: true });
    };
  }, [open, locale, onClose, onStep]);

  return createPortal(
    <div className={cx('plb', open && 'is-on')} aria-hidden={!open}>
      <div className="plb__bd" onClick={onClose} />
      <div className="plb__box" role="dialog" aria-modal="true" aria-label={labels.label}>
        <div className="plb__top">
          <span className="plb__count ltr">
            {pad(index + 1)} <i>/</i> {pad(items.length)}
          </span>
          <button
            ref={closeRef}
            className="plb__btn plb__x"
            type="button"
            aria-label={labels.close}
            tabIndex={open ? 0 : -1}
            onClick={onClose}
          >
            <CloseIcon />
          </button>
        </div>
        <figure className="plb__fig">
          {open && item && (
            <Image
              key={item.image.src}
              className="plb__img"
              src={item.image.src}
              alt={item.image.alt}
              fill
              sizes="100vw"
              quality={85}
            />
          )}
        </figure>
        <div className="plb__bar">
          <button
            className="plb__btn plb__prev"
            type="button"
            aria-label={labels.prev}
            tabIndex={open ? 0 : -1}
            onClick={() => onStep(-1)}
          >
            <ArrowIcon />
          </button>
          <p className="plb__cap" aria-live="polite">
            {item?.caption}
          </p>
          <div className="plb__dots">
            {items.map((it, i) => (
              <button
                key={it.image.src}
                type="button"
                className={cx(i === index && 'is-on')}
                aria-label={it.caption}
                aria-current={i === index || undefined}
                tabIndex={open ? 0 : -1}
                onClick={() => onSelect(i)}
              />
            ))}
          </div>
          <button
            className="plb__btn plb__next"
            type="button"
            aria-label={labels.next}
            tabIndex={open ? 0 : -1}
            onClick={() => onStep(1)}
          >
            <ArrowIcon />
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
