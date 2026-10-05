import { getHomeContent } from '@/content/fallback/pages';
import {
  completionLabel,
  composeProjectDetail,
  projectFacts,
  projectLinkLabel,
  statusLabels,
  type ProjectDetailFields,
} from '@/content/project-copy';
import type { CityKey, ProjectDetail, ProjectGalleryItem, ShowcaseProject } from '@/content/types';
import type { Locale } from '@/lib/i18n/config';

import type { CmsProject, CmsProjectImage, CmsProjectImageCategory } from '../types';
import { paragraphs, pick, placeholderImage, toMediaAsset } from './common';

/*
 * CMS DTO → view model. `*Ar`/`*En` pairs resolve to the locale (falling back to the other
 * language), and any detail the CMS leaves empty is taken from the temporary content for the
 * same slug, so a partially filled project still renders the full page.
 */

const ofCategory = (images: CmsProjectImage[], category: CmsProjectImageCategory) =>
  images.filter((image) => image.category === category).sort((a, b) => a.order - b.order);

function toGalleryItems(images: CmsProjectImage[], locale: Locale, name: string) {
  return images.map<ProjectGalleryItem>((image) => {
    const caption = pick(image.captionAr, image.captionEn, locale) ?? '';
    return { image: toMediaAsset(image.media, locale, caption || name), caption };
  });
}

function cityLabel(city: string, locale: Locale) {
  const pin = getHomeContent(locale).showcase.pins.find((p) => p.city === city);
  return pin?.label ?? city.charAt(0).toUpperCase() + city.slice(1);
}

export function toShowcaseProject(
  project: CmsProject,
  locale: Locale,
  fallback?: ShowcaseProject,
): ShowcaseProject {
  const name = pick(project.titleAr, project.titleEn, locale) ?? project.slug;
  const cover = project.coverImage ?? ofCategory(project.gallery, 'COVER')[0]?.media;
  const facts = projectFacts(
    {
      units: project.unitsCount ?? undefined,
      area: project.sizeRange ? [project.sizeRange.min, project.sizeRange.max] : undefined,
      completion: project.completionYear ?? undefined,
    },
    locale,
  );

  return {
    slug: project.slug,
    name,
    city: project.city as CityKey,
    location:
      pick(project.locationAr, project.locationEn, locale) ??
      fallback?.location ??
      cityLabel(project.city, locale),
    status: project.status,
    statusLabel: statusLabels[project.status][locale],
    image: cover
      ? toMediaAsset(cover, locale, name)
      : (fallback?.image ?? { ...placeholderImage, alt: name }),
    href: `/projects/${project.slug}`,
    linkLabel: projectLinkLabel(name, locale),
    facts: facts.length > 0 ? facts : (fallback?.facts ?? []),
  };
}

export function toProjectDetail(
  project: CmsProject,
  locale: Locale,
  fallback: { card?: ShowcaseProject; fields?: ProjectDetailFields | null } = {},
): ProjectDetail {
  const card = toShowcaseProject(project, locale, fallback.card);
  const fb = fallback.fields ?? undefined;
  const summary = pick(project.summaryAr, project.summaryEn, locale) ?? fb?.summary ?? '';
  const description = paragraphs(pick(project.descriptionAr, project.descriptionEn, locale));
  const locationParts = card.location.split(/[،,]/).map((part) => part.trim());
  const gallery = toGalleryItems(ofCategory(project.gallery, 'GALLERY'), locale, card.name);
  const floorPlans = toGalleryItems(ofCategory(project.gallery, 'FLOOR_PLAN'), locale, card.name);
  const { latitude: lat, longitude: lng } = project;

  const fields: ProjectDetailFields = {
    id: project.id,
    cityLabel: fb?.cityLabel ?? cityLabel(project.city, locale),
    district: fb?.district ?? locationParts.at(-1) ?? card.location,
    summary,
    description: description.length > 0 ? description : (fb?.description ?? [summary]),
    units: project.unitsCount ?? fb?.units ?? 0,
    area: project.sizeRange ? [project.sizeRange.min, project.sizeRange.max] : (fb?.area ?? [0, 0]),
    completion: project.completionYear ?? fb?.completion ?? 0,
    completionLabel: project.completionYear
      ? completionLabel(project.status, project.completionYear, locale)
      : (fb?.completionLabel ?? card.statusLabel),
    features: project.features?.length
      ? project.features.map((f) => ({
          icon: f.icon,
          title: pick(f.titleAr, f.titleEn, locale) ?? '',
          body: pick(f.bodyAr, f.bodyEn, locale) ?? '',
        }))
      : (fb?.features ?? []),
    gallery:
      gallery.length > 0 ? gallery : (fb?.gallery ?? [{ image: card.image, caption: card.name }]),
    ...(floorPlans.length > 0 && { floorPlans }),
    coordinates: lat !== null && lng !== null ? { lat, lng } : (fb?.coordinates ?? null),
  };

  return composeProjectDetail(card, fields, locale);
}
