import type { Metadata } from 'next';

import type { MediaAsset, PageMeta } from '@/content/types';

import { getSettings } from './cms/settings';
import { locales, type Locale } from './i18n/config';

/**
 * Title, description and hreflang alternates for a locale-relative route (`/about`, `/projects/x`).
 * The site name and default sharing image come from the global settings.
 */
export async function pageMetadata(
  locale: Locale,
  path: string,
  meta: PageMeta & { image?: MediaAsset },
): Promise<Metadata> {
  const { companyName, seo } = await getSettings(locale);
  const languages = Object.fromEntries(locales.map((l) => [l, `/${l}${path}`]));
  const { image } = meta;
  const images = image
    ? [{ url: image.src, width: image.width, height: image.height, alt: image.alt }]
    : seo.ogImage
      ? [{ url: seo.ogImage }]
      : undefined;
  return {
    title: `${meta.title} | ${companyName}`,
    description: meta.description,
    alternates: {
      canonical: `/${locale}${path}`,
      languages: { ...languages, 'x-default': `/ar${path}` },
    },
    openGraph: {
      type: 'website',
      siteName: companyName,
      title: meta.title,
      description: meta.description,
      locale,
      ...(images && { images }),
    },
  };
}
