import type { MediaSummary } from '@/features/media/types';
import { ApiError } from '@/lib/api-client';

import type { Branch, LegalLink, MediaRef, Setting, SettingInput } from './types';

export type SettingsTab = 'branding' | 'contact' | 'social' | 'footer' | 'seo';

/** Repeater rows carry a local id so React keeps inputs stable while rows are added/removed. */
export type BranchRow = Branch & { rowId: string };
export type LegalLinkRow = LegalLink & { rowId: string };

export type FormState = {
  /** Kept whole (not just the id) so the pickers can preview the choice before saving. */
  logo: MediaSummary | null;
  favicon: MediaSummary | null;
  companyNameAr: string;
  companyNameEn: string;
  phone: string;
  whatsapp: string;
  email: string;
  branches: BranchRow[];
  instagram: string;
  linkedin: string;
  twitter: string;
  snapchat: string;
  legalLinks: LegalLinkRow[];
  seoTitleAr: string;
  seoTitleEn: string;
  seoDescriptionAr: string;
  seoDescriptionEn: string;
  ogImage: MediaSummary | null;
};

export type FieldErrors = Partial<Record<string, string>>;

/** Form field → setting key (`settings.catalog.ts`) and the tab it lives on. */
const FIELDS: Record<keyof FormState, { key: string; tab: SettingsTab }> = {
  logo: { key: 'branding.logo', tab: 'branding' },
  favicon: { key: 'branding.favicon', tab: 'branding' },
  companyNameAr: { key: 'branding.companyNameAr', tab: 'branding' },
  companyNameEn: { key: 'branding.companyNameEn', tab: 'branding' },
  phone: { key: 'contact.phone', tab: 'contact' },
  whatsapp: { key: 'contact.whatsapp', tab: 'contact' },
  email: { key: 'contact.email', tab: 'contact' },
  branches: { key: 'contact.branches', tab: 'contact' },
  instagram: { key: 'social.instagram', tab: 'social' },
  linkedin: { key: 'social.linkedin', tab: 'social' },
  twitter: { key: 'social.twitter', tab: 'social' },
  snapchat: { key: 'social.snapchat', tab: 'social' },
  legalLinks: { key: 'footer.legalLinks', tab: 'footer' },
  seoTitleAr: { key: 'seo.titleAr', tab: 'seo' },
  seoTitleEn: { key: 'seo.titleEn', tab: 'seo' },
  seoDescriptionAr: { key: 'seo.descriptionAr', tab: 'seo' },
  seoDescriptionEn: { key: 'seo.descriptionEn', tab: 'seo' },
  ogImage: { key: 'seo.ogImage', tab: 'seo' },
};

const MEDIA_FIELDS = ['logo', 'favicon', 'ogImage'] as const;
const fieldNames = Object.keys(FIELDS) as Array<keyof FormState>;

const rowId = () => crypto.randomUUID();
const str = (value: unknown) => (typeof value === 'string' ? value : '');
const record = (value: unknown): Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
const rows = (value: unknown) => (Array.isArray(value) ? value.map(record) : []);

export const emptyBranch = (): BranchRow => ({
  rowId: rowId(),
  cityAr: '',
  cityEn: '',
  addressAr: '',
  addressEn: '',
  phone: '',
});

export const emptyLegalLink = (): LegalLinkRow => ({
  rowId: rowId(),
  titleAr: '',
  titleEn: '',
  url: '',
});

/** Media ids referenced by the stored settings, so the page can load previews. */
export function mediaIdsOf(settings: Setting[]) {
  const byKey = new Map(settings.map((s) => [s.key, s.value]));
  return MEDIA_FIELDS.flatMap((field) => {
    const id = record(byKey.get(FIELDS[field].key)).mediaId;
    return typeof id === 'string' ? [id] : [];
  });
}

export function toState(settings: Setting[], media: Map<string, MediaSummary>): FormState {
  const byKey = new Map(settings.map((s) => [s.key, s.value]));
  const value = (field: keyof FormState) => byKey.get(FIELDS[field].key);
  const mediaOf = (field: (typeof MEDIA_FIELDS)[number]) => {
    const id = record(value(field)).mediaId;
    return (typeof id === 'string' && media.get(id)) || null;
  };

  return {
    logo: mediaOf('logo'),
    favicon: mediaOf('favicon'),
    companyNameAr: str(value('companyNameAr')),
    companyNameEn: str(value('companyNameEn')),
    phone: str(value('phone')),
    whatsapp: str(value('whatsapp')),
    email: str(value('email')),
    branches: rows(value('branches')).map((b) => ({
      rowId: rowId(),
      cityAr: str(b.cityAr),
      cityEn: str(b.cityEn),
      addressAr: str(b.addressAr),
      addressEn: str(b.addressEn),
      phone: str(b.phone),
    })),
    instagram: str(value('instagram')),
    linkedin: str(value('linkedin')),
    twitter: str(value('twitter')),
    snapchat: str(value('snapchat')),
    legalLinks: rows(value('legalLinks')).map((l) => ({
      rowId: rowId(),
      titleAr: str(l.titleAr),
      titleEn: str(l.titleEn),
      url: str(l.url),
    })),
    seoTitleAr: str(value('seoTitleAr')),
    seoTitleEn: str(value('seoTitleEn')),
    seoDescriptionAr: str(value('seoDescriptionAr')),
    seoDescriptionEn: str(value('seoDescriptionEn')),
    ogImage: mediaOf('ogImage'),
  };
}

