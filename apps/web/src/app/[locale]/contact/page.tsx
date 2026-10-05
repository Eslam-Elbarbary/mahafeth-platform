import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Fragment, type ReactNode } from 'react';

import { InterestForm } from '@/components/home/InterestForm';
import { Reach } from '@/components/home/Reach';
import { Branches, ContactInfo, ContactMap } from '@/components/page/ContactBlocks';
import { InternalPage } from '@/components/page/InternalPage';
import { PageCta } from '@/components/page/PageCta';
import { type ContactBlock, getContactPage } from '@/lib/cms/pages';
import { getProjects } from '@/lib/cms/projects';
import { getSettings } from '@/lib/cms/settings';
import { getSite } from '@/lib/cms/site';
import { isLocale } from '@/lib/i18n/config';
import { pageMetadata } from '@/lib/seo';

type PageProps = { params: Promise<{ locale: string }> };

export const revalidate = 300;

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  return pageMetadata(locale, '/contact', (await getContactPage(locale)).seo);
}

/* Interest picker + lead form, then the optional contact blocks. */
export default async function ContactPage({ params }: PageProps) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const [page, site, settings, allProjects] = await Promise.all([
    getContactPage(locale),
    getSite(locale),
    getSettings(locale),
    getProjects(locale),
  ]);
  const projects = allProjects.map(({ slug, name, city }) => ({ slug, name, city }));

  const blocks: Record<ContactBlock, () => ReactNode> = {
    reach: () => <Reach content={page.reach} />,
    interest: () => (
      <InterestForm content={page.interest} projects={projects} source="CONTACT_FORM" />
    ),
    info: () => <ContactInfo content={page.info} contact={settings.contact} />,
    branches: () => <Branches content={page.branches} contact={settings.contact} />,
    map: () => <ContactMap content={page.map} brand={settings.companyName} />,
    cta: () => <PageCta content={page.cta} site={site} id="contact-cta" />,
  };

  return (
    <InternalPage locale={locale} page="contact">
      {page.blocks.map((block) => (
        <Fragment key={block}>{blocks[block]()}</Fragment>
      ))}
    </InternalPage>
  );
}
