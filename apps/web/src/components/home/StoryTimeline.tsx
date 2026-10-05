import type { Ref } from 'react';

import { SectionLabel } from '@/components/ui/SectionLabel';
import type { AboutContent } from '@/content/types';

type StoryTimelineProps = {
  ref?: Ref<HTMLDivElement>;
  story: AboutContent['story'];
};

/**
 * Collapsible company timeline. Starts `hidden`; <About> animates it open/closed and owns the
 * `hidden` attribute from then on (the prop never changes, so React leaves it alone).
 */
export function StoryTimeline({ ref, story }: StoryTimelineProps) {
  return (
    <div className="story" id="story" ref={ref} hidden>
      <div className="story__in">
        <SectionLabel reveal={false}>{story.label}</SectionLabel>
        <ol className="tl">
          {story.items.map((item) => (
            <li key={item.year} className={item.current ? 'now' : undefined}>
              <b className="ltr">{item.year}</b>
              <div>
                <h4>{item.title}</h4>
                <p>{item.body}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}
