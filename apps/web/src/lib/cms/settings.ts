import { cache } from 'react';

import { fallbackBrand, fallbackSettings } from '@/content/fallback/settings';
import { localize } from '@/content/localize';
import type { MediaAsset, NavLink, SiteSettings } from '@/content/types';
import type { Locale } from '@/lib/i18n/config';

import { cmsFetch, cmsMediaUrl } from './client';
import { pick } from './mappers/common';
import type { CmsItem, CmsSettings } from './types';

/*
 * Global settings (branding, contact, social, SEO, footer). Each field falls back on its own: an
 * empty or missing CMS value uses the bundled value, so a half-filled CMS never blanks the chrome.
 */

type Row = Record<string, unknown>;

const isObject = (value: unknown): value is Row =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const isPayload = (body: unknown): body is CmsItem<CmsSettings> =>
  isObject(body) && isObject(body.data);

const group = (value: unknown): Row => (isObject(value) ? value : {});
const str = (value: unknown) => (typeof value === 'string' ? value.trim() : '');
const rows = (value: unknown) => (Array.isArray(value) ? value.filter(isObject) : []);

/** Raw public settings from the CMS, or `null` when it is disabled or unreachable. */
export const getPublicSettings = cache(async (): Promise<CmsSettings | null> => {
  const result = await cmsFetch('/settings', { isValid: isPayload });
  return result.state === 'ok' ? result.data.data : null;
});

/** The CMS logo is served at its uploaded size; the site renders it square (42px / 120px). */
const logoAsset = (url: string): MediaAsset => ({
  src: cmsMediaUrl(url),
  width: 512,
  height: 512,
  alt: '',
});

export async function getSettings(locale: Locale): Promise<SiteSettings> {
  const cms = group(await getPublicSettings());
  const branding = group(cms.branding);
  const contact = group(cms.contact);
  const social = group(cms.social);
  const seo = group(cms.seo);
  const footer = group(cms.footer);
  const fb = fallbackSettings;

  const text = (ar: unknown, en: unknown, fallbackAr: string, fallbackEn: string) =>
    pick(str(ar), str(en), locale) ?? pick(fallbackAr, fallbackEn, locale) ?? '';

  const branches = rows(contact.branches).filter((b) => str(b.cityAr) || str(b.cityEn));
  const legalLinks = rows(footer.legalLinks).filter((l) => str(l.titleAr) || str(l.titleEn));
  const logo = str(branding.logo);
  const favicon = str(branding.favicon);
  const ogImage = str(seo.ogImage);
  const profile = (value: unknown) => str(value) || '#';

  return {
    companyName: text(
      branding.companyNameAr,
      branding.companyNameEn,
      fb.branding.companyNameAr,
      fb.branding.companyNameEn,
    ),
    logo: logo ? logoAsset(logo) : localize<MediaAsset>(fallbackBrand.logo, locale),
    seal: logo ? logoAsset(logo) : localize<MediaAsset>(fallbackBrand.seal, locale),
    favicon: favicon ? cmsMediaUrl(favicon) : fallbackBrand.favicon,
    contact: {
      phone: str(contact.phone) || fb.contact.phone,
      whatsapp: str(contact.whatsapp) || fb.contact.whatsapp,
      email: str(contact.email) || fb.contact.email,
      branches: (branches.length > 0 ? branches : fb.contact.branches).map((b) => ({
        city: pick(str(b.cityAr), str(b.cityEn), locale) ?? '',
        address: pick(str(b.addressAr), str(b.addressEn), locale) ?? '',
        phone: str(b.phone),
      })),
    },
    social: {
      instagram: profile(social.instagram),
      linkedin: profile(social.linkedin),
      x: profile(social.twitter),
      snapchat: profile(social.snapchat),
    },
    seo: {
      title: text(seo.titleAr, seo.titleEn, fb.seo.titleAr, fb.seo.titleEn),
      description: text(
        seo.descriptionAr,
        seo.descriptionEn,
        fb.seo.descriptionAr,
        fb.seo.descriptionEn,
      ),
      ogImage: ogImage ? cmsMediaUrl(ogImage) : null,
    },
    footer: {
      legal: (legalLinks.length > 0 ? legalLinks : fb.footer.legalLinks).map(
        (l): NavLink => ({
          label: pick(str(l.titleAr), str(l.titleEn), locale) ?? '',
          href: str(l.url) || '#',
        }),
      ),
    },
  };
}
