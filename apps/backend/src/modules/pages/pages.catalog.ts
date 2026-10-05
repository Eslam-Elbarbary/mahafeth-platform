import { SectionType } from '../../generated/prisma/client.js';

/**
 * Pages the website renders from fixed section schemas. Each page accepts one section per listed
 * type; the order here is the website's current layout. `hidden` types have no block in the current
 * design yet: they are created invisible so enabling them is an explicit admin decision.
 */
export type PageDefinition = {
  titleAr: string;
  titleEn: string;
  /** Locale-relative website path. */
  path: string;
  sections: SectionType[];
  hidden?: SectionType[];
};

export const pageCatalog = {
  home: {
    titleAr: 'الرئيسية',
    titleEn: 'Home',
    path: '',
    sections: [
      SectionType.HERO,
      SectionType.ABOUT,
      SectionType.TIMELINE,
      SectionType.STATS,
      SectionType.PROJECTS_SHOWCASE,
      SectionType.SERVICES,
      SectionType.LEADERSHIP,
      SectionType.CONTACT,
      SectionType.CTA,
      SectionType.INTEREST_FORM,
      SectionType.PARTNERS,
    ],
    hidden: [SectionType.CTA],
  },
  about: {
    titleAr: 'عن محافظ',
    titleEn: 'About',
    path: '/about',
    sections: [
      SectionType.HERO,
      SectionType.STORY,
      SectionType.TIMELINE,
      SectionType.STATS,
      SectionType.VISION,
      SectionType.MISSION,
      SectionType.CTA,
    ],
    hidden: [SectionType.MISSION, SectionType.CTA],
  },
  contact: {
    titleAr: 'تواصل معنا',
    titleEn: 'Contact',
    path: '/contact',
    sections: [
      SectionType.HERO,
      SectionType.CONTACT,
      SectionType.INTEREST_FORM,
      SectionType.CONTACT_INFO,
      SectionType.BRANCHES,
      SectionType.MAP,
      SectionType.CTA,
    ],
    hidden: [SectionType.CONTACT_INFO, SectionType.BRANCHES, SectionType.MAP, SectionType.CTA],
  },
  leadership: {
    titleAr: 'كلمة الإدارة',
    titleEn: 'Leadership',
    path: '/leadership',
    sections: [SectionType.HERO, SectionType.INTRO, SectionType.LEADERSHIP, SectionType.CTA],
  },
} satisfies Record<string, PageDefinition>;

export type CatalogPageSlug = keyof typeof pageCatalog;

export const catalogPage = (slug: string): PageDefinition | undefined =>
  (pageCatalog as Record<string, PageDefinition>)[slug];

/** Section types a page accepts: its catalog entry, or every type for pages outside the catalog. */
export const sectionTypesFor = (slug: string): SectionType[] =>
  catalogPage(slug)?.sections ?? Object.values(SectionType);

/** Always rendered by the website frame; the admin cannot hide or delete them. */
export const requiredSectionTypes: SectionType[] = [SectionType.HERO];
