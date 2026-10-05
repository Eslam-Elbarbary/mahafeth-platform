import type { Locale } from '@/lib/i18n/config';

import { l, localize, type Bilingual } from '../localize';
import { media } from '../media';
import type { PartnerLogo } from '../types';

/*
 * Temporary partner logos — the fallback used when the CMS is unreachable or has no visible
 * partner with a logo. Only `lib/cms/partners.ts` reads this module. The same files are imported
 * into the CMS media library by the backend seed.
 */

const partnerSizes: [number, number][] = [
  [420, 114],
  [420, 85],
  [420, 138],
  [420, 148],
  [420, 108],
  [420, 146],
  [420, 89],
  [413, 160],
  [215, 160],
  [191, 160],
  [420, 86],
  [420, 133],
  [420, 122],
  [378, 160],
  [420, 157],
  [125, 160],
  [420, 94],
  [335, 160],
  [420, 115],
  [420, 142],
  [420, 73],
];

const partners: Bilingual<PartnerLogo>[] = partnerSizes.map(([w, h], i) => {
  const n = String(i + 1).padStart(2, '0');
  return { name: l(`شريك ${n}`, `Partner ${n}`), logo: media(`/images/partners/p${n}.png`, w, h) };
});

export function fallbackPartners(locale: Locale): PartnerLogo[] {
  return localize<PartnerLogo[]>(partners, locale);
}
