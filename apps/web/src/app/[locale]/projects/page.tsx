import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { InternalPage } from '@/components/page/InternalPage';
import { SectionHeader } from '@/components/page/SectionHeader';
import { ProjectCard } from '@/components/projects/ProjectCard';
import { getHomepage, getPageHeader } from '@/lib/cms/pages';
import { getProjects } from '@/lib/cms/projects';
import { isLocale } from '@/lib/i18n/config';
import { pageMetadata } from '@/lib/seo';

type PageProps = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  return pageMetadata(locale, '/projects', (await getPageHeader('projects', locale)).meta);
}

/* First pass: featured portfolio grid. Filters, map and the full project register come next. */
export default async function ProjectsPage({ params }: PageProps) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const [home, projects] = await Promise.all([getHomepage(locale), getProjects(locale)]);
  const { showcase } = home.content;

  return (
    <InternalPage locale={locale} page="projects">
      <section className="wrap sec">
        <SectionHeader label={showcase.label} titleLines={[showcase.title]} />
        <div className="pgrid2">
          {projects.map((project, i) => (
            <ProjectCard key={project.slug} project={project} index={i} />
          ))}
        </div>
      </section>
    </InternalPage>
  );
}
