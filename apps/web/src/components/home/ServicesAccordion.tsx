'use client';

import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';

import { ArrowButton } from '@/components/ui/ArrowButton';
import { Reveal } from '@/components/ui/Reveal';
import { SectionLabel } from '@/components/ui/SectionLabel';
import { SplitHeading } from '@/components/ui/SplitHeading';
import type { ServiceItem, ServicesContent } from '@/content/types';
import { cx } from '@/lib/cx';
import { ScrollTrigger } from '@/lib/motion/gsap';

const REFRESH_AFTER_MS = 650;

/** Services as a single-open accordion (legacy `services()`); ScrollTrigger re-measures after the 650ms expand. */
export function ServicesAccordion({
  content,
  items,
}: {
  content: ServicesContent;
  items: ServiceItem[];
}) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const refreshTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => () => clearTimeout(refreshTimer.current), []);

  const toggle = (i: number) => {
    setOpenIndex((cur) => (cur === i ? null : i));
    clearTimeout(refreshTimer.current);
    refreshTimer.current = setTimeout(() => ScrollTrigger.refresh(), REFRESH_AFTER_MS);
  };

  return (
    <section className="sec svc" id="services">
      <div className="wrap">
        <SectionLabel>{content.label}</SectionLabel>
        <SplitHeading className="stmt" lines={content.titleLines} />
        <div className="svc__g">
          <ul className="svc__ls" id="svcList">
            {items.map((item, i) => {
              const open = openIndex === i;
              return (
                <Reveal
                  as="li"
                  key={item.slug}
                  className={cx('svc__it', open && 'is-open')}
                  delay={i * 60}
                >
                  <button type="button" aria-expanded={open} onClick={() => toggle(i)}>
                    <i className="svc__no">{item.no}</i>
                    <span className="svc__n">{item.title}</span>
                    <span className="svc__d">{item.summary}</span>
                    <i className="svc__x" />
                  </button>
                  <div className="svc__more">
                    <div className="svc__moreIn">
                      <figure className="svc__img" data-cursor="view">
                        <Image
                          src={item.image.src}
                          alt={item.image.alt}
                          width={item.image.width}
                          height={item.image.height}
                          sizes="(max-width: 1000px) 100vw, 420px"
                        />
                      </figure>
                      <p>{item.body}</p>
                      <ArrowButton
                        href={item.href}
                        size="sm"
                        className="svc__go"
                        magnetic={false}
                        tabIndex={open ? undefined : -1}
                      >
                        {content.more}
                      </ArrowButton>
                    </div>
                  </div>
                </Reveal>
              );
            })}
          </ul>
        </div>
      </div>
    </section>
  );
}
