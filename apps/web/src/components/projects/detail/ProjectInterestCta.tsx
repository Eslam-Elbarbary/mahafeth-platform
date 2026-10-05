import { ParallaxImage } from '@/components/page/ParallaxImage';
import { ArrowButton } from '@/components/ui/ArrowButton';
import { Reveal } from '@/components/ui/Reveal';
import { SectionLabel } from '@/components/ui/SectionLabel';
import { SplitHeading } from '@/components/ui/SplitHeading';
import { StatusBadge } from '@/components/ui/StatusBadge';
import type { ProjectDetail, ProjectDetailLabels } from '@/content/types';
import { projectInterestHref } from '@/lib/project-links';

/**
 * Closing conversion band over the scrubbed project cover. The primary link carries the project
 * slug and interest in the query so the contact form opens pre-filled.
 */
export function ProjectInterestCta({
  project,
  labels,
  phone,
  whatsapp,
}: {
  project: ProjectDetail;
  labels: ProjectDetailLabels['cta'];
  phone: string;
  whatsapp: string;
}) {
  return (
    <section className="pcta" id="register" aria-labelledby="pctaT">
      <ParallaxImage className="pcta__bg" image={project.image} sizes="100vw" strength={10} />
      <i className="pcta__shade" aria-hidden="true" />
      <div className="pcta__g">
        <div className="pcta__main">
          <SectionLabel>{labels.label}</SectionLabel>
          <SplitHeading id="pctaT" className="stmt pcta__h" lines={labels.title} />
          <Reveal as="p" className="pcta__body" delay={200}>
            {labels.body}
          </Reveal>
          <div className="pcta__acts">
            <ArrowButton
              tone="white"
              size="lg"
              href={projectInterestHref(project.slug)}
              interest="own"
              reveal={280}
            >
              {labels.primary}
            </ArrowButton>
            <Reveal className="pcta__alt" delay={360}>
              <a href={`tel:${phone}`} className="pcta__link">
                <span>{labels.call}</span>
                <b className="ltr">{phone}</b>
              </a>
              <a
                href={`https://wa.me/${whatsapp}`}
                className="pcta__link"
                target="_blank"
                rel="noopener noreferrer"
              >
                <span>{labels.whatsapp}</span>
                <b className="ltr">+{whatsapp}</b>
              </a>
            </Reveal>
          </div>
        </div>
        <Reveal as="aside" className="pcta__card" variant="s" delay={240}>
          <StatusBadge status={project.status} label={project.statusLabel} />
          <h3>{project.name}</h3>
          <p>{project.location}</p>
          <dl>
            {project.facts.map((fact) => (
              <div key={fact.label}>
                <dt>{fact.label}</dt>
                <dd>
                  <span className="ltr">{fact.value}</span>
                  {fact.unit && <small>{fact.unit}</small>}
                </dd>
              </div>
            ))}
          </dl>
        </Reveal>
      </div>
    </section>
  );
}
