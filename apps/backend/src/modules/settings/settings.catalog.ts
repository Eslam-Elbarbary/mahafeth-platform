import { z } from 'zod';

import {
  buttonFields,
  contentDefault,
  contentSchema,
  interestFormFields,
  labelFields,
  navigationFields,
  pageHeaderFields,
  pageHeaderSchema,
} from './global-content.js';

/*
 * Global website settings the admin edits and the website reads (`GET /settings`). One row per
 * key; the first key segment is the group, so the public payload nests as `{ branding: { … } }`.
 * Media settings store `{ mediaId }` and are resolved to URLs for the public payload.
 * Defaults mirror the website's current content and are applied by the seed to empty values only.
 */

const text = (max: number) => z.string().trim().max(max);

/** `#`, a site path, `http(s)://`, `mailto:` or `tel:` — or empty. */
const link = text(500).refine(
  (v) => v === '' || v === '#' || v.startsWith('/') || /^(https?:\/\/|mailto:|tel:)\S+$/.test(v),
  'Use a full https:// link, a site path (/about) or #',
);

const httpUrl = text(500).refine(
  (v) => v === '' || /^https?:\/\/\S+$/.test(v),
  'Use a full https:// link',
);

const phone = text(20).regex(/^\+?[0-9 ]*$/, 'Digits only, optionally starting with +');

export const mediaRef = z.object({ mediaId: z.uuid().nullable() });

const branch = z.object({
  cityAr: text(80).min(1),
  cityEn: text(80).min(1),
  addressAr: text(200),
  addressEn: text(200),
  phone,
});

const legalLink = z.object({
  titleAr: text(80).min(1),
  titleEn: text(80).min(1),
  url: link,
});

type CatalogEntry = {
  description: string;
  schema: z.ZodType;
  defaultValue: unknown;
};

