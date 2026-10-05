import type { MediaSummary } from '@/features/media/types';
import { ApiError } from '@/lib/api-client';

import type { TeamMember, TeamMemberInput } from './types';

export type FormState = {
  nameAr: string;
  nameEn: string;
  positionAr: string;
  positionEn: string;
  bioAr: string;
  bioEn: string;
  /** Kept whole (not just the id) so the Media tab can preview the choice before saving. */
  photo: MediaSummary | null;
  order: string;
  visible: boolean;
};

export type FieldErrors = Partial<Record<string, string>>;

export type EditorTab = 'general' | 'media';

export function toState(member?: TeamMember, nextOrder = 0): FormState {
  return {
    nameAr: member?.nameAr ?? '',
    nameEn: member?.nameEn ?? '',
    positionAr: member?.positionAr ?? '',
    positionEn: member?.positionEn ?? '',
    bioAr: member?.bioAr ?? '',
    bioEn: member?.bioEn ?? '',
    photo: member?.photo ?? null,
    order: String(member?.order ?? nextOrder),
    visible: member?.visible ?? true,
  };
}

const text = (value: string) => value.trim() || null;
const REQUIRED = 'هذا الحقل مطلوب';

/** Form state → API body, plus the checks the backend would reject anyway. */
export function toInput(state: FormState): {
  input?: Partial<TeamMemberInput>;
  errors: FieldErrors;
} {
  const errors: FieldErrors = {};
  const order = state.order.trim() === '' ? 0 : Number(state.order);

  if (!state.nameAr.trim()) errors.nameAr = REQUIRED;
  if (!state.nameEn.trim()) errors.nameEn = REQUIRED;
  if (!state.positionAr.trim()) errors.positionAr = REQUIRED;
  if (!state.positionEn.trim()) errors.positionEn = REQUIRED;
  if (!Number.isInteger(order) || order < 0) errors.order = 'رقم صحيح موجب';

  if (Object.keys(errors).length > 0) return { errors };
  return {
    errors,
    input: {
      nameAr: state.nameAr.trim(),
      nameEn: state.nameEn.trim(),
      positionAr: state.positionAr.trim(),
      positionEn: state.positionEn.trim(),
      bioAr: text(state.bioAr),
      bioEn: text(state.bioEn),
      photoId: state.photo?.id ?? null,
      order,
      visible: state.visible,
    },
  };
}

export const tabOfField = (key: string): EditorTab => (key === 'photoId' ? 'media' : 'general');

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
  if (!(err instanceof ApiError) || err.code !== 'VALIDATION_ERROR') return {};
  const details = err.details as Flattened | undefined;
  return Object.fromEntries(
    Object.entries(details?.fieldErrors ?? {}).map(([key, messages]) => [key, messages?.[0]]),
  );
}
