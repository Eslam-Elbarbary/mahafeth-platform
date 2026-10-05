import { DistrictMap, directionsUrl, formatCoordinates } from '@/components/page/DistrictMap';
import { SectionHeader } from '@/components/page/SectionHeader';
import { ArrowButton } from '@/components/ui/ArrowButton';
import { Reveal } from '@/components/ui/Reveal';
import type { MapPin, ProjectDetail, ProjectDetailLabels } from '@/content/types';

/**
 * Project location: city, district and coordinates next to the stylised district map. With
 * `coordinates` set it shows the lat/lng readout and a directions link.
 */
export function ProjectLocation({
  project,
  labels,
  pin,
}: {
  project: ProjectDetail;
  labels: ProjectDetailLabels;
  pin?: MapPin;
}) {
  const geo = project.coordinates;

  return (
    <section className="wrap sec ploc" id="location">
      <div className="ploc__g">
        <div className="ploc__txt">
          <SectionHeader
            label={labels.location.label}
            titleLines={labels.location.title}
            lede={project.location}
          />
          <dl className="ploc__meta">
            <Reveal className="ploc__row" delay={120}>
              <dt>{labels.location.city}</dt>
              <dd>{project.cityLabel}</dd>
            </Reveal>
            <Reveal className="ploc__row" delay={190}>
              <dt>{labels.factKeys.district}</dt>
              <dd>{project.district}</dd>
            </Reveal>
            <Reveal className="ploc__row" delay={260}>
              <dt>{labels.location.coords}</dt>
              <dd>
                {geo ? (
                  <span className="ltr">{formatCoordinates(geo)}</span>
                ) : (
                  <span className="ploc__pending">{labels.location.pending}</span>
                )}
              </dd>
            </Reveal>
          </dl>
          {geo && (
            <ArrowButton
              href={directionsUrl(geo)}
              target="_blank"
              rel="noopener noreferrer"
              reveal={320}
            >
              {labels.location.directions}
            </ArrowButton>
          )}
        </div>

        <DistrictMap
          label={`${project.name} — ${project.location}`}
          tag={project.name}
          chip={project.district}
          coordinates={geo}
          pin={pin}
        />
      </div>
    </section>
  );
}
