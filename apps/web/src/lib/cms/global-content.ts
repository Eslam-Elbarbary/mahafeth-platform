import { cache } from 'react';

import {
  buttonsFallback,
  headersFallback,
  interestFormFallback,
  labelsFallback,
  navigationFallback,
  type InterestFormFields,
} from '@/content/fallback/global-content';
import type { L } from '@/content/localize';
import { localize } from '@/content/localize';
import type {
  CityKey,
  GlobalContent,
  HeaderPageKey,
  InterestFormLabels,
  InterestKey,
  PageContent,
} from '@/content/types';
import type { Locale } from '@/lib/i18n/config';

import { toMediaAsset } from './mappers/common';
import { getPublicSettings } from './settings';
import type { CmsContentGroup, CmsHeaderGroup, CmsMedia } from './types';

/*
 * Global copy (menus, footer, buttons, labels, interest form labels, projects/services/partners
 * page headers) from the CMS settings. Each field falls back on its own: an empty CMS value uses
 * the bundled copy (`content/fallback/global-content.ts`) for the same locale, and without the
 * CMS (disabled or unreachable) every field is the bundled copy.
 */

const isObject = (value: unknown): value is CmsContentGroup =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const group = (value: unknown): CmsContentGroup => (isObject(value) ? value : {});
const str = (value: unknown) => (typeof value === 'string' ? value.trim() : '');
const suffix = (locale: Locale) => (locale === 'ar' ? 'Ar' : 'En');

/** Every field of `fallback` from the CMS group, else the bundled copy. */
function readGroup<K extends string>(
  cms: CmsContentGroup,
  fallback: Record<K, L>,
  locale: Locale,
): Record<K, string> {
  const s = suffix(locale);
  return Object.fromEntries(
    (Object.keys(fallback) as K[]).map((key) => [
      key,
      str(cms[`${key}${s}`]) || fallback[key][locale],
    ]),
  ) as Record<K, string>;
}

const CITIES: [CityKey, keyof InterestFormFields][] = [
  ['jeddah', 'cityJeddah'],
  ['riyadh', 'cityRiyadh'],
  ['abha', 'cityAbha'],
];

const INTERESTS: [InterestKey, keyof InterestFormFields][] = [
  ['own', 'interestOwn'],
  ['invest', 'interestInvest'],
  ['owner', 'interestOwner'],
  ['partner', 'interestPartner'],
  ['job', 'interestJob'],
];

function toInterestForm(f: InterestFormFields): InterestFormLabels {
  return {
    fields: {
      name: f.nameLabel,
      phone: f.phoneLabel,
      city: f.cityLabel,
      interest: f.interestLabel,
    },
    cities: CITIES.map(([key, field]) => ({ key, label: f[field] })),
    interests: INTERESTS.map(([key, field]) => ({ key, label: f[field] })),
    project: { label: f.projectLabel, clear: f.projectClear },
    errors: { name: f.errorName, phone: f.errorPhone, city: f.errorCity, submit: f.errorSubmit },
    again: f.again,
  };
}

const isMedia = (value: unknown): value is CmsMedia =>
  isObject(value) && typeof value.url === 'string' && value.url !== '';

function toHeader(cms: CmsHeaderGroup, key: HeaderPageKey, locale: Locale): PageContent {
  const fallback = localize<PageContent>(headersFallback[key], locale);
  const own = (field: string) => str(cms[`${field}${suffix(locale)}`]);
  const lines = own('title')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);
  const image = isMedia(cms.image) ? cms.image : null;
  const lede = own('lede') || fallback.hero.lede;
  return {
    meta: {
      title: own('metaTitle') || fallback.meta.title,
      description: own('metaDescription') || fallback.meta.description,
    },
    crumb: own('crumb') || fallback.crumb,
    hero: {
      eyebrow: own('eyebrow') || fallback.hero.eyebrow,
      titleLines: lines.length > 0 ? lines : fallback.hero.titleLines,
      ...(lede && { lede }),
      media: image ? toMediaAsset(image, locale, fallback.hero.media.alt) : fallback.hero.media,
    },
  };
}

export const getGlobalContent = cache(async (locale: Locale): Promise<GlobalContent> => {
  const cms = group(await getPublicSettings());
  const global = group(cms.global);
  const headers = group(cms.headers);
  return {
    navigation: readGroup(group(group(cms.navigation).labels), navigationFallback, locale),
    forms: {
      interest: toInterestForm(
        readGroup(group(group(cms.forms).interest), interestFormFallback, locale),
      ),
    },
    buttons: readGroup(group(global.buttons), buttonsFallback, locale),
    labels: readGroup(group(global.labels), labelsFallback, locale),
    headers: {
      projects: toHeader(group(headers.projects), 'projects', locale),
      services: toHeader(group(headers.services), 'services', locale),
      partners: toHeader(group(headers.partners), 'partners', locale),
    },
  };
});
