import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { PartnersMarquee } from '@/components/home/PartnersMarquee';
import { InternalPage } from '@/components/page/InternalPage';
import { siteConfig } from '@/config/site';
import type { PartnerLogo } from '@/content/types';
import { getHomepage, getPageHeader } from '@/lib/cms/pages';
import { getPartners } from '@/lib/cms/partners';
import { isLocale, type Locale } from '@/lib/i18n/config';
import { pageMetadata } from '@/lib/seo';

type PageProps = { params: Promise<{ locale: string }> };

export const revalidate = 300;

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const page = await getPageHeader('partners', locale);
  return pageMetadata(locale, '/partners', { ...page.meta, image: page.hero.media });
}

function partnersJsonLd(partners: PartnerLogo[], locale: Locale, title: string) {
  const url = `${siteConfig.url}/${locale}/partners`;
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    '@id': `${url}#partners`,
    url,
    name: title,
    numberOfItems: partners.length,
    itemListElement: partners.map((partner, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      item: {
        '@type': 'Organization',
        name: partner.name,
        logo: new URL(partner.logo.src, siteConfig.url).toString(),
        ...(partner.url && { url: partner.url }),
      },
    })),
  };
}

/* First pass: the partners marquee. A categorised logo wall comes next. */
export default async function PartnersPage({ params }: PageProps) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const [home, partners, page] = await Promise.all([
    getHomepage(locale),
    getPartners(locale),
    getPageHeader('partners', locale),
  ]);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(partnersJsonLd(partners, locale, page.meta.title)).replace(
            /</g,
            '\\u003c',
          ),
        }}
      />
      <InternalPage locale={locale} page="partners">
        <PartnersMarquee content={home.content.partners} logos={partners} />
      </InternalPage>
    </>
  );
}
