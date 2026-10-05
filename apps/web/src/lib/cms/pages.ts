import { cache } from 'react';

import {
  fallbackAboutVision,
  fallbackBranches,
  fallbackContactInfo,
  fallbackContactMap,
  fallbackLeadershipIntro,
  fallbackPageCta,
  getHomeContent,
  getPageContent,
  NEXT_PAGE,
  type CmsPageKey,
  type PageKey,
} from '@/content/fallback/pages';
import type {
  AboutContent,
  BranchesContent,
  ContactInfoContent,
  ContactMapContent,
  FigureStat,
  HomeContent,
  InterestContent,
  InterestFormLabels,
  InterestKey,
  InterestSectionContent,
  LeadershipContent,
  LeadershipIntroContent,
  MediaAsset,
  PageContent,
  PageCtaContent,
  ReachContent,
  StatementContent,
  TimelineItem,
} from '@/content/types';
import type { Locale } from '@/lib/i18n/config';

import { cmsFetch } from './client';
import { getGlobalContent } from './global-content';
import { paragraphs, toMediaAsset } from './mappers/common';
import { sectionReader, toPageCta, toStatement } from './mappers/page';
import type { CmsItem, CmsPage, CmsSection, CmsSectionType } from './types';

/*
 * Page content for the home, about, contact and leadership pages. A published CMS page is
 * authoritative for which sections show and in what order; each field falls back to the bundled
 * copy (`content/fallback/pages.ts`) when left empty. Without the CMS (disabled, unreachable or the
 * page unpublished) every page renders its bundled copy and layout.
 */

export type CmsPageSlug = 'home' | 'about' | 'contact' | 'leadership';

/** Title, description and sharing image for `pageMetadata`. */
export type PageSeo = { title: string; description: string; image?: MediaAsset };

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const isPayload = (body: unknown): body is CmsItem<CmsPage> =>
  isObject(body) &&
  isObject(body.data) &&
  typeof body.data.slug === 'string' &&
  Array.isArray(body.data.sections) &&
  body.data.sections.every((s: unknown) => isObject(s) && typeof s.type === 'string');

/** The published CMS page, or `null` when the bundled page should be used. */
export const getPage = cache(async (slug: CmsPageSlug): Promise<CmsPage | null> => {
  const result = await cmsFetch(`/pages/${slug}`, {
    tags: ['cms:pages', `cms:page:${slug}`],
    isValid: isPayload,
  });
  return result.state === 'ok' ? result.data.data : null;
});

/** Visible sections by type (one per type on catalog pages). */
function sectionsOf(page: CmsPage | null) {
  const byType = new Map<CmsSectionType, CmsSection>();
  for (const section of page?.sections ?? []) {
    if (!byType.has(section.type)) byType.set(section.type, section);
  }
  return byType;
}

/**
 * Display order of a page's blocks: the CMS order of its visible sections, or `defaults` without
 * a CMS page. `skip` drops blocks that have nothing to show.
 */
function blockOrder<B extends string>(
  page: CmsPage | null,
  types: Record<B, CmsSectionType>,
  defaults: B[],
  skip: B[] = [],
): B[] {
  const order = page
    ? page.sections.flatMap((s) =>
        (Object.keys(types) as B[]).filter((block) => types[block] === s.type),
      )
    : defaults;
  return [...new Set(order)].filter((block) => !skip.includes(block));
}

/* ───────────────────────────── Page frame ───────────────────────────── */

/** Crumb, SEO fields and cinematic hero of an internal page. */
function toPageHeader(page: CmsPage | null, key: CmsPageKey, locale: Locale): PageContent {
  const fallback = getPageContent(key, locale);
  if (!page) return fallback;
  const r = sectionReader(sectionsOf(page).get('HERO'), locale);
  const own = (ar: string | null, en: string | null) => (locale === 'ar' ? ar : en)?.trim() || '';
  return {
    meta: {
      title: own(page.metaTitleAr, page.metaTitleEn) || fallback.meta.title,
      description: own(page.metaDescriptionAr, page.metaDescriptionEn) || fallback.meta.description,
    },
    crumb: own(page.titleAr, page.titleEn) || fallback.crumb,
    hero: {
      eyebrow: r.optional('eyebrow', fallback.hero.eyebrow),
      titleLines: r.lines(fallback.hero.titleLines),
      lede: r.optional('subtitle', fallback.hero.lede),
      media: r.image(fallback.hero.media),
    },
  };
}

