'use client';

import Image from 'next/image';
import {
  useCallback,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent,
  type PointerEvent,
} from 'react';

import { SectionHeader } from '@/components/page/SectionHeader';
import { ArrowIcon, ExpandIcon } from '@/components/ui/icons';
import { Reveal } from '@/components/ui/Reveal';
import type { ProjectDetailLabels, ProjectGalleryItem } from '@/content/types';
import { cx } from '@/lib/cx';
import { useLocale } from '@/lib/i18n/locale-provider';
import { useInViewOnce } from '@/lib/motion/in-view';

import { ProjectLightbox } from './ProjectLightbox';

const SWIPE_PX = 48;
const pad = (n: number) => String(n).padStart(2, '0');

/**
 * Main stage (AnimatedImage reveal: clip wipe + zoom-out + sweep) with cross-zooming slides,
 * thumbnail rail, swipe and arrow-key navigation, and a fullscreen lightbox.
 */
export function ProjectGallery({
  items,
  labels,
}: {
  items: ProjectGalleryItem[];
  labels: ProjectDetailLabels['gallery'];
}) {
  const { locale } = useLocale();
  const rtl = locale === 'ar';
  const [index, setIndex] = useState(0);
  const [open, setOpen] = useState(false);
  const [boxMounted, setBoxMounted] = useState(false);
  const stageRef = useRef<HTMLElement>(null);
  const shown = useInViewOnce(stageRef);
  const downX = useRef<number | null>(null);
  const moved = useRef(false);
  const count = items.length;

  const step = useCallback(
    (delta: 1 | -1) => setIndex((i) => (i + delta + count) % count),
    [count],
  );
  const close = useCallback(() => setOpen(false), []);
  const openBox = () => {
    setBoxMounted(true);
    // Mount first so the fade-in transition runs from the closed state.
    requestAnimationFrame(() => requestAnimationFrame(() => setOpen(true)));
  };

  const onKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'ArrowLeft') step(rtl ? 1 : -1);
    else if (e.key === 'ArrowRight') step(rtl ? -1 : 1);
    else return;
    e.preventDefault();
  };

  const onPointerDown = (e: PointerEvent) => {
    downX.current = e.clientX;
    moved.current = false;
  };
  const onPointerUp = (e: PointerEvent) => {
    if (downX.current === null) return;
    const dx = e.clientX - downX.current;
    downX.current = null;
    if (Math.abs(dx) < SWIPE_PX) return;
    moved.current = true;
    // Swiping toward the reading start reveals the next image.
    step(dx < 0 !== rtl ? 1 : -1);
  };
  const onStageClick = () => {
    if (moved.current) return;
    openBox();
  };

  if (count === 0) return null;
  const current = items[index];

  return (
    <section className="wrap sec pgal" id="gallery" aria-roledescription="carousel">
      <SectionHeader
        label={labels.label}
        titleLines={labels.title}
        action={
          <Reveal className="pgal__count ltr" delay={160} aria-hidden="true">
            <b>{pad(index + 1)}</b>
            <i />
            <span>{pad(count)}</span>
          </Reveal>
        }
      />
      <div className={cx('pgal__g', count < 2 && 'pgal__g--single')}>
        <figure
          ref={stageRef}
          className={cx('aimg sweep pgal__stage', shown && 'is-in')}
          data-cursor="view"
          tabIndex={0}
          aria-label={`${labels.open}: ${current?.caption ?? ''}`}
          onKeyDown={onKeyDown}
          onPointerDown={onPointerDown}
          onPointerUp={onPointerUp}
          onClick={onStageClick}
        >
          <div className="aimg__in">
            {items.map((item, i) => (
              <div
                key={item.image.src}
                className={cx('pgal__slide', i === index && 'is-on')}
                aria-hidden={i !== index}
              >
                <Image
                  src={item.image.src}
                  alt={item.image.alt}
                  fill
                  sizes="(max-width: 900px) 100vw, 72vw"
                  quality={80}
                  loading={i === 0 ? 'eager' : 'lazy'}
                  style={item.image.position ? { objectPosition: item.image.position } : undefined}
                />
              </div>
            ))}
          </div>
          <i className="pgal__shade" aria-hidden="true" />
          <figcaption className="pgal__cap" aria-live="polite">
            <span key={index}>{current?.caption}</span>
          </figcaption>
          <button
            type="button"
            className="pgal__btn pgal__open"
            aria-label={labels.open}
            onClick={(e) => {
              e.stopPropagation();
              openBox();
            }}
          >
            <ExpandIcon />
          </button>
          {count > 1 && (
            <div className="pgal__nav">
              <button
                type="button"
                className="pgal__btn pgal__prev"
                aria-label={labels.prev}
                onClick={(e) => {
                  e.stopPropagation();
                  step(-1);
                }}
              >
                <ArrowIcon />
              </button>
              <button
                type="button"
                className="pgal__btn pgal__next"
                aria-label={labels.next}
                onClick={(e) => {
                  e.stopPropagation();
                  step(1);
                }}
              >
                <ArrowIcon />
              </button>
            </div>
          )}
        </figure>

        {count > 1 && (
          <div className="pgal__thumbs" role="group" aria-label={labels.thumbs}>
            {items.map((item, i) => (
              <Reveal
                as="button"
                type="button"
                key={item.image.src}
                className={cx('pgal__thumb', i === index && 'is-on')}
                delay={220 + i * 90}
                style={{ '--i': i } as CSSProperties}
                aria-label={item.caption}
                aria-pressed={i === index}
                onClick={() => setIndex(i)}
              >
                <span className="pgal__tim">
                  <Image
                    src={item.image.src}
                    alt=""
                    fill
                    sizes="(max-width: 900px) 30vw, 18vw"
                    quality={60}
                    style={
                      item.image.position ? { objectPosition: item.image.position } : undefined
                    }
                  />
                </span>
                <span className="pgal__tl">
                  <b className="ltr">{pad(i + 1)}</b>
                  {item.caption}
                </span>
                <i className="pgal__prog" aria-hidden="true" />
              </Reveal>
            ))}
          </div>
        )}
      </div>

      {boxMounted && (
        <ProjectLightbox
          items={items}
          index={index}
          open={open}
          labels={labels}
          onClose={close}
          onStep={step}
          onSelect={setIndex}
        />
      )}
    </section>
  );
}
