import { ApiError } from '@/lib/api-client';

import type { Project, ProjectFeature, ProjectInput, ProjectStatus, PublishStatus } from './types';

export type FeatureDraft = Required<{
  [K in keyof ProjectFeature]: NonNullable<ProjectFeature[K]>;
}>;

export type FormState = {
  slug: string;
  titleAr: string;
  titleEn: string;
  summaryAr: string;
  summaryEn: string;
  descriptionAr: string;
  descriptionEn: string;
  city: string;
  locationAr: string;
  locationEn: string;
  status: ProjectStatus;
  publishStatus: PublishStatus;
  featured: boolean;
  order: string;
  unitsCount: string;
  sizeMin: string;
  sizeMax: string;
  completionYear: string;
  features: FeatureDraft[];
  latitude: string;
  longitude: string;
  metaTitleAr: string;
  metaTitleEn: string;
  metaDescriptionAr: string;
  metaDescriptionEn: string;
};

export type FieldErrors = Partial<Record<string, string>>;

export type EditorTab = 'general' | 'media' | 'details' | 'location' | 'seo';

export const SEO_TITLE_MAX = 60;
export const SEO_DESCRIPTION_MAX = 160;

const str = (value: string | number | null | undefined) => (value == null ? '' : String(value));

export function toState(project?: Project): FormState {
  return {
    slug: str(project?.slug),
    titleAr: str(project?.titleAr),
    titleEn: str(project?.titleEn),
    summaryAr: str(project?.summaryAr),
    summaryEn: str(project?.summaryEn),
    descriptionAr: str(project?.descriptionAr),
    descriptionEn: str(project?.descriptionEn),
    city: str(project?.city),
    locationAr: str(project?.locationAr),
    locationEn: str(project?.locationEn),
    status: project?.status ?? 'COMING_SOON',
    publishStatus: project?.publishStatus ?? 'DRAFT',
    featured: project?.featured ?? false,
    order: str(project?.order ?? 0),
    unitsCount: str(project?.unitsCount),
    sizeMin: str(project?.sizeRange?.min),
    sizeMax: str(project?.sizeRange?.max),
    completionYear: str(project?.completionYear),
    features: (project?.features ?? []).map((f) => ({
      icon: f.icon,
      titleAr: f.titleAr,
      titleEn: f.titleEn,
      bodyAr: f.bodyAr ?? '',
      bodyEn: f.bodyEn ?? '',
    })),
    latitude: str(project?.latitude),
    longitude: str(project?.longitude),
    metaTitleAr: str(project?.metaTitleAr),
    metaTitleEn: str(project?.metaTitleEn),
    metaDescriptionAr: str(project?.metaDescriptionAr),
    metaDescriptionEn: str(project?.metaDescriptionEn),
  };
}

export const emptyFeature: FeatureDraft = {
  icon: 'plan',
  titleAr: '',
  titleEn: '',
  bodyAr: '',
  bodyEn: '',
};

const text = (value: string) => value.trim() || null;
const num = (value: string) => (value.trim() === '' ? null : Number(value));
const REQUIRED = 'هذا الحقل مطلوب';

