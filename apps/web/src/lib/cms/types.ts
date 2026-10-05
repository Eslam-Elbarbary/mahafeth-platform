import type { ProjectFeatureIcon, ProjectStatus } from '@/content/types';

/* Response shapes of the public projects API (`GET /projects`, `GET /projects/:slug`). */

export type CmsMedia = {
  id: string;
  url: string;
  mimeType: string;
  width: number | null;
  height: number | null;
  altAr: string | null;
  altEn: string | null;
};

export type CmsProjectImageCategory = 'COVER' | 'GALLERY' | 'FLOOR_PLAN';

export type CmsProjectImage = {
  id: string;
  category: CmsProjectImageCategory;
  captionAr: string | null;
  captionEn: string | null;
  order: number;
  media: CmsMedia;
};

export type CmsProjectFeature = {
  icon: ProjectFeatureIcon;
  titleAr: string;
  titleEn: string;
  bodyAr?: string | null;
  bodyEn?: string | null;
};

export type CmsProject = {
  id: string;
  slug: string;
  titleAr: string;
  titleEn: string;
  summaryAr: string | null;
  summaryEn: string | null;
  descriptionAr: string | null;
  descriptionEn: string | null;
  city: string;
  locationAr: string | null;
  locationEn: string | null;
  status: ProjectStatus;
  featured: boolean;
  order: number;
  unitsCount: number | null;
  sizeRange: { min: number; max: number } | null;
  completionYear: number | null;
  features: CmsProjectFeature[] | null;
  latitude: number | null;
  longitude: number | null;
  coverImage: CmsMedia | null;
  /** List: the first `COVER` image only. Detail: every image, by category then order. */
  gallery: CmsProjectImage[];
};

/* `GET /services`, `GET /services/:slug` — published only, ordered by `order` then creation. */
export type CmsService = {
  id: string;
  slug: string;
  titleAr: string;
  titleEn: string;
  summaryAr: string | null;
  summaryEn: string | null;
  descriptionAr: string | null;
  descriptionEn: string | null;
  icon: string | null;
  order: number;
  metaTitleAr: string | null;
  metaTitleEn: string | null;
  metaDescriptionAr: string | null;
  metaDescriptionEn: string | null;
  image: CmsMedia | null;
};

/* `GET /partners` — visible only, ordered by `order` then creation. */
export type CmsPartner = {
  id: string;
  nameAr: string;
  nameEn: string;
  websiteUrl: string | null;
  order: number;
  logo: CmsMedia | null;
};

/* `GET /team` — visible only, ordered by `order` then creation. */
export type CmsTeamMember = {
  id: string;
  nameAr: string;
  nameEn: string;
  positionAr: string;
  positionEn: string;
  bioAr: string | null;
  bioEn: string | null;
  order: number;
  photo: CmsMedia | null;
};

/*
 * `GET /settings` — public settings nested by key (`contact.phone` → `contact: { phone }`), media
 * already resolved to URLs (`""` when unset). Admins can clear or remove any key, so every field
 * is optional and read defensively.
 */
export type CmsBranch = {
  cityAr: string;
  cityEn: string;
  addressAr: string;
  addressEn: string;
  phone: string;
};

export type CmsLegalLink = { titleAr: string; titleEn: string; url: string };

export type CmsSettings = {
  branding?: { logo?: string; favicon?: string; companyNameAr?: string; companyNameEn?: string };
  contact?: { phone?: string; whatsapp?: string; email?: string; branches?: CmsBranch[] };
  social?: { instagram?: string; linkedin?: string; twitter?: string; snapchat?: string };
  seo?: {
    titleAr?: string;
    titleEn?: string;
    descriptionAr?: string;
    descriptionEn?: string;
    ogImage?: string;
  };
  footer?: { legalLinks?: CmsLegalLink[] };
  /* Global content: flat `<field>Ar` / `<field>En` strings per group (`lib/cms/global-content.ts`). */
  navigation?: { labels?: CmsContentGroup };
  forms?: { interest?: CmsContentGroup };
  global?: { buttons?: CmsContentGroup; labels?: CmsContentGroup };
  headers?: Partial<Record<'projects' | 'services' | 'partners', CmsHeaderGroup>>;
};

export type CmsContentGroup = Record<string, unknown>;

/** A page header group; `image` is resolved from its `imageId` (`null` when unset or deleted). */
export type CmsHeaderGroup = CmsContentGroup & { imageId?: string | null; image?: CmsMedia | null };

/*
 * `GET /pages/:slug` — published pages only, visible sections in display order. `content` is the
 * section's bilingual fields (`fooAr` / `fooEn`, media ids) as validated per type by the backend;
 * `media` resolves the ids it references. Every field may be empty and is read defensively.
 */
export type CmsSectionType =
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

export type CmsSection = {
  id: string;
  type: CmsSectionType;
  titleAr: string | null;
  titleEn: string | null;
  content: Record<string, unknown> | null;
  image: CmsMedia | null;
  order: number;
  updatedAt: string;
  media: Record<string, CmsMedia>;
};

export type CmsPage = {
  id: string;
  slug: string;
  titleAr: string;
  titleEn: string;
  metaTitleAr: string | null;
  metaTitleEn: string | null;
  metaDescriptionAr: string | null;
  metaDescriptionEn: string | null;
  ogImage: CmsMedia | null;
  updatedAt: string;
  sections: CmsSection[];
};

export type CmsList<T> = { data: T[]; meta?: { total: number } };
export type CmsItem<T> = { data: T };
