/* Mirrors `apps/backend/src/modules/pages` and `modules/sections` request/response shapes. */
import type { MediaSummary } from '@/features/media/types';
import type { PublishStatus } from '@/features/projects/types';

export { PUBLISH_STATUSES, publishMeta, type PublishStatus } from '@/features/projects/types';

export type SectionType =
  | 'HERO'
  | 'ABOUT'
  | 'STORY'
  | 'STATS'
  | 'TIMELINE'
  | 'PROJECTS_SHOWCASE'
  | 'SERVICES'
  | 'LEADERSHIP'
  | 'CONTACT'
  | 'INTEREST_FORM'
  | 'PARTNERS'
  | 'CTA'
  | 'VISION'
  | 'MISSION'
  | 'INTRO'
  | 'CONTACT_INFO'
  | 'BRANCHES'
  | 'MAP'
  | 'RICH_TEXT';

/** Bilingual `fooAr` / `fooEn` pairs, nested groups, lists and media ids — see `section-schemas`. */
export type SectionContent = Record<string, unknown>;

export type PageSection = {
  id: string;
  pageId: string;
  type: SectionType;
  titleAr: string | null;
  titleEn: string | null;
  content: SectionContent | null;
  imageId: string | null;
  image: MediaSummary | null;
  order: number;
  visible: boolean;
  updatedAt: string;
  /** Library items referenced by id inside `content`. */
  media: Record<string, MediaSummary>;
};

type PageBase = {
  id: string;
  slug: string;
  titleAr: string;
  titleEn: string;
  status: PublishStatus;
  /** Website route (`''` for the homepage). */
  path: string;
  createdAt: string;
  updatedAt: string;
};

export type PageListItem = PageBase & {
  /** Latest edit of the page or any of its sections. */
  lastEditedAt: string;
  _count: { sections: number };
};

export type PageDetail = PageBase & {
  metaTitleAr: string | null;
  metaTitleEn: string | null;
  metaDescriptionAr: string | null;
  metaDescriptionEn: string | null;
  ogImageId: string | null;
  ogImage: MediaSummary | null;
  sections: PageSection[];
  /** Section types this page accepts, in the website's default order. */
  sectionTypes: SectionType[];
  /** Always shown; cannot be hidden or deleted. */
  requiredSectionTypes: SectionType[];
};

export type PageInput = Pick<
  PageDetail,
  | 'titleAr'
  | 'titleEn'
  | 'metaTitleAr'
  | 'metaTitleEn'
  | 'metaDescriptionAr'
  | 'metaDescriptionEn'
  | 'ogImageId'
  | 'status'
>;

export type SectionInput = Pick<PageSection, 'titleAr' | 'titleEn' | 'imageId' | 'visible'> & {
  content: SectionContent;
};
