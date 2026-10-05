import type { CSSProperties, ReactNode } from 'react';

import { SectionHeader } from '@/components/page/SectionHeader';
import { FeatureIcon } from '@/components/ui/icons';
import { Reveal } from '@/components/ui/Reveal';
import { StatusBadge } from '@/components/ui/StatusBadge';
import type { ProjectDetail, ProjectDetailLabels } from '@/content/types';

/** Specification list (location, units, status, completion, sizes) beside the feature grid. */
export function ProjectInfo({
  project,
  labels,
}: {
  project: ProjectDetail;
  labels: ProjectDetailLabels;
}) {
  const [min, max] = project.area;
  const rows: { k: string; v: ReactNode }[] = [
    { k: labels.info.location, v: project.location },
    { k: labels.info.units, v: <span className="ltr">{project.units}</span> },
    {
      k: labels.info.status,
      v: <StatusBadge status={project.status} label={project.statusLabel} />,
    },
    { k: labels.info.completion, v: project.completionLabel },
    {
      k: labels.info.area,
      v: (
        <>
          <span className="ltr">
            {min} – {max}
          </span>{' '}
          {labels.sqm}
        </>
      ),
    },
  ];

  return (
    <section className="sec pinfo" id="information">
      <div className="wrap pinfo__g">
        <div className="pinfo__side">
          <SectionHeader label={labels.info.label} titleLines={labels.info.title} />
          <dl className="pinfo__list">
            {rows.map((row, i) => (
              <Reveal key={row.k} className="pinfo__row" delay={i * 70}>
                <dt>{row.k}</dt>
                <dd>{row.v}</dd>
              </Reveal>
            ))}
          </dl>
        </div>
        <div className="pinfo__feat">
          <Reveal as="h3" className="pinfo__fh">
            <i aria-hidden="true" />
            {labels.info.features}
          </Reveal>
          <ul className="pfeat">
            {project.features.map((feature, i) => (
              <Reveal
                as="li"
                key={feature.title}
                className="pfeat__it"
                variant="s"
                delay={i * 80}
                style={{ '--i': i } as CSSProperties}
              >
                <span className="pfeat__ic">
                  <FeatureIcon name={feature.icon} />
                </span>
                <h4>{feature.title}</h4>
                <p>{feature.body}</p>
              </Reveal>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
