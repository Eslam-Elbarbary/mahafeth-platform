import { ArrowButton } from '@/components/ui/ArrowButton';
import { Reveal } from '@/components/ui/Reveal';
import { SectionLabel } from '@/components/ui/SectionLabel';
import { SplitHeading } from '@/components/ui/SplitHeading';
import type { PageCtaContent, SiteContent } from '@/content/types';

import { ParallaxImage } from './ParallaxImage';

type PageCtaProps = {
  content: PageCtaContent;
  site: Pick<SiteContent, 'cta' | 'contact'>;
  /** Section id; the heading id is derived from it. */
  id: string;
};

/** Closing call to action over a full-bleed image, with the call and WhatsApp shortcuts. */
export function PageCta({ content, site, id }: PageCtaProps) {
  const headingId = `${id}-t`;
  const href = content.button.href || site.cta.href;
  return (
    <section className="pcta" id={id} aria-labelledby={headingId}>
      <ParallaxImage className="pcta__bg" image={content.image} sizes="100vw" strength={10} />
      <i className="pcta__shade" aria-hidden="true" />
      <div className="pcta__g">
        <div className="pcta__main">
          <SectionLabel>{content.label}</SectionLabel>
          <SplitHeading id={headingId} className="stmt pcta__h" lines={content.titleLines} />
          <Reveal as="p" className="pcta__body" delay={200}>
            {content.body}
          </Reveal>
          <div className="pcta__acts">
            <ArrowButton
              tone="white"
              size="lg"
              href={href}
              interest={content.button.href ? undefined : site.cta.interest}
              reveal={280}
            >
              {content.button.label}
            </ArrowButton>
            <Reveal className="pcta__alt" delay={360}>
              <a href={`tel:${site.contact.phone}`} className="pcta__link">
                <span>{content.call}</span>
                <b className="ltr">{site.contact.phone}</b>
              </a>
              <a
                href={`https://wa.me/${site.contact.whatsapp}`}
                className="pcta__link"
                target="_blank"
                rel="noopener noreferrer"
              >
                <span>{content.whatsapp}</span>
                <b className="ltr">+{site.contact.whatsapp}</b>
              </a>
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  );
}
