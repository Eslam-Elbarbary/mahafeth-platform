import type { CSSProperties } from 'react';

import { Counter } from '@/components/home/Figures';
import { RevealText } from '@/components/page/RevealText';
import { SectionHeader } from '@/components/page/SectionHeader';
import { Reveal } from '@/components/ui/Reveal';
import type { ProjectDetail, ProjectDetailLabels, ProjectStat } from '@/content/types';

function StatValue({ stat }: { stat: ProjectStat }) {
  if (stat.plain) return <b className="ltr">{String(stat.value)}</b>;
  if (Array.isArray(stat.value)) {
    const [min, max] = stat.value;
    return (
      <>
        <Counter value={min} />
        <i aria-hidden="true">–</i>
        <Counter value={max} />
      </>
    );
  }
  return <Counter value={stat.value} />;
}

/** Description, at-a-glance facts and counting statistic cards. */
export function ProjectOverview({
  project,
  labels,
}: {
  project: ProjectDetail;
  labels: ProjectDetailLabels;
}) {
  const facts = [
    { k: labels.factKeys.city, v: project.cityLabel },
    { k: labels.factKeys.district, v: project.district },
    { k: labels.factKeys.type, v: labels.typeValue },
    { k: labels.factKeys.developer, v: labels.developerValue },
  ];

  return (
    <section className="wrap sec pov" id="overview">
      <div className="pov__g">
        <div className="pov__main">
          <SectionHeader
            label={labels.overview.label}
            titleLines={labels.overview.title}
            tone="serif"
          />
          {project.description.map((paragraph, i) => (
            <RevealText
              key={i}
              className={i === 0 ? 'pov__p pov__p--lead' : 'pov__p'}
              text={paragraph}
            />
          ))}
        </div>
        <Reveal as="aside" className="pov__facts" variant="s" delay={120}>
          <h3 className="pov__fh">{labels.overview.facts}</h3>
          <dl>
            {facts.map((fact) => (
              <div key={fact.k}>
                <dt>{fact.k}</dt>
                <dd>{fact.v}</dd>
              </div>
            ))}
          </dl>
        </Reveal>
      </div>

      <ul className="pstats" aria-label={labels.statsLabel}>
        {project.stats.map((stat, i) => (
          <Reveal
            as="li"
            key={stat.label}
            className="pstat"
            delay={i * 90}
            style={{ '--i': i } as CSSProperties}
          >
            <span className="pstat__v">
              <StatValue stat={stat} />
              {stat.unit && <small>{stat.unit}</small>}
            </span>
            <span className="pstat__l">{stat.label}</span>
            {stat.note && <span className="pstat__n">{stat.note}</span>}
            <i className="pstat__bar" aria-hidden="true" />
          </Reveal>
        ))}
      </ul>
    </section>
  );
}
