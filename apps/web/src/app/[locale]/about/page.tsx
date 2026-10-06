import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Fragment, type ReactNode } from 'react';

import { About } from '@/components/home/About';
import { InternalPage } from '@/components/page/InternalPage';
import { PageCta } from '@/components/page/PageCta';
import { StatementBlock } from '@/components/page/StatementBlock';
import { type AboutBlock, getAboutPage } from '@/lib/cms/pages';
import { getSite } from '@/lib/cms/site';
import { isLocale } from '@/lib/i18n/config';
import { pageMetadata } from '@/lib/seo';

type PageProps = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  return pageMetadata(locale, '/about', (await getAboutPage(locale)).seo);
}

/* The story block reuses the home About section (with the timeline and figures). */
export default async function AboutPage({ params }: PageProps) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const [page, site] = await Promise.all([getAboutPage(locale), getSite(locale)]);

  const blocks: Record<AboutBlock, () => ReactNode> = {
    story: () => <About content={page.story} />,
    vision: () => <StatementBlock content={page.vision} />,
    mission: () => <StatementBlock content={page.mission} id="mission" />,
    cta: () => <PageCta content={page.cta} site={site} id="about-cta" />,
  };

  return (
    <InternalPage locale={locale} page="about">
      {page.blocks.map((block) => (
        <Fragment key={block}>{blocks[block]()}</Fragment>
      ))}
    </InternalPage>
  );
}