const isCmsPage = (key: PageKey): key is CmsPageKey =>
  key === 'about' || key === 'contact' || key === 'leadership';

/**
 * Hero, crumb and SEO fields of any internal page: from its CMS page (about, contact, leadership)
 * or from the global content (projects, services, partners).
 */
export async function getPageHeader(key: PageKey, locale: Locale): Promise<PageContent> {
  if (isCmsPage(key)) return toPageHeader(await getPage(key), key, locale);
  return (await getGlobalContent(locale)).headers[key];
}

/** The next page in the site journey, for the closing band of internal pages. */
export async function getNextPage(key: PageKey, locale: Locale) {
  const nextKey = NEXT_PAGE[key];
  const next = await getPageHeader(nextKey, locale);
  return { href: `/${nextKey}`, title: next.meta.title, image: next.hero.media };
}

/** The page's CMS sharing image, else `image`, else (unset) the site-wide default. */
function toSeo(
  page: CmsPage | null,
  header: PageContent,
  locale: Locale,
  image?: MediaAsset,
): PageSeo {
  return { ...header.meta, image: page?.ogImage ? toMediaAsset(page.ogImage, locale) : image };
}

/* ─────────────────────────────── Shared blocks ─────────────────────────────── */

function toFigures(section: CmsSection | undefined, locale: Locale, fallback: FigureStat[]) {
  const r = sectionReader(section, locale);
  const items = r.list('items').flatMap((row): FigureStat[] => {
    const raw = r.str(row.value);
    const value = Number(raw.replace(/\+/g, ''));
    const label = r.itemText(row, 'label');
    return raw && Number.isFinite(value) && label
      ? [{ value, plus: raw.includes('+'), label }]
      : [];
  });
  return items.length > 0 ? items : fallback;
}

function toStory(section: CmsSection | undefined, locale: Locale, fallback: AboutContent['story']) {
  const r = sectionReader(section, locale);
  const items = r.list('items').flatMap((row): TimelineItem[] => {
    const year = r.str(row.year);
    const title = r.itemText(row, 'title');
    if (!year || !title) return [];
    return [{ year, title, body: r.itemText(row, 'description'), current: row.current === true }];
  });
  return {
    label: r.text('label', fallback.label),
    items: items.length > 0 ? items : fallback.items,
  };
}

/**
 * The about block (home `ABOUT`, about-page `STORY`) with the timeline and figures it renders.
 * On a CMS page, a hidden timeline or figures section leaves that part out.
 */
function toAbout(
  page: CmsPage | null,
  type: 'ABOUT' | 'STORY',
  locale: Locale,
  fallback: AboutContent,
) {
  const sections = sectionsOf(page);
  const r = sectionReader(sections.get(type), locale);
  const [primary, secondary] = Array.isArray(r.value('imageIds'))
    ? (r.value('imageIds') as unknown[])
    : [];
  const timeline = sections.get('TIMELINE');
  const stats = sections.get('STATS');
  return {
    label: r.text('label', fallback.label),
    titleLines: r.lines(fallback.titleLines),
    primaryImage: r.media(primary, fallback.primaryImage),
    secondaryImage: r.media(secondary, fallback.secondaryImage),
    lede: r.text('description', fallback.lede),
    more: r.text('buttonText', fallback.more),
    less: r.text('buttonCloseText', fallback.less),
    story:
      page && !timeline
        ? { label: fallback.story.label, items: [] }
        : toStory(timeline, locale, fallback.story),
    figures: page && !stats ? [] : toFigures(stats, locale, fallback.figures),
  } satisfies AboutContent;
}

function toReach(section: CmsSection | undefined, locale: Locale, fallback: ReachContent) {
  const r = sectionReader(section, locale);
  const items = r.list('items').flatMap((row) => {
    const key = r.str(row.key) as InterestKey;
    const base = fallback.items.find((item) => item.key === key);
    if (!base) return [];
    return [
      {
        key,
        title: r.text('title', base.title, row),
        body: r.text('description', base.body, row),
        button: r.text('button', base.button, row),
      },
    ];
  });
  return {
    label: r.text('label', fallback.label),
    title: r.title(fallback.title),
    items: items.length > 0 ? items : fallback.items,
  };
}

