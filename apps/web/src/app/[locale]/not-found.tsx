import type { Metadata } from 'next';
import { headers } from 'next/headers';

import { Footer } from '@/components/layout/Footer';
import { PageHero } from '@/components/page/PageHero';
import { ArrowButton } from '@/components/ui/ArrowButton';
import { getNotFoundContent } from '@/content/fallback/pages';
import { getGlobalContent } from '@/lib/cms/global-content';
import { getSite } from '@/lib/cms/site';
import { defaultLocale, isLocale, LOCALE_HEADER, type Locale } from '@/lib/i18n/config';

/* Boundaries get no params: the locale comes from the header `proxy.ts` sets from the path. */
async function requestLocale(): Promise<Locale> {
  const value = (await headers()).get(LOCALE_HEADER);
  return isLocale(value) ? value : defaultLocale;
}

export async function generateMetadata(): Promise<Metadata> {
  const { title } = getNotFoundContent(await requestLocale());
  return { title, robots: { index: false } };
}

/** Branded 404 inside the locale layout (header, cursor, transitions), with the site footer. */
export default async function NotFound() {
  const locale = await requestLocale();
  const content = getNotFoundContent(locale);
  const [site, global] = await Promise.all([getSite(locale), getGlobalContent(locale)]);

  return (
    <>
      <main id="top" className="page page--404">
        <PageHero
          content={content.hero}
          crumbs={{ home: global.labels.crumbHome, current: content.title }}
          mark={content.mark}
        >
          <ArrowButton tone="white" href="/">
            {content.home}
          </ArrowButton>
          <ArrowButton href="/projects">{content.projects}</ArrowButton>
        </PageHero>
      </main>
      <Footer site={site} />
    </>
  );
}
