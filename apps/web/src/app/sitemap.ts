import type { MetadataRoute } from 'next';

import { siteConfig } from '@/config/site';
import { type CmsPageSlug, pageLastModified } from '@/lib/cms/pages';
import { projectSlugs } from '@/lib/cms/projects';
import { serviceSlugs } from '@/lib/cms/services';
import { locales } from '@/lib/i18n/config';

/** Routes whose content is a CMS page — their entries carry the last edit date. */
const CMS_ROUTES: Record<string, CmsPageSlug> = {
  '': 'home',
  '/about': 'about',
  '/leadership': 'leadership',
  '/contact': 'contact',
};

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const routes = [
    '',
    '/about',
    '/projects',
    ...(await projectSlugs()).map((slug) => `/projects/${slug}`),
    '/services',
    ...(await serviceSlugs()).map((slug) => `/services/${slug}`),
    '/leadership',
    '/partners',
    '/contact',
  ];
  const modified = Object.fromEntries(
    await Promise.all(
      Object.entries(CMS_ROUTES).map(async ([route, slug]) => [route, await pageLastModified(slug)]),
    ),
  ) as Record<string, Date | undefined>;

  return routes.flatMap((route) =>
    locales.map((locale) => ({
      url: `${siteConfig.url}/${locale}${route}`,
      ...(modified[route] && { lastModified: modified[route] }),
      alternates: {
        languages: Object.fromEntries(locales.map((l) => [l, `${siteConfig.url}/${l}${route}`])),
      },
    })),
  );
}