/** Section copy from the page's `INTEREST_FORM`; field labels, options and errors are global. */
function toInterest(
  section: CmsSection | undefined,
  locale: Locale,
  fallback: InterestSectionContent,
  { again, ...form }: InterestFormLabels,
): InterestContent {
  const r = sectionReader(section, locale);
  const points = r
    .list('points')
    .map((row) => r.itemText(row, 'text'))
    .filter(Boolean);
  return {
    ...form,
    label: r.text('label', fallback.label),
    titleLines: r.lines(fallback.titleLines),
    lede: r.text('description', fallback.lede),
    points: points.length > 0 ? points : fallback.points,
    card: {
      title: r.text('cardTitle', fallback.card.title),
      body: r.text('cardBody', fallback.card.body),
    },
    submit: r.text('submit', fallback.submit),
    note: r.text('note', fallback.note),
    success: {
      title: r.text('successTitle', fallback.success.title),
      body: r.text('successBody', fallback.success.body),
      again,
    },
  };
}

function toLeadershipQuotes(
  section: CmsSection | undefined,
  locale: Locale,
  fallback: LeadershipContent,
): LeadershipContent {
  const r = sectionReader(section, locale);
  return {
    ...fallback,
    label: r.text('label', fallback.label),
    title: r.title(fallback.title),
    swipeHint: r.text('swipeHint', fallback.swipeHint),
  };
}

/* ─────────────────────────────── Home ─────────────────────────────── */

export type HomeBlock =
  'about' | 'showcase' | 'services' | 'leadership' | 'reach' | 'cta' | 'interest' | 'partners';

const HOME_BLOCKS: Record<HomeBlock, CmsSectionType> = {
  about: 'ABOUT',
  showcase: 'PROJECTS_SHOWCASE',
  services: 'SERVICES',
  leadership: 'LEADERSHIP',
  reach: 'CONTACT',
  cta: 'CTA',
  interest: 'INTEREST_FORM',
  partners: 'PARTNERS',
};

export type HomePage = {
  /** Every section's copy, hidden ones included (other pages reuse the services/partners copy). */
  content: HomeContent;
  /** Visible blocks under the hero, in display order. */
  blocks: HomeBlock[];
  cta: PageCtaContent;
  /** Hero coin artwork uploaded in the CMS; `null` keeps the bundled seal. */
  coinFace: string | null;
  /** Only what the CMS sets — the layout's site-wide SEO covers the rest. */
  seo: Partial<PageSeo>;
};

export const getHomepage = cache(async (locale: Locale): Promise<HomePage> => {
  const [page, global] = await Promise.all([getPage('home'), getGlobalContent(locale)]);
  const fb = getHomeContent(locale);
  const sections = sectionsOf(page);
  const hero = sectionReader(sections.get('HERO'), locale);
  const primary = hero.group('primaryButton');
  const secondary = hero.group('secondaryButton');
  const showcase = sectionReader(sections.get('PROJECTS_SHOWCASE'), locale);
  const showcaseButton = showcase.group('button');
  const services = sectionReader(sections.get('SERVICES'), locale);
  const partners = sectionReader(sections.get('PARTNERS'), locale);
  const own = (ar?: string | null, en?: string | null) =>
    (locale === 'ar' ? ar : en)?.trim() || undefined;

  const content: HomeContent = {
    ...fb,
    hero: {
      ...fb.hero,
      eyebrow: hero.text('eyebrow', fb.hero.eyebrow),
      titleLines: hero.lines(fb.hero.titleLines),
      sub: hero.text('subtitle', fb.hero.sub),
      cta: {
        ...fb.hero.cta,
        label: hero.text('label', fb.hero.cta.label, primary),
        href: hero.str(primary.href) || fb.hero.cta.href,
      },
      film: { ...fb.hero.film, label: hero.text('label', fb.hero.film.label, secondary) },
      backdrop: hero.image(fb.hero.backdrop),
      hint: hero.text('hint', fb.hero.hint),
    },
    about: toAbout(page, 'ABOUT', locale, fb.about),
    showcase: {
      ...fb.showcase,
      label: showcase.text('label', fb.showcase.label),
      title: showcase.title(fb.showcase.title),
      cta: {
        label: showcase.text('label', fb.showcase.cta.label, showcaseButton),
        href: showcase.str(showcaseButton.href) || fb.showcase.cta.href,
      },
      exploreLabel: showcase.text('exploreLabel', fb.showcase.exploreLabel),
    },
    services: {
      label: services.text('label', fb.services.label),
      titleLines: services.lines(fb.services.titleLines),
      more: services.text('linkLabel', fb.services.more),
    },
    leadership: toLeadershipQuotes(sections.get('LEADERSHIP'), locale, fb.leadership),
    reach: toReach(sections.get('CONTACT'), locale, fb.reach),
    interest: toInterest(sections.get('INTEREST_FORM'), locale, fb.interest, global.forms.interest),
    partners: {
      label: partners.text('label', fb.partners.label),
      lede: partners.text('description', fb.partners.lede),
    },
  };

  const coin = hero.media(hero.value('logoImageId'), undefined);
  const seoImage = page?.ogImage ? toMediaAsset(page.ogImage, locale) : undefined;
  return {
    content,
    blocks: blockOrder(page, HOME_BLOCKS, [
      'about',
      'showcase',
      'services',
      'leadership',
      'reach',
      'interest',
      'partners',
    ]),
    cta: toPageCta(sections.get('CTA'), locale, fallbackPageCta(locale)),
    coinFace: coin?.src ?? null,
    seo: {
      title: own(page?.metaTitleAr, page?.metaTitleEn),
      description: own(page?.metaDescriptionAr, page?.metaDescriptionEn),
      ...(seoImage && { image: seoImage }),
    },
  };
});

