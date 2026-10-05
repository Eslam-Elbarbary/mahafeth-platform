import { serviceNumber } from '@/content/service-copy';
import type { ServiceDetail, ServiceItem } from '@/content/types';
import type { Locale } from '@/lib/i18n/config';

import type { CmsService } from '../types';
import { paragraphs, pick, placeholderImage, toMediaAsset } from './common';

/*
 * CMS service → view model. Empty CMS text falls back to the other language, then to the
 * temporary content for the same slug; a missing image uses the bundled one for that slug.
 */

export function toServiceItem(
  service: CmsService,
  index: number,
  locale: Locale,
  fallback?: ServiceItem,
): ServiceItem {
  const title = pick(service.titleAr, service.titleEn, locale) ?? service.slug;
  const description = paragraphs(pick(service.descriptionAr, service.descriptionEn, locale));
  const summary =
    pick(service.summaryAr, service.summaryEn, locale) ?? fallback?.summary ?? description[0] ?? '';

  return {
    slug: service.slug,
    no: serviceNumber(index),
    title,
    summary,
    body: description[0] ?? fallback?.body ?? summary,
    image: service.image
      ? toMediaAsset(service.image, locale, title)
      : (fallback?.image ?? { ...placeholderImage, alt: title }),
    href: `/services/${service.slug}`,
  };
}

export function toServiceDetail(
  service: CmsService,
  index: number,
  locale: Locale,
  fallback?: ServiceItem,
): ServiceDetail {
  const item = toServiceItem(service, index, locale, fallback);
  const description = paragraphs(pick(service.descriptionAr, service.descriptionEn, locale));

  return {
    ...item,
    id: service.id,
    description: description.length > 0 ? description : [item.body],
    meta: {
      title: pick(service.metaTitleAr, service.metaTitleEn, locale) ?? item.title,
      description:
        pick(service.metaDescriptionAr, service.metaDescriptionEn, locale) ?? item.summary,
    },
  };
}
