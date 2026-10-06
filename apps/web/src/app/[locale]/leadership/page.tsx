import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Fragment, type ReactNode } from 'react';

import { LeadershipQuotes } from '@/components/home/LeadershipQuotes';
import { InternalPage } from '@/components/page/InternalPage';
import { PageCta } from '@/components/page/PageCta';
import { RevealText } from '@/components/page/RevealText';
import { SectionHeader } from '@/components/page/SectionHeader';
import { Reveal } from '@/components/ui/Reveal';
import { siteConfig } from '@/config/site';
import type { TeamMember } from '@/content/types';
import { toLeadershipMember } from '@/lib/cms/mappers/team';
import { getLeadershipPage, type LeadershipBlock } from '@/lib/cms/pages';
import { getSite } from '@/lib/cms/site';
import { getTeam } from '@/lib/cms/team';
import { isLocale, type Locale } from '@/lib/i18n/config';
import { pageMetadata } from '@/lib/seo';

type PageProps = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  return pageMetadata(locale, '/leadership', (await getLeadershipPage(locale)).seo);
}

function leadershipJsonLd(members: TeamMember[], locale: Locale, title: string, org: string) {
  const url = `${siteConfig.url}/${locale}/leadership`;
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    '@id': `${url}#leadership`,
    url,
    name: title,
    numberOfItems: members.length,
    itemListElement: members.map((member, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      item: {
        '@type': 'Person',
        name: member.name,
        jobTitle: member.role,
        ...(member.bio[0] && { description: member.bio[0] }),
        ...(member.photo && { image: new URL(member.photo.src, siteConfig.url).toString() }),
        worksFor: { '@type': 'Organization', name: org, url: siteConfig.url },
      },
    })),
  };
}

export default async function LeadershipPage({ params }: PageProps) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const [team, site, page] = await Promise.all([
    getTeam(locale),
    getSite(locale),
    getLeadershipPage(locale),
  ]);
  const { intro } = page;

  const blocks: Record<LeadershipBlock, () => ReactNode> = {
    intro: () => (
      <section className="wrap sec pov" id="overview">
        <div className="pov__g">
          <div className="pov__main">
            <SectionHeader label={intro.label} titleLines={intro.titleLines} tone="serif" />
            {intro.body.map((paragraph, i) => (
              <RevealText
                key={i}
                className={i === 0 ? 'pov__p pov__p--lead' : 'pov__p'}
                text={paragraph}
              />
            ))}
          </div>
          {team.length > 0 && (
            <Reveal as="aside" className="pov__facts" variant="s" delay={120}>
              <h3 className="pov__fh">{intro.members}</h3>
              <dl>
                {team.map((member) => (
                  <div key={member.id}>
                    <dt>{member.role}</dt>
                    <dd>{member.name}</dd>
                  </div>
                ))}
              </dl>
            </Reveal>
          )}
        </div>
      </section>
    ),
    quotes: () => (
      <LeadershipQuotes content={page.quotes} members={team.map(toLeadershipMember)} />
    ),
    cta: () => <PageCta content={page.cta} site={site} id="contact-leadership" />,
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            leadershipJsonLd(team, locale, page.seo.title, site.brand.name),
          ).replace(/</g, '\\u003c'),
        }}
      />
      <InternalPage locale={locale} page="leadership">
        {page.blocks.map((block) => (
          <Fragment key={block}>{blocks[block]()}</Fragment>
        ))}
      </InternalPage>
    </>
  );
}
