import { ArrowIcon } from '@/components/ui/icons';
import { SmartLink } from '@/components/ui/SmartLink';
import type { MediaAsset } from '@/content/types';

import { AnimatedImage } from './AnimatedImage';

type NextPageProps = { label: string; title: string; href: string; image: MediaAsset };

/** Closing band that walks the visitor to the next page, so internal pages read as one journey. */
export function NextPage({ label, title, href, image }: NextPageProps) {
  return (
    <section className="wrap pnext">
      <SmartLink className="pnext__link" href={href} data-cursor="explore">
        <span className="pnext__k">{label}</span>
        <span className="pnext__t">{title}</span>
        <span className="pnext__arrow" aria-hidden="true">
          <ArrowIcon />
        </span>
      </SmartLink>
      <AnimatedImage
        image={image}
        sizes="(max-width: 1000px) 100vw, 40vw"
        ratio="16/10"
        from="start"
      />
    </section>
  );
}