const REQUIRED = 'هذا الحقل مطلوب';
const PHONE = /^\+?[0-9 ]*$/;
const WHATSAPP = /^[0-9]*$/;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const HTTP_URL = /^https?:\/\/\S+$/;
const isLink = (v: string) =>
  v === '' || v === '#' || v.startsWith('/') || /^(https?:\/\/|mailto:|tel:)\S+$/.test(v);

function trimmed(state: FormState): FormState {
  const trim = <T extends Record<string, unknown>>(row: T) =>
    Object.fromEntries(
      Object.entries(row).map(([k, v]) => [k, typeof v === 'string' ? v.trim() : v]),
    ) as T;
  return {
    ...trim(state),
    branches: state.branches.map(trim),
    legalLinks: state.legalLinks.map(trim),
  };
}

function settingValue(state: FormState, field: keyof FormState): unknown {
  if ((MEDIA_FIELDS as readonly string[]).includes(field)) {
    const media = state[field] as MediaSummary | null;
    return { mediaId: media?.id ?? null } satisfies MediaRef;
  }
  if (field === 'branches') return state.branches.map(({ rowId: _id, ...branch }) => branch);
  if (field === 'legalLinks') return state.legalLinks.map(({ rowId: _id, ...link }) => link);
  return state[field];
}

/**
 * Validates the form and returns the settings that differ from `baseline`, plus the normalized
 * (trimmed) state to adopt as the new baseline after a successful save.
 */
export function toInput(
  state: FormState,
  baseline: FormState,
): { items?: SettingInput[]; next?: FormState; errors: FieldErrors } {
  const s = trimmed(state);
  const errors: FieldErrors = {};

  if (!s.companyNameAr) errors.companyNameAr = REQUIRED;
  if (!s.companyNameEn) errors.companyNameEn = REQUIRED;
  if (!s.phone) errors.phone = REQUIRED;
  else if (!PHONE.test(s.phone)) errors.phone = 'أرقام فقط، ويمكن أن يبدأ بعلامة +';
  if (!s.whatsapp) errors.whatsapp = REQUIRED;
  else if (!WHATSAPP.test(s.whatsapp))
    errors.whatsapp = 'أرقام فقط مع رمز الدولة، بدون + أو مسافات (مثال: 9665XXXXXXXX)';
  if (s.email && !EMAIL.test(s.email)) errors.email = 'بريد إلكتروني غير صالح';

  s.branches.forEach((branch, i) => {
    if (!branch.cityAr) errors[`branches.${i}.cityAr`] = REQUIRED;
    if (!branch.cityEn) errors[`branches.${i}.cityEn`] = REQUIRED;
    if (!PHONE.test(branch.phone))
      errors[`branches.${i}.phone`] = 'أرقام فقط، ويمكن أن يبدأ بعلامة +';
  });

  for (const field of ['instagram', 'linkedin', 'twitter', 'snapchat'] as const) {
    if (s[field] && !HTTP_URL.test(s[field]))
      errors[field] = 'أدخل رابطًا كاملًا يبدأ بـ https://';
  }

  s.legalLinks.forEach((link, i) => {
    if (!link.titleAr) errors[`legalLinks.${i}.titleAr`] = REQUIRED;
    if (!link.titleEn) errors[`legalLinks.${i}.titleEn`] = REQUIRED;
    if (!isLink(link.url))
      errors[`legalLinks.${i}.url`] = 'أدخل رابطًا كاملًا (https://) أو مسارًا داخليًا (/about) أو #';
  });

  if (Object.keys(errors).length > 0) return { errors };

  const b = trimmed(baseline);
  const items = fieldNames.flatMap((field) => {
    const value = settingValue(s, field);
    return JSON.stringify(value) === JSON.stringify(settingValue(b, field))
      ? []
      : [{ key: FIELDS[field].key, value }];
  });
  return { errors, items, next: s };
}

/** `branches.0.cityAr` → `branches`. */
const fieldOf = (errorKey: string) => errorKey.split('.')[0] as keyof FormState;

export const tabOfField = (errorKey: string): SettingsTab =>
  FIELDS[fieldOf(errorKey)]?.tab ?? 'branding';

export function tabsWithErrors(errors: FieldErrors) {
  return new Set(
    Object.entries(errors)
      .filter(([, message]) => message)
      .map(([key]) => tabOfField(key)),
  );
}

type Flattened = { formErrors?: string[]; fieldErrors?: Record<string, string[] | undefined> };

/**
 * Backend validation errors are keyed by setting key, with array issues prefixed by their path
 * (`contact.branches` → `"0.cityAr: …"`); both are mapped back onto form fields.
 */
export function fieldErrorsOf(err: unknown): FieldErrors {
  if (!(err instanceof ApiError) || err.code !== 'VALIDATION_ERROR') return {};
  const details = err.details as Flattened | undefined;
  const fieldByKey = new Map(fieldNames.map((field) => [FIELDS[field].key, field]));
  const errors: FieldErrors = {};
  for (const [key, messages] of Object.entries(details?.fieldErrors ?? {})) {
    const field = fieldByKey.get(key);
    const message = messages?.[0];
    if (!field || !message) continue;
    const nested = /^(\d+\.\w+): /.exec(message);
    if (nested) errors[`${field}.${nested[1]}`] = 'قيمة غير صالحة';
    else errors[field] = 'قيمة غير صالحة';
  }
  return errors;
}
