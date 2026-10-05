import { cache } from 'react';

import { fallbackPartners } from '@/content/fallback/partners';
import type { PartnerLogo } from '@/content/types';
import type { Locale } from '@/lib/i18n/config';

import { cmsFetch } from './client';
import { pick, toMediaAsset } from './mappers/common';
import type { CmsList, CmsPartner } from './types';

/*
 * Partner logos for the marquee. The CMS is authoritative whenever it serves at least one visible
 * partner with a logo; if it is disabled, unreachable or has none, the bundled logos are used.
 */

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

const isPartner = (value: unknown): value is CmsPartner =>
  isObject(value) &&
  typeof value.id === 'string' &&
  typeof value.nameAr === 'string' &&
  typeof value.nameEn === 'string';

const isList = (body: unknown): body is CmsList<CmsPartner> =>
  isObject(body) && Array.isArray(body.data) && body.data.every(isPartner);

/** Visible CMS partners that have a logo, or `null` when the fallback should be used. */
const loadVisible = cache(async (): Promise<CmsPartner[] | null> => {
  const result = await cmsFetch('/partners', { tags: ['cms:partners'], isValid: isList });
  if (result.state !== 'ok') return null;
  const withLogo = result.data.data.filter((partner) => partner.logo);
  return withLogo.length > 0 ? withLogo : null;
});

/** Every visible partner, in the CMS order. */
export async function getPartners(locale: Locale): Promise<PartnerLogo[]> {
  const partners = await loadVisible();
  if (!partners) return fallbackPartners(locale);
  return partners.map((partner) => {
    const name = pick(partner.nameAr, partner.nameEn, locale) ?? '';
    return {
      name,
      logo: toMediaAsset(partner.logo!, locale, name),
      ...(partner.websiteUrl && { url: partner.websiteUrl }),
    };
  });
}
