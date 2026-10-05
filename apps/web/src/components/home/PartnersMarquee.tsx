import Image from 'next/image';

import { Reveal } from '@/components/ui/Reveal';
import { SectionLabel } from '@/components/ui/SectionLabel';
import type { PartnerLogo, PartnersContent } from '@/content/types';

/** Logos per loop, so a short CMS list still spans the viewport and the loop stays seamless. */
const MIN_PER_LOOP = 12;

/* Each row is the list twice so the CSS `marq` keyframes (-50%) loop seamlessly. */
function Row({ logos, id }: { logos: PartnerLogo[]; id: string }) {
  const loop = Array.from({ length: Math.ceil(MIN_PER_LOOP / logos.length) }, () => logos).flat();
  return (
    <div className="marq__r" id={id}>
      {[...loop, ...loop].map((p, i) => (
        <div key={i} className="marq__it">
          <Image
            src={p.logo.src}
            alt=""
            width={p.logo.width}
            height={p.logo.height}
            sizes="112px"
          />
        </div>
      ))}
    </div>
  );
}

/** Two opposing infinite marquees of partner logos (pause on hover, pure CSS). */
export function PartnersMarquee({
  content,
  logos,
}: {
  content: PartnersContent;
  logos: PartnerLogo[];
}) {
  if (logos.length === 0) return null;
  return (
    <section className="partners" id="partners">
      <div className="wrap partners__hd">
        <SectionLabel>{content.label}</SectionLabel>
        <Reveal as="p" className="lede" delay={90}>
          {content.lede}
        </Reveal>
      </div>
      <div className="marq" aria-hidden="true">
        <Row logos={logos} id="marqA" />
      </div>
      <div className="marq marq--rev" aria-hidden="true">
        <Row logos={[...logos].reverse()} id="marqB" />
      </div>
    </section>
  );
}
