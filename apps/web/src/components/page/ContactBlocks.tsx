import type { ReactNode } from 'react';

import { ArrowButton } from '@/components/ui/ArrowButton';
import { Reveal } from '@/components/ui/Reveal';
import type {
  BranchesContent,
  ContactInfoContent,
  ContactMapContent,
  SiteSettings,
} from '@/content/types';

import { DistrictMap, directionsUrl, formatCoordinates } from './DistrictMap';
import { SectionHeader } from './SectionHeader';

/* Contact page blocks. The numbers, email and branches come from the global settings. */

type Contact = SiteSettings['contact'];

/** Heading next to a facts card — the project overview layout. */
function FactsBlock({
  id,
  label,
  titleLines,
  lede,
  heading,
  children,
}: {
  id: string;
  label: string;
  titleLines: string[];
  lede?: string;
  heading: string;
  children: ReactNode;
}) {
  return (
    <section className="wrap sec pov" id={id}>
      <div className="pov__g">
        <div className="pov__main">
          <SectionHeader label={label} titleLines={titleLines} lede={lede} tone="serif" />
        </div>
        <Reveal as="aside" className="pov__facts" variant="s" delay={120}>
          <h3 className="pov__fh">{heading}</h3>
          <dl>{children}</dl>
        </Reveal>
      </div>
    </section>
  );
}

export function ContactInfo({ content, contact }: { content: ContactInfoContent; contact: Contact }) {
  return (
    <FactsBlock
      id="contact-info"
      label={content.label}
      titleLines={content.titleLines}
      lede={content.lede}
      heading={content.label}
    >
      <div>
        <dt>{content.phone}</dt>
        <dd>
          <a href={`tel:${contact.phone}`} className="ltr">
            {contact.phone}
          </a>
        </dd>
      </div>
      <div>
        <dt>{content.whatsapp}</dt>
        <dd>
          <a
            href={`https://wa.me/${contact.whatsapp}`}
            className="ltr"
            target="_blank"
            rel="noopener noreferrer"
          >
            +{contact.whatsapp}
          </a>
        </dd>
      </div>
      {contact.email && (
        <div>
          <dt>{content.email}</dt>
          <dd>
            <a href={`mailto:${contact.email}`} className="ltr">
              {contact.email}
            </a>
          </dd>
        </div>
      )}
      {content.hours && (
        <div>
          <dt>{content.hours.label}</dt>
          <dd>{content.hours.value}</dd>
        </div>
      )}
    </FactsBlock>
  );
}

export function Branches({ content, contact }: { content: BranchesContent; contact: Contact }) {
  if (contact.branches.length === 0) return null;
  return (
    <FactsBlock
      id="branches"
      label={content.label}
      titleLines={content.titleLines}
      lede={content.lede}
      heading={content.label}
    >
      {contact.branches.map((branch) => (
        <div key={`${branch.city}-${branch.address}`}>
          <dt>{branch.city}</dt>
          <dd>
            {branch.address}
            {branch.phone && (
              <>
                <br />
                <a href={`tel:${branch.phone}`} className="ltr">
                  {branch.phone}
                </a>
              </>
            )}
          </dd>
        </div>
      ))}
    </FactsBlock>
  );
}

export function ContactMap({ content, brand }: { content: ContactMapContent; brand: string }) {
  const geo = content.coordinates;
  return (
    <section className="wrap sec ploc" id="map">
      <div className="ploc__g">
        <div className="ploc__txt">
          <SectionHeader label={content.label} titleLines={content.titleLines} lede={content.lede} />
          <dl className="ploc__meta">
            <Reveal className="ploc__row" delay={120}>
              <dt>{content.label}</dt>
              <dd>
                {content.address}
                <br />
                {geo ? (
                  <span className="ltr">{formatCoordinates(geo)}</span>
                ) : (
                  <span className="ploc__pending">{content.pending}</span>
                )}
              </dd>
            </Reveal>
          </dl>
          {geo && (
            <ArrowButton
              href={directionsUrl(geo)}
              target="_blank"
              rel="noopener noreferrer"
              reveal={200}
            >
              {content.directions}
            </ArrowButton>
          )}
        </div>
        <DistrictMap
          label={`${brand} — ${content.address}`}
          tag={brand}
          chip={content.address}
          coordinates={geo}
        />
      </div>
    </section>
  );
}
