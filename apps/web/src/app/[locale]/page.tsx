import type { Metadata } from 'next';
import { Fragment, type ReactNode } from 'react';

import { About } from '@/components/home/About';
import { Aura } from '@/components/home/Aura';
import { Hero } from '@/components/home/Hero';
import { InterestForm } from '@/components/home/InterestForm';
import { LeadershipQuotes } from '@/components/home/LeadershipQuotes';
import { PartnersMarquee } from '@/components/home/PartnersMarquee';
import { ProjectsShowcase } from '@/components/home/ProjectsShowcase';
import { Reach } from '@/components/home/Reach';
import { ServicesAccordion } from '@/components/home/ServicesAccordion';
import { Footer } from '@/components/layout/Footer';
import { FilmModal } from '@/components/overlays/FilmModal';
import { IntroOverlay } from '@/components/overlays/IntroOverlay';
import { PageCta } from '@/components/page/PageCta';
import { siteConfig } from '@/config/site';
import { getHomepage, type HomeBlock } from '@/lib/cms/pages';
import { getPartners } from '@/lib/cms/partners';
import { getFeaturedProjects, getProjects } from '@/lib/cms/projects';
import { getServices } from '@/lib/cms/services';
import { getSettings } from '@/lib/cms/settings';
import { getSite } from '@/lib/cms/site';
import { getLeadershipMembers } from '@/lib/cms/team';
import { isLocale } from '@/lib/i18n/config';

type PageProps = { params: Promise<{ locale: string }> };

/* The layout sets the site-wide SEO; the home page only overrides what its CMS page defines. */
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const [{ seo }, settings] = await Promise.all([getHomepage(locale), getSettings(locale)]);
  if (!seo.title && !seo.description && !seo.image) return {};
  const title = seo.title ?? settings.seo.title;
  const description = seo.description ?? settings.seo.description;
  const image = seo.image
    ? { url: seo.image.src, width: seo.image.width, height: seo.image.height, alt: seo.image.alt }
    : settings.seo.ogImage && { url: settings.seo.ogImage };
  return {
    title,
    description,
    openGraph: {
      type: 'website',
      siteName: settings.companyName,
      title,
      description,
      locale,
      ...(image && { images: [image] }),
    },
  };
}

/** Swaps the hero coin artwork for the one uploaded in the CMS (both coin faces). */
const coinFaceStyle = (src: string) =>
  `.coin__f,.coin__b{background-image:url(${JSON.stringify(src)})}`.replace(/</g, '\\3c ');

export default async function HomePage({ params }: PageProps) {
  const { locale } = await params;
  if (!isLocale(locale)) return null;
  const [page, site, featured, allProjects, services, leaders, partners] = await Promise.all([
    getHomepage(locale),
    getSite(locale),
    getFeaturedProjects(locale),
    getProjects(locale),
    getServices(locale),
    getLeadershipMembers(locale),
    getPartners(locale),
  ]);
  const home = page.content;
  const projects = allProjects.map(({ slug, name, city }) => ({ slug, name, city }));

  const blocks: Record<HomeBlock, () => ReactNode> = {
    about: () => <About content={home.about} />,
    showcase: () => (
      <ProjectsShowcase content={home.showcase} projects={featured} badge={site.brand.logo} />
    ),
    services: () => <ServicesAccordion content={home.services} items={services} />,
    leadership: () => <LeadershipQuotes content={home.leadership} members={leaders} />,
    reach: () => <Reach content={home.reach} />,
    cta: () => <PageCta content={page.cta} site={site} id="home-cta" />,
    interest: () => <InterestForm content={home.interest} projects={projects} />,
    partners: () => <PartnersMarquee content={home.partners} logos={partners} />,
  };

  return (
    <>
      {page.coinFace && <style>{coinFaceStyle(page.coinFace)}</style>}
      <IntroOverlay {...home.intro} />

      <div className="stage" id="stage">
        <Aura sparks={home.sparks} />
        <Hero content={home.hero} />
      </div>
      <div className="hero-space" aria-hidden="true" />

      <div className="sheet" id="sheet">
        <span className="sheet__grip" aria-hidden="true" />
        <main id="top">
          {page.blocks.map((block) => (
            <Fragment key={block}>{blocks[block]()}</Fragment>
          ))}
        </main>
        <Footer site={site} />
      </div>

      <FilmModal
        src={siteConfig.filmUrl}
        poster={home.hero.film.poster}
        label={home.hero.film.dialogLabel}
      />
    </>
  );
}
