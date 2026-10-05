import type { ReactNode } from 'react';

import { Footer } from '@/components/layout/Footer';
import type { PageKey } from '@/content/fallback/pages';
import { getGlobalContent } from '@/lib/cms/global-content';
import { getNextPage, getPageHeader } from '@/lib/cms/pages';
import { getSite } from '@/lib/cms/site';
import type { Locale } from '@/lib/i18n/config';

import { NextPage } from './NextPage';
import { PageHero } from './PageHero';

type InternalPageProps = {
  locale: Locale;
  page: PageKey;
  children?: ReactNode;
  /** Content under the hero lede. */
  heroExtra?: ReactNode;
};

/** Shared frame for internal pages: cinematic hero → page sections → next-page band → footer. */
export async function InternalPage({ locale, page, children, heroExtra }: InternalPageProps) {
  const [site, content, next, global] = await Promise.all([
    getSite(locale),
    getPageHeader(page, locale),
    getNextPage(page, locale),
    getGlobalContent(locale),
  ]);

  return (
    <>
      <main id="top" className="page">
        <PageHero
          content={content.hero}
          crumbs={{ home: global.labels.crumbHome, current: content.crumb }}
          scrollHint={global.labels.scrollHint}
        >
          {heroExtra}
        </PageHero>
        <div className="page__body">{children}</div>
        <NextPage
          label={global.buttons.nextPage}
          title={next.title}
          href={next.href}
          image={next.image}
        />
      </main>
      <Footer site={site} />
    </>
  );
}
