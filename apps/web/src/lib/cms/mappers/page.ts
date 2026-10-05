import type { MediaAsset, PageCtaContent, StatementContent } from '@/content/types';
import type { Locale } from '@/lib/i18n/config';

import type { CmsMedia, CmsSection } from '../types';
import { pick, toMediaAsset } from './common';

type Row = Record<string, unknown>;

const isRow = (value: unknown): value is Row =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const str = (value: unknown) => (typeof value === 'string' ? value.trim() : '');

/**
 * Reads one CMS section for a locale. Every accessor takes the bundled value and returns it when
 * the CMS field is empty, so a half-filled section never blanks part of the design. List fields
 * (timeline, figures…) replace the bundled list as a whole once they hold at least one entry.
 */
export function sectionReader(section: CmsSection | undefined, locale: Locale) {
  const content: Row = isRow(section?.content) ? section.content : {};
  const suffix = locale === 'ar' ? 'Ar' : 'En';

  /** Uploaded media keeps the bundled image's alt text (when it has none) and art direction. */
  const asset = (media: CmsMedia, fallback?: MediaAsset): MediaAsset => {
    const image = toMediaAsset(media, locale, fallback?.alt);
    return fallback?.position ? { ...image, position: fallback.position } : image;
  };

  return {
    /** `<key>Ar` / `<key>En` of `row` (the content itself by default) for this locale. */
    own: (key: string, row: Row = content) => str(row[`${key}${suffix}`]),
    text(key: string, fallback: string, row: Row = content) {
      return this.own(key, row) || fallback;
    },
    optional(key: string, fallback?: string) {
      return this.own(key) || fallback || undefined;
    },
    /** Item text in a CMS list: this locale, else the other one (items have no bundled copy). */
    itemText: (row: Row, key: string) => pick(str(row[`${key}Ar`]), str(row[`${key}En`]), locale) ?? '',
    /** Section title (`titleAr` / `titleEn`), one heading line per text line. */
    lines(fallback: string[]) {
      const title = str(locale === 'ar' ? section?.titleAr : section?.titleEn);
      const lines = title
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter(Boolean);
      return lines.length > 0 ? lines : fallback;
    },
    /** Section title as a single-line heading. */
    title(fallback: string) {
      return this.lines([fallback]).join(' ');
    },
    /** The section's main image (`imageId`). */
    image<F extends MediaAsset | undefined>(fallback: F): F | MediaAsset {
      return section?.image ? asset(section.image, fallback) : fallback;
    },
    /** Media referenced by id inside `content` (resolved by the API in `section.media`). */
    media<F extends MediaAsset | undefined>(id: unknown, fallback: F): F | MediaAsset {
      const item = typeof id === 'string' ? section?.media?.[id] : undefined;
      return item ? asset(item, fallback) : fallback;
    },
    list: (key: string) => (Array.isArray(content[key]) ? content[key].filter(isRow) : []),
    group: (key: string): Row => (isRow(content[key]) ? content[key] : {}),
    value: (key: string) => content[key],
    str,
  };
}

export type SectionReader = ReturnType<typeof sectionReader>;

/** Label, heading, paragraph and image (about vision / mission). */
export function toStatement(
  section: CmsSection | undefined,
  locale: Locale,
  fallback: StatementContent,
): StatementContent {
  const r = sectionReader(section, locale);
  return {
    label: r.text('label', fallback.label),
    titleLines: r.lines(fallback.titleLines),
    body: r.text('description', fallback.body),
    image: r.image(fallback.image),
  };
}

export function toPageCta(
  section: CmsSection | undefined,
  locale: Locale,
  fallback: PageCtaContent,
): PageCtaContent {
  const r = sectionReader(section, locale);
  const button = r.group('button');
  return {
    label: r.text('label', fallback.label),
    titleLines: r.lines(fallback.titleLines),
    body: r.text('description', fallback.body),
    button: {
      label: r.text('label', fallback.button.label, button),
      href: r.str(button.href) || fallback.button.href,
    },
    call: r.text('callLabel', fallback.call),
    whatsapp: r.text('whatsappLabel', fallback.whatsapp),
    image: r.image(fallback.image),
  };
}
