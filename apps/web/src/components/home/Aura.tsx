import type { CSSProperties } from 'react';

import type { AuraSpark } from '@/content/types';

/** Background light show behind the hero: drifting orbs, beam, grid, sparks and vignette (pure CSS). */
export function Aura({ sparks }: { sparks: AuraSpark[] }) {
  return (
    <div className="aura" id="aura" aria-hidden="true">
      <i className="aura__o aura__o--1" />
      <i className="aura__o aura__o--2" />
      <i className="aura__o aura__o--3" />
      <i className="aura__o aura__o--4" />
      <i className="aura__o aura__o--5" />
      <i className="aura__beam" />
      <i className="aura__grid" />
      {sparks.map((s, i) => (
        <i
          key={i}
          className="aura__sp"
          style={{ top: s.top, left: s.left, animationDelay: s.delay } satisfies CSSProperties}
        />
      ))}
      <i className="aura__vig" />
    </div>
  );
}
