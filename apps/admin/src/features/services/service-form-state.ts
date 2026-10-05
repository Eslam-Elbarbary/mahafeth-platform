import type { MediaSummary } from '@/features/media/types';
import { ApiError } from '@/lib/api-client';

import type { PublishStatus, Service, ServiceInput } from './types';

export {
  SEO_DESCRIPTION_MAX,
  SEO_TITLE_MAX,
  slugify,
} from '@/features/projects/project-form-state';

export type FormState = {
  slug: string;
  titleAr: string;
  titleEn: string;
  summaryAr: string;
  summaryEn: string;
  descriptionAr: string;
  descriptionEn: string;
  status: PublishStatus;
  order: string;
  /** Kept whole (not just the id) so the Media tab can preview the choice before saving. */
  image: MediaSummary | null;
  icon: string;
  metaTitleAr: string;
  metaTitleEn: string;
  metaDescriptionAr: string;
  metaDescriptionEn: string;
};

export type FieldErrors = Partial<Record<string, string>>;

export type EditorTab = 'general' | 'media' | 'seo';

const str = (value: string | number | null | undefined) => (value == null ? '' : String(value));

export function toState(service?: Service): FormState {
  return {
    slug: str(service?.slug),
    titleAr: str(service?.titleAr),
    titleEn: str(service?.titleEn),
    summaryAr: str(service?.summaryAr),
    summaryEn: str(service?.summaryEn),
    descriptionAr: str(service?.descriptionAr),
    descriptionEn: str(service?.descriptionEn),
    status: service?.status ?? 'DRAFT',
    order: str(service?.order ?? 0),
    image: service?.image ?? null,
    icon: str(service?.icon),
    metaTitleAr: str(service?.metaTitleAr),
    metaTitleEn: str(service?.metaTitleEn),
    metaDescriptionAr: str(service?.metaDescriptionAr),
    metaDescriptionEn: str(service?.metaDescriptionEn),
  };
}

const text = (value: string) => value.trim() || null;
const REQUIRED = 'هذا الحقل مطلوب';

/** Form state → API body, plus the checks the backend would reject anyway. */
export function toInput(state: FormState): { input?: Partial<ServiceInput>; errors: FieldErrors } {
  const errors: FieldErrors = {};
  const order = state.order.trim() === '' ? 0 : Number(state.order);

  if (!state.titleAr.trim()) errors.titleAr = REQUIRED;
  if (!state.titleEn.trim()) errors.titleEn = REQUIRED;
  if (!state.slug.trim()) errors.slug = REQUIRED;
  else if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(state.slug.trim()))
    errors.slug = 'أحرف إنجليزية صغيرة وأرقام وشرطات فقط';
  if (!Number.isInteger(order) || order < 0) errors.order = 'رقم صحيح موجب';
  if (state.icon.trim() && !/^[a-z0-9-]+$/.test(state.icon.trim()))
    errors.icon = 'أحرف إنجليزية صغيرة وأرقام وشرطات فقط';

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
      status: state.status,
      order,
      imageId: state.image?.id ?? null,
      icon: text(state.icon),
      metaTitleAr: text(state.metaTitleAr),
      metaTitleEn: text(state.metaTitleEn),
      metaDescriptionAr: text(state.metaDescriptionAr),
      metaDescriptionEn: text(state.metaDescriptionEn),
    },
  };
}

const TAB_OF: Record<string, EditorTab> = {
  imageId: 'media',
  icon: 'media',
  metaTitleAr: 'seo',
  metaTitleEn: 'seo',
  metaDescriptionAr: 'seo',
  metaDescriptionEn: 'seo',
};

export const tabOfField = (key: string): EditorTab => TAB_OF[key] ?? 'general';

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
  if (err.code === 'CONFLICT') return { slug: 'هذا الرابط المختصر مستخدم لخدمة أخرى' };
  if (err.code !== 'VALIDATION_ERROR') return {};
  const details = err.details as Flattened | undefined;
  return Object.fromEntries(
    Object.entries(details?.fieldErrors ?? {}).map(([key, messages]) => [key, messages?.[0]]),
  );
}