/* ─────────────────────────────── About ─────────────────────────────── */

export type AboutBlock = 'story' | 'vision' | 'mission' | 'cta';

const ABOUT_BLOCKS: Record<AboutBlock, CmsSectionType> = {
  story: 'STORY',
  vision: 'VISION',
  mission: 'MISSION',
  cta: 'CTA',
};

export type AboutPage = {
  seo: PageSeo;
  story: AboutContent;
  vision: StatementContent;
  mission: StatementContent;
  cta: PageCtaContent;
  blocks: AboutBlock[];
};

export const getAboutPage = cache(async (locale: Locale): Promise<AboutPage> => {
  const page = await getPage('about');
  const sections = sectionsOf(page);
  const header = toPageHeader(page, 'about', locale);
  const vision = fallbackAboutVision(locale);
  /* The mission has no bundled copy: it shows once its text is written in the CMS. */
  const mission = toStatement(sections.get('MISSION'), locale, {
    label: '',
    titleLines: [],
    body: '',
  });
  return {
    seo: toSeo(page, header, locale),
    story: toAbout(page, 'STORY', locale, getHomeContent(locale).about),
    vision: toStatement(sections.get('VISION'), locale, vision),
    mission,
    cta: toPageCta(sections.get('CTA'), locale, fallbackPageCta(locale)),
    blocks: blockOrder(page, ABOUT_BLOCKS, ['story', 'vision'], mission.body ? [] : ['mission']),
  };
});

/* ─────────────────────────────── Contact ─────────────────────────────── */

export type ContactBlock = 'reach' | 'interest' | 'info' | 'branches' | 'map' | 'cta';

const CONTACT_BLOCKS: Record<ContactBlock, CmsSectionType> = {
  reach: 'CONTACT',
  interest: 'INTEREST_FORM',
  info: 'CONTACT_INFO',
  branches: 'BRANCHES',
  map: 'MAP',
  cta: 'CTA',
};

export type ContactPage = {
  seo: PageSeo;
  reach: ReachContent;
  interest: InterestContent;
  info: ContactInfoContent;
  branches: BranchesContent;
  map: ContactMapContent;
  cta: PageCtaContent;
  blocks: ContactBlock[];
};

function toContactInfo(section: CmsSection | undefined, locale: Locale): ContactInfoContent {
  const fb = fallbackContactInfo(locale);
  const r = sectionReader(section, locale);
  const hours = r.own('hours');
  return {
    label: r.text('label', fb.label),
    titleLines: r.lines(fb.titleLines),
    lede: r.optional('description', fb.lede),
    phone: r.text('phoneLabel', fb.phone),
    whatsapp: r.text('whatsappLabel', fb.whatsapp),
    email: r.text('emailLabel', fb.email),
    ...(hours && { hours: { label: r.text('hoursLabel', ''), value: hours } }),
  };
}

