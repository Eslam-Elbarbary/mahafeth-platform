import type { MediaAsset } from '@/content/types';
import type { Locale } from '@/lib/i18n/config';

import { cmsMediaUrl } from '../client';
import type { CmsMedia } from '../types';

/** Last resort when a CMS item has no image in the CMS or the fallback. */
export const placeholderImage: MediaAsset = {
  src: '/images/media/poster-projects.jpg',
  width: 1920,
  height: 1080,
  alt: '',
};

/** `*Ar`/`*En` pair → the locale's value, falling back to the other language. */
export function pick(ar: string | null | undefined, en: string | null | undefined, locale: Locale) {
  const [first, second] = locale === 'ar' ? [ar, en] : [en, ar];
  return first?.trim() || second?.trim() || null;
}

/** Long text → paragraphs, split on blank lines. */
export const paragraphs = (text: string | null) =>
  text
    ?.split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean) ?? [];

export function toMediaAsset(media: CmsMedia, locale: Locale, alt = ''): MediaAsset {
  return {
    src: cmsMediaUrl(media.url),
    width: media.width ?? placeholderImage.width,
    height: media.height ?? placeholderImage.height,
    alt: pick(media.altAr, media.altEn, locale) ?? alt,
  };
}
