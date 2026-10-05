import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { ServicesAccordion } from '@/components/home/ServicesAccordion';
import { Footer } from '@/components/layout/Footer';
import { NextPage } from '@/components/page/NextPage';
import { PageHero } from '@/components/page/PageHero';
import { RevealText } from '@/components/page/RevealText';
import { SectionHeader } from '@/components/page/SectionHeader';
import { ArrowButton } from '@/components/ui/ArrowButton';
import { Reveal } from '@/components/ui/Reveal';
import { siteConfig } from '@/config/site';
import type { ServiceDetail } from '@/content/types';
import { getGlobalContent } from '@/lib/cms/global-content';
import { getHomepage } from '@/lib/cms/pages';
import {
  getServiceDetail,
  getServiceDetailLabels,
  getServices,
  serviceSlugs,
} from '@/lib/cms/services';
import { getSite } from '@/lib/cms/site';
import { isLocale, type Locale } from '@/lib/i18n/config';
import { pageMetadata } from '@/lib/seo';

type PageProps = { params: Promise<{ locale: string; slug: string }> };

/* Known slugs are prerendered; services published later render on first request. Both refresh
 * with the CMS cache (`CMS_REVALIDATE`). */
export const dynamicParams = true;
export const revalidate = 300;

export async function generateStaticParams() {
  return (await serviceSlugs()).map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale, slug } = await params;
  if (!isLocale(locale)) return {};
  const service = await getServiceDetail(slug, locale);
  if (!service) return {};
  return pageMetadata(locale, `/services/${slug}`, { ...service.meta, image: service.image });
}

function serviceJsonLd(service: ServiceDetail, locale: Locale, provider: string) {
  const url = `${siteConfig.url}/${locale}/services/${service.slug}`;
  return {
    '@context': 'https://schema.org',
    '@type': 'Service',
    '@id': url,
    url,
    name: service.title,
    description: service.summary,
    image: new URL(service.image.src, siteConfig.url).toString(),
    areaServed: 'SA',
    provider: { '@type': 'Organization', name: provider, url: siteConfig.url },
  };
}

export default async function ServicePage({ params }: PageProps) {
  const { locale, slug } = await params;
  if (!isLocale(locale)) notFound();
  const [service, services, site, home, global] = await Promise.all([
    getServiceDetail(slug, locale),
    getServices(locale),
    getSite(locale),
    getHomepage(locale),
    getGlobalContent(locale),
  ]);
  if (!service) notFound();
  const labels = getServiceDetailLabels(locale);
  const servicesPage = global.headers.services;
  const accordion = home.content.services;

  const others = services.filter((other) => other.slug !== slug);
  const index = services.findIndex((other) => other.slug === slug);
  const next = others.length > 0 ? services[(index + 1) % services.length] : undefined;

  const facts = [
    { k: labels.factKeys.service, v: service.title },
    { k: labels.factKeys.scope, v: labels.scopeValue },
    { k: labels.factKeys.developer, v: labels.developerValue },
  ];

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(serviceJsonLd(service, locale, site.brand.name)).replace(
            /</g,
            '\\u003c',
          ),
        }}
      />
      <main id="top" className="page page--service">
        <PageHero
          content={{
            eyebrow: servicesPage.hero.eyebrow,
            titleLines: [service.title],
            lede: service.summary,
            media: service.image,
          }}
          crumbs={{
            home: global.labels.crumbHome,
            parent: { label: servicesPage.crumb, href: '/services' },
            current: service.title,
          }}
          scrollHint={global.labels.scrollHint}
        >
          <ArrowButton tone="white" href={site.cta.href} interest={site.cta.interest}>
            {labels.enquire}
          </ArrowButton>
        </PageHero>

        <div className="page__body">
          <section className="wrap sec pov" id="overview">
            <div className="pov__g">
              <div className="pov__main">
                <SectionHeader
                  label={labels.overview.label}
                  titleLines={[service.title]}
                  tone="serif"
                />
                {service.description.map((paragraph, i) => (
                  <RevealText
                    key={i}
                    className={i === 0 ? 'pov__p pov__p--lead' : 'pov__p'}
                    text={paragraph}
                  />
                ))}
              </div>
              <Reveal as="aside" className="pov__facts" variant="s" delay={120}>
                <h3 className="pov__fh">{labels.overview.facts}</h3>
                <dl>
                  {facts.map((fact) => (
                    <div key={fact.k}>
                      <dt>{fact.k}</dt>
                      <dd>{fact.v}</dd>
                    </div>
                  ))}
                </dl>
              </Reveal>
            </div>
          </section>

          {others.length > 0 && (
            <ServicesAccordion
              content={{
                label: labels.more.label,
                titleLines: labels.more.title,
                more: accordion.more,
              }}
              items={others}
            />
          )}
        </div>

        {next && (
          <NextPage label={labels.next} title={next.title} href={next.href} image={next.image} />
        )}
      </main>
      <Footer site={site} />
    </>
  );
}