function toContactMap(section: CmsSection | undefined, locale: Locale): ContactMapContent {
  const fb = fallbackContactMap(locale);
  const r = sectionReader(section, locale);
  const lat = r.value('latitude');
  const lng = r.value('longitude');
  return {
    ...fb,
    label: r.text('label', fb.label),
    titleLines: r.lines(fb.titleLines),
    lede: r.optional('description', fb.lede),
    address: r.text('address', fb.address),
    coordinates: typeof lat === 'number' && typeof lng === 'number' ? { lat, lng } : fb.coordinates,
    directions: r.text('directionsLabel', fb.directions),
  };
}

export const getContactPage = cache(async (locale: Locale): Promise<ContactPage> => {
  const [page, global] = await Promise.all([getPage('contact'), getGlobalContent(locale)]);
  const sections = sectionsOf(page);
  const fb = getHomeContent(locale);
  const branches = sectionReader(sections.get('BRANCHES'), locale);
  const branchesFb = fallbackBranches(locale);
  return {
    seo: toSeo(page, toPageHeader(page, 'contact', locale), locale),
    reach: toReach(sections.get('CONTACT'), locale, fb.reach),
    interest: toInterest(sections.get('INTEREST_FORM'), locale, fb.interest, global.forms.interest),
    info: toContactInfo(sections.get('CONTACT_INFO'), locale),
    branches: {
      label: branches.text('label', branchesFb.label),
      titleLines: branches.lines(branchesFb.titleLines),
      lede: branches.optional('description', branchesFb.lede),
    },
    map: toContactMap(sections.get('MAP'), locale),
    cta: toPageCta(sections.get('CTA'), locale, fallbackPageCta(locale)),
    blocks: blockOrder(page, CONTACT_BLOCKS, ['reach', 'interest']),
  };
});

/* ─────────────────────────────── Leadership ─────────────────────────────── */

export type LeadershipBlock = 'intro' | 'quotes' | 'cta';

const LEADERSHIP_BLOCKS: Record<LeadershipBlock, CmsSectionType> = {
  intro: 'INTRO',
  quotes: 'LEADERSHIP',
  cta: 'CTA',
};

export type LeadershipPage = {
  seo: PageSeo;
  intro: LeadershipIntroContent;
  quotes: LeadershipContent;
  cta: PageCtaContent;
  blocks: LeadershipBlock[];
};

export const getLeadershipPage = cache(async (locale: Locale): Promise<LeadershipPage> => {
  const page = await getPage('leadership');
  const sections = sectionsOf(page);
  const header = toPageHeader(page, 'leadership', locale);
  const fbIntro = fallbackLeadershipIntro(locale);
  const intro = sectionReader(sections.get('INTRO'), locale);
  const body = paragraphs(intro.own('description') || null);
  /* The closing band sits over the hero image unless the CTA section has its own. */
  const ctaFallback = { ...fallbackPageCta(locale), image: header.hero.media };
  return {
    seo: toSeo(page, header, locale, header.hero.media),
    intro: {
      label: intro.text('label', fbIntro.label),
      titleLines: intro.lines(fbIntro.titleLines),
      body: body.length > 0 ? body : fbIntro.body,
      members: intro.text('membersLabel', fbIntro.members),
    },
    quotes: toLeadershipQuotes(
      sections.get('LEADERSHIP'),
      locale,
      getHomeContent(locale).leadership,
    ),
    cta: toPageCta(sections.get('CTA'), locale, ctaFallback),
    blocks: blockOrder(page, LEADERSHIP_BLOCKS, ['intro', 'quotes', 'cta']),
  };
});

/** Last CMS edit of a page (page fields or any visible section), for the sitemap. */
export async function pageLastModified(slug: CmsPageSlug): Promise<Date | undefined> {
  const page = await getPage(slug);
  if (!page) return undefined;
  const times = [page.updatedAt, ...page.sections.map((s) => s.updatedAt)]
    .map((value) => Date.parse(value))
    .filter(Number.isFinite);
  return times.length > 0 ? new Date(Math.max(...times)) : undefined;
}