export const settingsCatalog = {
  'branding.logo': {
    description: 'Logo (header, footer, page transition) — { mediaId }',
    schema: mediaRef,
    defaultValue: { mediaId: null },
  },
  'branding.favicon': {
    description: 'Browser tab icon — { mediaId }',
    schema: mediaRef,
    defaultValue: { mediaId: null },
  },
  'branding.companyNameAr': {
    description: 'Company name (Arabic)',
    schema: text(160),
    defaultValue: 'محافظ للاستثمار العقاري',
  },
  'branding.companyNameEn': {
    description: 'Company name (English)',
    schema: text(160),
    defaultValue: 'Mahafeth Real Estate Investment',
  },
  'contact.phone': {
    description: 'Unified phone number',
    schema: phone,
    defaultValue: '920019105',
  },
  'contact.whatsapp': {
    description: 'WhatsApp number (international, digits only)',
    schema: text(20).regex(/^[0-9]*$/, 'Digits only, with the country code'),
    defaultValue: '966507531002',
  },
  'contact.email': {
    description: 'Public contact email',
    schema: z.union([z.literal(''), z.email().max(160)]),
    defaultValue: '',
  },
  'contact.branches': {
    description: 'Branches — [{ cityAr, cityEn, addressAr, addressEn, phone }]',
    schema: z.array(branch).max(20),
    defaultValue: [
      {
        cityAr: 'جدة',
        cityEn: 'Jeddah',
        addressAr: 'الإدارة العامة',
        addressEn: 'Head office',
        phone: '',
      },
      { cityAr: 'الرياض', cityEn: 'Riyadh', addressAr: 'فرع', addressEn: 'Branch', phone: '' },
      { cityAr: 'أبها', cityEn: 'Abha', addressAr: 'فرع', addressEn: 'Branch', phone: '' },
    ],
  },
  'social.instagram': { description: 'Instagram URL', schema: httpUrl, defaultValue: '' },
  'social.linkedin': { description: 'LinkedIn URL', schema: httpUrl, defaultValue: '' },
  'social.twitter': { description: 'X (Twitter) URL', schema: httpUrl, defaultValue: '' },
  'social.snapchat': { description: 'Snapchat URL', schema: httpUrl, defaultValue: '' },
  'seo.titleAr': {
    description: 'Default page title (Arabic)',
    schema: text(160),
    defaultValue: 'محافظ للاستثمار العقاري | جودة حياة تُبنى بثقة',
  },
  'seo.titleEn': {
    description: 'Default page title (English)',
    schema: text(160),
    defaultValue: 'Mahafeth Real Estate Investment | Quality of life, built on trust',
  },
  'seo.descriptionAr': {
    description: 'Default meta description (Arabic)',
    schema: text(500),
    defaultValue: 'شركة محافظ للاستثمار العقاري المحدودة. تطوير وتسويق عقاري في جدة والرياض وأبها.',
  },
  'seo.descriptionEn': {
    description: 'Default meta description (English)',
    schema: text(500),
    defaultValue:
      'Mahafeth Real Estate Investment Co. Ltd. Real estate development and marketing in Jeddah, Riyadh and Abha.',
  },
  'seo.ogImage': {
    description: 'Default social sharing image — { mediaId }',
    schema: mediaRef,
    defaultValue: { mediaId: null },
  },
  'footer.legalLinks': {
    description: 'Legal links — [{ titleAr, titleEn, url }]',
    schema: z.array(legalLink).max(10),
    defaultValue: [
      { titleAr: 'بيان الخصوصية', titleEn: 'Privacy statement', url: '#' },
      { titleAr: 'الشروط والأحكام', titleEn: 'Terms and conditions', url: '#' },
      { titleAr: 'بيان إخلاء المسؤولية', titleEn: 'Disclaimer', url: '#' },
    ],
  },
  'navigation.labels': {
    description: 'Header menu, mega menu and footer labels — { <field>Ar, <field>En }',
    schema: contentSchema(navigationFields),
    defaultValue: contentDefault(navigationFields),
  },
  'forms.interest': {
    description: 'Interest form labels, options and validation messages — { <field>Ar, <field>En }',
    schema: contentSchema(interestFormFields),
    defaultValue: contentDefault(interestFormFields),
  },
  'global.buttons': {
    description: 'Common buttons and CTA labels — { <field>Ar, <field>En }',
    schema: contentSchema(buttonFields),
    defaultValue: contentDefault(buttonFields),
  },
  'global.labels': {
    description:
      'Global labels (breadcrumbs, quick contact, accessibility) — { <field>Ar, <field>En }',
    schema: contentSchema(labelFields),
    defaultValue: contentDefault(labelFields),
  },
  'headers.projects': {
    description: 'Projects page header and SEO — { <field>Ar, <field>En, imageId }',
    schema: pageHeaderSchema('projects'),
    defaultValue: contentDefault(pageHeaderFields.projects, { imageId: null }),
  },
  'headers.services': {
    description: 'Services page header and SEO — { <field>Ar, <field>En, imageId }',
    schema: pageHeaderSchema('services'),
    defaultValue: contentDefault(pageHeaderFields.services, { imageId: null }),
  },
  'headers.partners': {
    description: 'Partners page header and SEO — { <field>Ar, <field>En, imageId }',
    schema: pageHeaderSchema('partners'),
    defaultValue: contentDefault(pageHeaderFields.partners, { imageId: null }),
  },
} satisfies Record<string, CatalogEntry>;

/** Settings holding `{ <field>Ar, <field>En }` copy; the seed adds fields missing from stored values. */
export const contentKeys: ReadonlySet<string> = new Set([
  'navigation.labels',
  'forms.interest',
  'global.buttons',
  'global.labels',
  'headers.projects',
  'headers.services',
  'headers.partners',
]);

export type CatalogKey = keyof typeof settingsCatalog;

export const isCatalogKey = (key: string): key is CatalogKey => key in settingsCatalog;

/**
 * Keys that are no longer managed in the CMS. Rows left over in older databases are kept but never
 * published, and cannot be written again.
 */
export const retiredKeys: ReadonlySet<string> = new Set([
  // The footer credit is fixed developer branding in the website code.
  'footer.copyrightAr',
  'footer.copyrightEn',
]);

export const groupOf = (key: string) => key.split('.')[0] ?? 'general';

export const isMediaRef = (value: unknown): value is { mediaId: string | null } =>
  typeof value === 'object' &&
  value !== null &&
  !Array.isArray(value) &&
  Object.keys(value).length === 1 &&
  'mediaId' in value;
