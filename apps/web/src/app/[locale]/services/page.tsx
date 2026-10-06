import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { ServicesAccordion } from '@/components/home/ServicesAccordion';
import { InternalPage } from '@/components/page/InternalPage';
import { getHomepage, getPageHeader } from '@/lib/cms/pages';
import { getServices } from '@/lib/cms/services';
import { isLocale } from '@/lib/i18n/config';
import { pageMetadata } from '@/lib/seo';

type PageProps = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  return pageMetadata(locale, '/services', (await getPageHeader('services', locale)).meta);
}

export default async function ServicesPage({ params }: PageProps) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const [home, services] = await Promise.all([getHomepage(locale), getServices(locale)]);

  return (
    <InternalPage locale={locale} page="services">
      <ServicesAccordion content={home.content.services} items={services} />
    </InternalPage>
  );
}
