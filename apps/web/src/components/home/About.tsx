'use client';

import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';

import { ArrowButton } from '@/components/ui/ArrowButton';
import { Reveal } from '@/components/ui/Reveal';
import { SectionLabel } from '@/components/ui/SectionLabel';
import { SplitHeading } from '@/components/ui/SplitHeading';
import type { AboutContent, MediaAsset } from '@/content/types';
import { cx } from '@/lib/cx';
import { gsap, ScrollTrigger } from '@/lib/motion/gsap';
import { useInViewOnce } from '@/lib/motion/in-view';
import { useMotion } from '@/lib/motion/motion-provider';

import { Figures } from './Figures';
import { StoryTimeline } from './StoryTimeline';

const COLS_OPTIONS: IntersectionObserverInit = { threshold: 0.12 };

function ParallaxFigure({
  image,
  variant,
  sizes,
}: {
  image: MediaAsset;
  variant: 'a' | 'b';
  sizes: string;
}) {
  return (
    <figure className={`pfm pfm--${variant} sweep`} data-par="1" data-cursor="view">
      <div className="pfm__in">
        <Image
          src={image.src}
          alt={image.alt}
          width={image.width}
          height={image.height}
          sizes={sizes}
          style={image.position ? { objectPosition: image.position } : undefined}
        />
      </div>
    </figure>
  );
}

/** About Mahafeth: split heading, parallax figures, expandable story timeline and animated figures. */
export function About({ content }: { content: AboutContent }) {
  const { reducedMotion } = useMotion();
  const colsRef = useRef<HTMLDivElement>(null);
  const colsIn = useInViewOnce(colsRef, { options: COLS_OPTIONS });
  const storyRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const hasStory = content.story.items.length > 0;

  useEffect(() => {
    const cols = colsRef.current;
    if (!cols || reducedMotion || innerWidth <= 1000) return;
    const ctx = gsap.context(() => {
      cols.querySelectorAll<HTMLElement>('.pfm').forEach((f) => {
        gsap.fromTo(
          f.querySelector('img'),
          { yPercent: -14 },
          {
            yPercent: 0,
            ease: 'none',
            scrollTrigger: { trigger: f, start: 'top bottom', end: 'bottom top', scrub: true },
          },
        );
      });
    }, cols);
    return () => ctx.revert();
  }, [reducedMotion]);

  const toggleStory = () => {
    const story = storyRef.current;
    if (!story) return;
    const wasOpen = !story.hidden;
    if (wasOpen) {
      if (reducedMotion) story.hidden = true;
      else
        gsap.to(story, {
          height: 0,
          opacity: 0,
          duration: 0.6,
          ease: 'power3.inOut',
          onComplete: () => {
            story.hidden = true;
            gsap.set(story, { clearProps: 'all' });
            ScrollTrigger.refresh();
          },
        });
    } else {
      story.hidden = false;
      if (!reducedMotion) {
        gsap.fromTo(
          story,
          { height: 0, opacity: 0 },
          {
            height: 'auto',
            opacity: 1,
            duration: 0.8,
            ease: 'power3.inOut',
            onComplete: () => {
              gsap.set(story, { clearProps: 'all' });
              ScrollTrigger.refresh();
            },
          },
        );
        gsap.fromTo(
          story.querySelectorAll('.tl li'),
          { y: 24, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            duration: 0.8,
            stagger: 0.1,
            delay: 0.25,
            ease: 'power3.out',
            clearProps: 'all',
          },
        );
      }
    }
    setOpen(!wasOpen);
  };

  return (
    <section className="about" id="about">
      <div className="wrap">
        <SectionLabel>{content.label}</SectionLabel>
        <div className="about__st">
          <SplitHeading className="about__h" lines={content.titleLines} />
          <div className={cx('about__cols', colsIn && 'is-in')} ref={colsRef}>
            <ParallaxFigure
              image={content.primaryImage}
              variant="a"
              sizes="(max-width: 1000px) 100vw, 50vw"
            />
            <div className="about__end">
              <ParallaxFigure
                image={content.secondaryImage}
                variant="b"
                sizes="(max-width: 1000px) 100vw, 30vw"
              />
              <Reveal as="p" className="lede">
                {content.lede}
              </Reveal>
              {hasStory && (
                <ArrowButton
                  reveal={120}
                  id="storyBtn"
                  aria-expanded={open}
                  aria-controls="story"
                  active={open}
                  onClick={toggleStory}
                >
                  {open ? content.less : content.more}
                </ArrowButton>
              )}
            </div>
          </div>
        </div>
        {hasStory && <StoryTimeline ref={storyRef} story={content.story} />}
        {content.figures.length > 0 && <Figures figures={content.figures} />}
      </div>
    </section>
  );
}
