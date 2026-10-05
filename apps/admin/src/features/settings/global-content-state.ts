import type { MediaSummary } from '@/features/media/types';
import { ApiError } from '@/lib/api-client';

import {
  CONTENT_KEYS,
  type ContentField,
  type ContentKey,
  type ContentTab,
} from './global-content-fields';
import type { Setting, SettingInput } from './types';

export type ContentState = {
  /** Setting key → `<field>Ar` / `<field>En` → text. */
  values: Record<string, Record<string, string>>;
  /** Header setting key → hero image, kept whole so the picker can preview it. */
  images: Record<string, MediaSummary | null>;
};

/** Error keys are `<setting key>|<property>` (`headers.projects|titleAr`, `…|imageId`). */
export type ContentErrors = Partial<Record<string, string>>;

export const LANGS = [
  { suffix: 'Ar', label: 'عربي', dir: 'rtl' },
  { suffix: 'En', label: 'إنجليزي', dir: 'ltr' },
] as const;

export const errorKey = (key: string, prop: string) => `${key}|${prop}`;

const record = (value: unknown): Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
const str = (value: unknown) => (typeof value === 'string' ? value : '');
const fieldsOf = (entry: ContentKey) => entry.groups.flatMap((g) => g.fields);
const byKey = new Map(CONTENT_KEYS.map((entry) => [entry.key, entry]));

/** Hero image ids referenced by the stored header settings, so the page can load previews. */
export function contentMediaIds(settings: Setting[]) {
  const stored = new Map(settings.map((s) => [s.key, s.value]));
  return CONTENT_KEYS.flatMap((entry) => {
    const id = entry.image ? record(stored.get(entry.key)).imageId : undefined;
    return typeof id === 'string' ? [id] : [];
  });
}

export function toContentState(
  settings: Setting[],
  media: Map<string, MediaSummary>,
): ContentState {
  const stored = new Map(settings.map((s) => [s.key, record(s.value)]));
  const state: ContentState = { values: {}, images: {} };
  for (const entry of CONTENT_KEYS) {
    const value = stored.get(entry.key) ?? {};
    state.values[entry.key] = Object.fromEntries(
      fieldsOf(entry).flatMap((field) =>
        LANGS.map(({ suffix }) => [`${field.name}${suffix}`, str(value[`${field.name}${suffix}`])]),
      ),
    );
    if (entry.image) {
      const id = value.imageId;
      state.images[entry.key] = (typeof id === 'string' && media.get(id)) || null;
    }
  }
  return state;
}

function trimmed(state: ContentState): ContentState {
  return {
    values: Object.fromEntries(
      Object.entries(state.values).map(([key, fields]) => [
        key,
        Object.fromEntries(Object.entries(fields).map(([k, v]) => [k, v.trim()])),
      ]),
    ),
    images: state.images,
  };
}

const lineCount = (text: string) => text.split('\n').filter((line) => line.trim()).length;

function fieldError(field: ContentField, text: string) {
  if (text.length > field.max) return `الحد الأقصى ${field.max} حرفًا`;
  if (field.maxLines && lineCount(text) > field.maxLines) return `${field.maxLines} أسطر كحد أقصى`;
  return undefined;
}

function settingValue(state: ContentState, entry: ContentKey): Record<string, unknown> {
  const value: Record<string, unknown> = { ...state.values[entry.key] };
  if (entry.image) value.imageId = state.images[entry.key]?.id ?? null;
  return value;
}

/**
 * Validates the form and returns the settings that differ from `baseline`, plus the normalized
 * (trimmed) state to adopt as the new baseline after a successful save.
 */
export function toContentInput(
  state: ContentState,
  baseline: ContentState,
): { items?: SettingInput[]; next?: ContentState; errors: ContentErrors } {
  const s = trimmed(state);
  const errors: ContentErrors = {};
  for (const entry of CONTENT_KEYS) {
    for (const field of fieldsOf(entry)) {
      for (const { suffix } of LANGS) {
        const prop = `${field.name}${suffix}`;
        const message = fieldError(field, s.values[entry.key]?.[prop] ?? '');
        if (message) errors[errorKey(entry.key, prop)] = message;
      }
    }
  }
  if (Object.keys(errors).length > 0) return { errors };

  const b = trimmed(baseline);
  const items = CONTENT_KEYS.flatMap((entry) => {
    const value = settingValue(s, entry);
    return JSON.stringify(value) === JSON.stringify(settingValue(b, entry))
      ? []
      : [{ key: entry.key, value }];
  });
  return { errors, items, next: s };
}

export const tabOfError = (key: string): ContentTab =>
  byKey.get(key.split('|')[0]!)?.tab ?? 'navigation';

export function tabsWithErrors(errors: ContentErrors) {
  return new Set(
    Object.entries(errors)
      .filter(([, message]) => message)
      .map(([key]) => tabOfError(key)),
  );
}

type Flattened = { formErrors?: string[]; fieldErrors?: Record<string, string[] | undefined> };

/** Backend issues are keyed by setting key, as `"<property>: <message>"`. */
export function contentErrorsOf(err: unknown): ContentErrors {
  if (!(err instanceof ApiError) || err.code !== 'VALIDATION_ERROR') return {};
  const details = err.details as Flattened | undefined;
  const errors: ContentErrors = {};
  for (const [key, messages] of Object.entries(details?.fieldErrors ?? {})) {
    const entry = byKey.get(key);
    if (!entry) continue;
    for (const message of messages ?? []) {
      const prop = /^(\w+): /.exec(message)?.[1];
      const firstProp = `${fieldsOf(entry)[0]!.name}Ar`;
      errors[errorKey(key, prop ?? firstProp)] = 'قيمة غير صالحة';
    }
  }
  return errors;
}