/** Form state → API body, plus the checks the backend would reject anyway. */
export function toInput(state: FormState): { input?: Partial<ProjectInput>; errors: FieldErrors } {
  const errors: FieldErrors = {};
  const sizeMin = num(state.sizeMin);
  const sizeMax = num(state.sizeMax);
  const latitude = num(state.latitude);
  const longitude = num(state.longitude);
  const year = num(state.completionYear);

  if (!state.titleAr.trim()) errors.titleAr = REQUIRED;
  if (!state.titleEn.trim()) errors.titleEn = REQUIRED;
  if (!state.slug.trim()) errors.slug = REQUIRED;
  else if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(state.slug.trim()))
    errors.slug = 'أحرف إنجليزية صغيرة وأرقام وشرطات فقط';
  if (!state.city.trim()) errors.city = REQUIRED;

  if ((sizeMin === null) !== (sizeMax === null)) errors.sizeRange = 'أدخل الحد الأدنى والأعلى معًا';
  else if (sizeMin !== null && sizeMax !== null && sizeMin > sizeMax)
    errors.sizeRange = 'الحد الأدنى يجب ألا يتجاوز الحد الأعلى';
  if (year !== null && (year < 1950 || year > 2100)) errors.completionYear = 'سنة غير صالحة';
  state.features.forEach((f, i) => {
    if (!f.titleAr.trim() || !f.titleEn.trim())
      errors[`features.${i}`] = 'العنوان بالعربية والإنجليزية مطلوب';
  });

  if ((latitude === null) !== (longitude === null))
    errors.latitude = 'أدخل خط العرض وخط الطول معًا';
  else if (latitude !== null && (latitude < -90 || latitude > 90))
    errors.latitude = 'بين ‎-90 و 90';
  if (longitude !== null && (longitude < -180 || longitude > 180))
    errors.longitude = 'بين ‎-180 و 180';

  if (Object.keys(errors).length > 0) return { errors };

  return {
    errors,
    input: {
      slug: state.slug.trim(),
      titleAr: state.titleAr.trim(),
      titleEn: state.titleEn.trim(),
      summaryAr: text(state.summaryAr),
      summaryEn: text(state.summaryEn),
      descriptionAr: text(state.descriptionAr),
      descriptionEn: text(state.descriptionEn),
      city: state.city.trim().toLowerCase(),
      locationAr: text(state.locationAr),
      locationEn: text(state.locationEn),
      status: state.status,
      publishStatus: state.publishStatus,
      featured: state.featured,
      order: num(state.order) ?? 0,
      unitsCount: num(state.unitsCount),
      sizeRange: sizeMin !== null && sizeMax !== null ? { min: sizeMin, max: sizeMax } : null,
      completionYear: year,
      features: state.features.length
        ? state.features.map((f) => ({
            icon: f.icon,
            titleAr: f.titleAr.trim(),
            titleEn: f.titleEn.trim(),
            bodyAr: text(f.bodyAr),
            bodyEn: text(f.bodyEn),
          }))
        : null,
      latitude,
      longitude,
      metaTitleAr: text(state.metaTitleAr),
      metaTitleEn: text(state.metaTitleEn),
      metaDescriptionAr: text(state.metaDescriptionAr),
      metaDescriptionEn: text(state.metaDescriptionEn),
    },
  };
}

const TAB_OF: Record<string, EditorTab> = {
  unitsCount: 'details',
  sizeRange: 'details',
  completionYear: 'details',
  features: 'details',
  latitude: 'location',
  longitude: 'location',
  metaTitleAr: 'seo',
  metaTitleEn: 'seo',
  metaDescriptionAr: 'seo',
  metaDescriptionEn: 'seo',
  coverImageId: 'media',
};

/** Which tab a field error belongs to (`features.3` → details). */
export const tabOfField = (key: string): EditorTab => TAB_OF[key.split('.')[0]!] ?? 'general';

export function tabsWithErrors(errors: FieldErrors) {
  return new Set(
    Object.entries(errors)
      .filter(([, message]) => message)
      .map(([key]) => tabOfField(key)),
  );
}

type Flattened = { formErrors?: string[]; fieldErrors?: Record<string, string[] | undefined> };

/** Backend validation errors (`z.flattenError`) → first message per field. */
export function fieldErrorsOf(err: unknown): FieldErrors {
  if (!(err instanceof ApiError)) return {};
  if (err.code === 'CONFLICT') return { slug: 'هذا الرابط المختصر مستخدم لمشروع آخر' };
  if (err.code !== 'VALIDATION_ERROR') return {};
  const details = err.details as Flattened | undefined;
  return Object.fromEntries(
    Object.entries(details?.fieldErrors ?? {}).map(([key, messages]) => [key, messages?.[0]]),
  );
}

/** Suggested slug from the English title. */
export const slugify = (value: string) =>
  value
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/[\s-]+/g, '-');
