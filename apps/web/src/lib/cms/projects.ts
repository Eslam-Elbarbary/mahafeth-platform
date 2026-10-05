import { cache } from 'react';

import {
  fallbackProjectCards,
  fallbackProjectDetail,
  fallbackProjectFields,
} from '@/content/fallback/projects';
import type { NavLink, ProjectDetail, ShowcaseProject } from '@/content/types';
import type { Locale } from '@/lib/i18n/config';

import { cmsFetch } from './client';
import { toProjectDetail, toShowcaseProject } from './mappers/project';
import type { CmsItem, CmsList, CmsProject } from './types';

export { getProjectDetailLabels } from '@/content/project-copy';
export { projectInterestHref } from '@/lib/project-links';

/*
 * Project data source for pages. The CMS is authoritative whenever it serves at least one
 * published project; if it is disabled, unreachable or empty, every call answers from the
 * temporary content in `content/fallback`, so the site renders the same either way.
 */

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

const isProject = (value: unknown): value is CmsProject =>
  isObject(value) &&
  typeof value.id === 'string' &&
  typeof value.slug === 'string' &&
  typeof value.titleAr === 'string' &&
  typeof value.titleEn === 'string' &&
  typeof value.status === 'string' &&
  Array.isArray(value.gallery);

const isList = (body: unknown): body is CmsList<CmsProject> =>
  isObject(body) && Array.isArray(body.data) && body.data.every(isProject);

const isItem = (body: unknown): body is CmsItem<CmsProject> =>
  isObject(body) && isProject(body.data);

/** Published CMS projects, or `null` when the fallback content should be used instead. */
const loadPublished = cache(async (): Promise<CmsProject[] | null> => {
  const result = await cmsFetch('/projects?pageSize=100', {
    tags: ['cms:projects'],
    isValid: isList,
  });
  return result.state === 'ok' && result.data.data.length > 0 ? result.data.data : null;
});

const loadProject = cache((slug: string) =>
  cmsFetch(`/projects/${encodeURIComponent(slug)}`, {
    tags: ['cms:projects', `cms:project:${slug}`],
    isValid: isItem,
  }),
);

/** Slides in the home showcase — the pinned stack is paced for a handful of projects. */
const FEATURED_LIMIT = 6;
/** Project links in the header mega menu and footer, before "Explore all projects". */
const NAVIGATION_LIMIT = 7;

function toCards(projects: CmsProject[], locale: Locale): ShowcaseProject[] {
  const fallback = fallbackProjectCards(locale);
  return projects.map((project) =>
    toShowcaseProject(
      project,
      locale,
      fallback.find((card) => card.slug === project.slug),
    ),
  );
}

/** Every published project, in the CMS order (featured first, then `order`, then newest). */
export async function getProjects(locale: Locale): Promise<ShowcaseProject[]> {
  const published = await loadPublished();
  return published ? toCards(published, locale) : fallbackProjectCards(locale);
}

/**
 * Featured projects for the home showcase. When the CMS has published projects but none is
 * marked featured, the first published ones stand in so the section never renders empty.
 */
export async function getFeaturedProjects(locale: Locale): Promise<ShowcaseProject[]> {
  const published = await loadPublished();
  if (!published) return fallbackProjectCards(locale).slice(0, FEATURED_LIMIT);
  const featured = published.filter((project) => project.featured);
  return toCards((featured.length > 0 ? featured : published).slice(0, FEATURED_LIMIT), locale);
}

/** Project links (title, URL and cover thumbnail) for the header mega menu and the footer. */
export async function getProjectNavigation(locale: Locale): Promise<NavLink[]> {
  return (await getProjects(locale))
    .slice(0, NAVIGATION_LIMIT)
    .map(({ name, href, image }) => ({ label: name, href, image }));
}

export async function projectSlugs(): Promise<string[]> {
  const published = await loadPublished();
  return (published ?? fallbackProjectCards('ar')).map((project) => project.slug);
}

export async function getProjectDetail(
  slug: string,
  locale: Locale,
): Promise<ProjectDetail | null> {
  if (await loadPublished()) {
    const result = await loadProject(slug);
    if (result.state === 'missing') return null;
    if (result.state === 'ok') {
      return toProjectDetail(result.data.data, locale, {
        card: fallbackProjectCards(locale).find((card) => card.slug === slug),
        fields: fallbackProjectFields(slug, locale),
      });
    }
  }
  return fallbackProjectDetail(slug, locale);
}

export async function getRelatedProjects(slug: string, locale: Locale): Promise<ShowcaseProject[]> {
  return (await getProjects(locale)).filter((project) => project.slug !== slug);
}
