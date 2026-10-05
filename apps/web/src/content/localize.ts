import type { Locale } from '@/lib/i18n/config';

/** A bilingual string, the shape the CMS stores as `*Ar` / `*En` column pairs. */
export type L = { readonly ar: string; readonly en: string };

/** Authoring shape of a view model: any plain `string` field may instead be an `{ ar, en }` pair. */
export type Bilingual<T> = T extends string
  ? string extends T
    ? string | L
    : T
  : T extends readonly (infer U)[]
    ? Bilingual<U>[]
    : T extends object
      ? { [K in keyof T]: Bilingual<T[K]> }
      : T;

export const l = (ar: string, en: string): L => ({ ar, en });

function isL(value: unknown): value is L {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return false;
  const keys = Object.keys(value);
  return (
    keys.length === 2 && typeof (value as L).ar === 'string' && typeof (value as L).en === 'string'
  );
}

function resolve(value: unknown, locale: Locale): unknown {
  if (isL(value)) return value[locale];
  if (Array.isArray(value)) return value.map((v) => resolve(v, locale));
  if (typeof value === 'object' && value !== null) {
    return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, resolve(v, locale)]));
  }
  return value;
}

export function localize<T>(value: Bilingual<T>, locale: Locale): T {
  return resolve(value, locale) as T;
}
