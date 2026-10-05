import type { MediaSummary } from '@/features/media/types';
import { ApiError } from '@/lib/api-client';

import type { Partner, PartnerInput } from './types';

export type FormState = {
  nameAr: string;
  nameEn: string;
  websiteUrl: string;
  /** Kept whole (not just the id) so the logo can be previewed before saving. */
  logo: MediaSummary | null;
  order: string;
  visible: boolean;
};

export type FieldErrors = Partial<Record<string, string>>;

export function toState(partner?: Partner, nextOrder = 0): FormState {
  return {
    nameAr: partner?.nameAr ?? '',
    nameEn: partner?.nameEn ?? '',
    websiteUrl: partner?.websiteUrl ?? '',
    logo: partner?.logo ?? null,
    order: String(partner?.order ?? nextOrder),
    visible: partner?.visible ?? true,
  };
}

const REQUIRED = 'هذا الحقل مطلوب';

function isHttpUrl(value: string) {
  try {
    return ['http:', 'https:'].includes(new URL(value).protocol);
  } catch {
    return false;
  }
}

/** Form state → API body, plus the checks the backend would reject anyway. */
export function toInput(state: FormState): { input?: Partial<PartnerInput>; errors: FieldErrors } {
  const errors: FieldErrors = {};
  const order = state.order.trim() === '' ? 0 : Number(state.order);
  const websiteUrl = state.websiteUrl.trim();

  if (!state.nameAr.trim()) errors.nameAr = REQUIRED;
  if (!state.nameEn.trim()) errors.nameEn = REQUIRED;
  if (websiteUrl && !isHttpUrl(websiteUrl))
    errors.websiteUrl = 'رابط كامل يبدأ بـ https:// أو http://';
  if (!Number.isInteger(order) || order < 0) errors.order = 'رقم صحيح موجب';
  if (!state.logo) errors.logoId = 'اختر شعار الشريك — لا يظهر الشريك في الموقع بدون شعار';

  if (Object.keys(errors).length > 0) return { errors };
  return {
    errors,
    input: {
      nameAr: state.nameAr.trim(),
      nameEn: state.nameEn.trim(),
      websiteUrl: websiteUrl || null,
      logoId: state.logo?.id ?? null,
      order,
      visible: state.visible,
    },
  };
}

type Flattened = { formErrors?: string[]; fieldErrors?: Record<string, string[] | undefined> };

/** Backend validation errors (`z.flattenError`) → first message per field. */
export function fieldErrorsOf(err: unknown): FieldErrors {
  if (!(err instanceof ApiError) || err.code !== 'VALIDATION_ERROR') return {};
  const details = err.details as Flattened | undefined;
  return Object.fromEntries(
    Object.entries(details?.fieldErrors ?? {}).map(([key, messages]) => [key, messages?.[0]]),
  );
}
