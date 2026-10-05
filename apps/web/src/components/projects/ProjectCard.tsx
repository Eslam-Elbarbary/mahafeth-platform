import type { CSSProperties } from 'react';

import { AnimatedImage } from '@/components/page/AnimatedImage';
import { Reveal } from '@/components/ui/Reveal';
import { SmartLink } from '@/components/ui/SmartLink';
import { StatusBadge } from '@/components/ui/StatusBadge';
import type { ShowcaseProject } from '@/content/types';

/** Portfolio card: revealed image with status, name, location and key facts; links to the project page. */
export function ProjectCard({ project, index = 0 }: { project: ShowcaseProject; index?: number }) {
  return (
    <Reveal
      as="article"
      className="pcard"
      delay={index * 90}
      style={{ '--i': index } as CSSProperties}
    >
      <SmartLink
        className="pcard__link"
        href={`/projects/${project.slug}`}
        aria-label={project.linkLabel}
        data-cursor="explore"
      >
        <div className="pcard__media">
          <AnimatedImage
            image={project.image}
            sizes="(max-width: 640px) 100vw, (max-width: 1000px) 50vw, 33vw"
            ratio="4/5"
            cursor={false}
          />
          <StatusBadge className="pcard__st" status={project.status} label={project.statusLabel} />
        </div>
        <div className="pcard__body">
          <h3 className="pcard__name">{project.name}</h3>
          <p className="pcard__loc">{project.location}</p>
          <dl className="pcard__kf">
            {project.facts.map((fact) => (
              <div key={fact.label}>
                <dd>
                  <span>{fact.value}</span>
                  {fact.unit && <small>{fact.unit}</small>}
                </dd>
                <dt>{fact.label}</dt>
              </div>
            ))}
          </dl>
        </div>
      </SmartLink>
    </Reveal>
  );
}
