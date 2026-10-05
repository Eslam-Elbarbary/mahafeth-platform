import type { StatementContent } from '@/content/types';

import { ParallaxImage } from './ParallaxImage';
import { RevealText } from './RevealText';
import { SectionHeader } from './SectionHeader';

/** Serif heading, revealed paragraph and a wide parallax image (about vision / mission). */
export function StatementBlock({ content, id }: { content: StatementContent; id?: string }) {
  return (
    <section className="wrap sec pvis" id={id}>
      <SectionHeader label={content.label} titleLines={content.titleLines} tone="serif" />
      <RevealText className="pvis__body" text={content.body} />
      {content.image && <ParallaxImage image={content.image} sizes="100vw" ratio="21/9" />}
    </section>
  );
}
