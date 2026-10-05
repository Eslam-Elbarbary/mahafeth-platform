'use client';

import { useRef } from 'react';

import { OUTLINE } from '@/components/home/SaudiMap';
import type { GeoPoint, MapPin } from '@/content/types';
import { cx } from '@/lib/cx';
import { useInViewOnce } from '@/lib/motion/in-view';

const MAP_REVEAL: IntersectionObserverInit = { threshold: 0.35 };

/* Stylised district: arterial roads, a ring, secondary streets and a park — no real geography. */
const ROADS_MAIN = [
  'M-20 360 C180 330 300 300 420 262 S700 170 840 130',
  'M300 -20 C330 120 360 200 402 262 S470 420 520 560',
];
const ROADS_RING = 'M402 262 m-170 0 a170 120 0 1 0 340 0 a170 120 0 1 0 -340 0';
const ROADS_MINOR = [
  'M60 -20 L140 560',
  'M200 -20 L250 560',
  'M560 -20 L600 560',
  'M690 -20 L720 560',
  'M-20 90 L840 40',
  'M-20 190 L840 230',
  'M-20 460 L840 420',
];
const PARK = 'M560 330 C600 300 680 310 700 350 S680 430 620 430 S530 380 560 330 Z';

type DistrictMapProps = {
  /** Accessible description of the map. */
  label: string;
  /** Name on the marker. */
  tag: string;
  /** Text of the bottom chip. */
  chip: string;
  coordinates: GeoPoint | null;
  /** City pinned on the Saudi inset. */
  pin?: MapPin;
};

/**
 * Map placeholder wired for CMS coordinates: the marker drops in and pulses on reveal, streets
 * draw themselves, and a Saudi inset pins the city. Swapping in a live map only replaces
 * `.pmap__canvas`.
 */
export function DistrictMap({ label, tag, chip, coordinates, pin }: DistrictMapProps) {
  const ref = useRef<HTMLDivElement>(null);
  const shown = useInViewOnce(ref, { options: MAP_REVEAL });

  return (
    <div
      ref={ref}
      className={cx('pmap', shown && 'is-in', !coordinates && 'is-pending')}
      data-lat={coordinates?.lat}
      data-lng={coordinates?.lng}
      role="img"
      aria-label={label}
    >
      <div className="pmap__canvas">
        <svg className="pmap__streets" viewBox="0 0 800 520" preserveAspectRatio="xMidYMid slice">
          <defs>
            <pattern id="pmapBlocks" width="26" height="26" patternUnits="userSpaceOnUse">
              <rect x="3" y="3" width="20" height="20" rx="3" />
            </pattern>
          </defs>
          <rect className="pmap__blocks" width="800" height="520" fill="url(#pmapBlocks)" />
          <path className="pmap__park" d={PARK} />
          {ROADS_MINOR.map((d) => (
            <path key={d} className="pmap__road pmap__road--s" d={d} pathLength={1} />
          ))}
          <path className="pmap__road pmap__road--r" d={ROADS_RING} pathLength={1} />
          {ROADS_MAIN.map((d) => (
            <path key={d} className="pmap__road pmap__road--m" d={d} pathLength={1} />
          ))}
        </svg>
        <i className="pmap__vig" aria-hidden="true" />
      </div>

      <div className="pmap__marker" aria-hidden="true">
        <i className="pmap__pulse" />
        <i className="pmap__pulse" />
        <span className="pmap__pin">
          <svg viewBox="0 0 40 52">
            <path d="M20 51S3 33.5 3 20a17 17 0 0 1 34 0c0 13.5-17 31-17 31z" />
            <circle cx="20" cy="20" r="6.5" />
          </svg>
        </span>
        <b className="pmap__tag">{tag}</b>
      </div>

      {pin && (
        <div className="pmap__inset" aria-hidden="true">
          <svg viewBox="0 0 880 700">
            <path className="pmap__ksa" d={OUTLINE} />
            <g transform={`translate(${pin.x} ${pin.y})`}>
              <circle className="pmap__ihalo" r="34" />
              <circle className="pmap__idot" r="13" />
            </g>
          </svg>
          <span>{pin.label}</span>
        </div>
      )}

      <span className="pmap__chip">
        <i />
        {chip}
      </span>
    </div>
  );
}

export const directionsUrl = (geo: GeoPoint) =>
  `https://www.google.com/maps/dir/?api=1&destination=${geo.lat},${geo.lng}`;

export const formatCoordinates = (geo: GeoPoint) => {
  const fmt = (n: number, pos: string, neg: string) =>
    `${Math.abs(n).toFixed(4)}° ${n >= 0 ? pos : neg}`;
  return `${fmt(geo.lat, 'N', 'S')} · ${fmt(geo.lng, 'E', 'W')}`;
};
