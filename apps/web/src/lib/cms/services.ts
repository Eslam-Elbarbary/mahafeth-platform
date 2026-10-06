import { cache } from 'react';

import { fallbackServiceDetail, fallbackServices } from '@/content/fallback/services';
import type { NavLink, ServiceDetail, ServiceItem } from '@/content/types';
import type { Locale } from '@/lib/i18n/config';

import { cmsFetch } from './client';
import { toServiceDetail, toServiceItem } from './mappers/service';
import type { CmsItem, CmsList, CmsService } from './types';

export { getServiceDetailLabels } from '@/content/service-copy';

/*
 * Service data source for pages. The CMS is authoritative whenever it serves at least one
 * published service; if it is disabled, unreachable or empty, every call answers from the
 * temporary content in `content/fallback`, so the site renders the same either way.
 */

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

const isService = (value: unknown): value is CmsService =>
  isObject(value) &&
  typeof value.id === 'string' &&
  typeof value.slug === 'string' &&
  typeof value.titleAr === 'string' &&
  typeof value.titleEn === 'string';

const isList = (body: unknown): body is CmsList<CmsService> =>
  isObject(body) && Array.isArray(body.data) && body.data.every(isService);

const isItem = (body: unknown): body is CmsItem<CmsService> =>
  isObject(body) && isService(body.data);

/** Published CMS services in display order, or `null` when the fallback content should be used. */
const loadPublished = cache(async (): Promise<CmsService[] | null> => {
  const result = await cmsFetch('/services', { isValid: isList });
  return result.state === 'ok' && result.data.data.length > 0 ? result.data.data : null;
});

const loadService = cache((slug: string) =>
  cmsFetch(`/services/${encodeURIComponent(slug)}`, { isValid: isItem }),
);

const fallbackFor = (slug: string, locale: Locale) =>
  fallbackServices(locale).find((service) => service.slug === slug);

/** Every published service, in the CMS order. */
export async function getServices(locale: Locale): Promise<ServiceItem[]> {
  const published = await loadPublished();
  if (!published) return fallbackServices(locale);
  return published.map((service, i) =>
    toServiceItem(service, i, locale, fallbackFor(service.slug, locale)),
  );
}

/** One published service with its full description and SEO fields; `null` when it does not exist. */
export async function getServiceDetail(
  slug: string,
  locale: Locale,
): Promise<ServiceDetail | null> {
  const published = await loadPublished();
  if (published) {
    const result = await loadService(slug);
    if (result.state === 'missing') return null;
    if (result.state === 'ok') {
      const index = published.findIndex((service) => service.slug === slug);
      return toServiceDetail(
        result.data.data,
        index === -1 ? published.length : index,
        locale,
        fallbackFor(slug, locale),
      );
    }
  }
  return fallbackServiceDetail(slug, locale);
}

/** Service links for the header mega menu and the footer. */
export async function getServiceNavigation(locale: Locale): Promise<NavLink[]> {
  return (await getServices(locale)).map(({ title, href }) => ({ label: title, href }));
}

export async function serviceSlugs(): Promise<string[]> {
  const published = await loadPublished();
  return (published ?? fallbackServices('ar')).map((service) => service.slug);
}
