import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { Footer } from '@/components/layout/Footer';
import { PageHero } from '@/components/page/PageHero';
import { SectionHeader } from '@/components/page/SectionHeader';
import { ProjectGallery } from '@/components/projects/detail/ProjectGallery';
import { ProjectInfo } from '@/components/projects/detail/ProjectInfo';
import { ProjectInterestCta } from '@/components/projects/detail/ProjectInterestCta';
import { ProjectLocation } from '@/components/projects/detail/ProjectLocation';
import { ProjectOverview } from '@/components/projects/detail/ProjectOverview';
import { ProjectCard } from '@/components/projects/ProjectCard';
import { ArrowButton } from '@/components/ui/ArrowButton';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { siteConfig } from '@/config/site';
import { getHomeContent } from '@/content/fallback/pages';
import type { ProjectDetail } from '@/content/types';
import { getGlobalContent } from '@/lib/cms/global-content';
import {
  getProjectDetail,
  getProjectDetailLabels,
  getRelatedProjects,
  projectInterestHref,
  projectSlugs,
} from '@/lib/cms/projects';
import { getSite } from '@/lib/cms/site';
import { isLocale, type Locale } from '@/lib/i18n/config';
import { pageMetadata } from '@/lib/seo';

type PageProps = { params: Promise<{ locale: string; slug: string }> };

/* Known slugs are prerendered; projects published later render on first request. Both refresh
 * with the CMS cache (`CMS_REVALIDATE`). */
export const dynamicParams = true;
export const revalidate = 300;

export async function generateStaticParams() {
  return (await projectSlugs()).map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale, slug } = await params;
  if (!isLocale(locale)) return {};
  const project = await getProjectDetail(slug, locale);
  if (!project) return {};
  return pageMetadata(locale, `/projects/${slug}`, {
    title: project.name,
    description: project.summary,
    image: project.image,
  });
}

export const dynamic = 'force-dynamic';
// export const revalidate = 0;

// export async function generateStaticParams() {
//   return (await projectSlugs()).map((slug) => ({ slug }));
// }

function projectJsonLd(project: ProjectDetail, locale: Locale) {
  const url = `${siteConfig.url}/${locale}/projects/${project.slug}`;
  return {
    '@context': 'https://schema.org',
    '@type': 'ApartmentComplex',
    '@id': url,
    url,
    name: project.name,
    description: project.summary,
    image: project.gallery.map((g) => new URL(g.image.src, siteConfig.url).toString()),
    numberOfAccommodationUnits: project.units,
    address: {
      '@type': 'PostalAddress',
      addressLocality: project.cityLabel,
      streetAddress: project.district,
      addressCountry: 'SA',
    },
    ...(project.coordinates && {
      geo: {
        '@type': 'GeoCoordinates',
        latitude: project.coordinates.lat,
        longitude: project.coordinates.lng,
      },
    }),
  };
}

export default async function ProjectPage({ params }: PageProps) {
  const { locale, slug } = await params;
  if (!isLocale(locale)) notFound();
  const [project, related, site, global] = await Promise.all([
    getProjectDetail(slug, locale),
    getRelatedProjects(slug, locale),
    getSite(locale),
    getGlobalContent(locale),
  ]);
  if (!project) notFound();
  const labels = getProjectDetailLabels(locale);
  const projectsPage = global.headers.projects;
  const pin = getHomeContent(locale).showcase.pins.find((p) => p.city === project.city);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(projectJsonLd(project, locale)).replace(/</g, '\\u003c'),
        }}
      />
      <main id="top" className="page page--project">
        <PageHero
          content={{
            eyebrow: project.location,
            titleLines: [project.name],
            lede: project.summary,
            media: project.image,
          }}
          crumbs={{
            home: global.labels.crumbHome,
            parent: { label: projectsPage.crumb, href: '/projects' },
            current: project.name,
          }}
          scrollHint={global.labels.scrollHint}
        >
          <StatusBadge status={project.status} label={project.statusLabel} />
          <ArrowButton tone="white" href={projectInterestHref(project.slug)} interest="own">
            {labels.enquire}
          </ArrowButton>
        </PageHero>

        <div className="page__body">
          <ProjectOverview project={project} labels={labels} />
          <ProjectGallery items={project.gallery} labels={labels.gallery} />
          <ProjectInfo project={project} labels={labels} />
          <ProjectLocation project={project} labels={labels} pin={pin} />
          <ProjectInterestCta
            project={project}
            labels={labels.cta}
            phone={site.contact.phone}
            whatsapp={site.contact.whatsapp}
          />

          {related.length > 0 && (
            <section className="wrap sec">
              <SectionHeader
                label={labels.more.label}
                titleLines={labels.more.title}
                action={
                  <ArrowButton href="/projects" reveal={120}>
                    {labels.more.all}
                  </ArrowButton>
                }
              />
              <div className="pgrid2 pgrid2--two">
                {related.map((other, i) => (
                  <ProjectCard key={other.slug} project={other} index={i} />
                ))}
              </div>
            </section>
          )}
        </div>
      </main>
      <Footer site={site} />
    </>
  );
}
