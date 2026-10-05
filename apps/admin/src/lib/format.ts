/* Arabic UI copy with Latin digits and the Gregorian calendar (ar-SA would default to Hijri). */
const LOCALE = 'ar';
const numberFormat = new Intl.NumberFormat(LOCALE, { numberingSystem: 'latn' });
const dateFormat = new Intl.DateTimeFormat(LOCALE, {
  calendar: 'gregory',
  numberingSystem: 'latn',
  day: 'numeric',
  month: 'short',
  year: 'numeric',
});

export const formatNumber = (value: number) => numberFormat.format(value);

const dateTimeFormat = new Intl.DateTimeFormat(LOCALE, {
  calendar: 'gregory',
  numberingSystem: 'latn',
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  hour: 'numeric',
  minute: '2-digit',
});

export const formatDate = (value: string | Date) => dateFormat.format(new Date(value));

export const formatDateTime = (value: string | Date) => dateTimeFormat.format(new Date(value));

const relativeFormat = new Intl.RelativeTimeFormat(LOCALE, {
  numeric: 'auto',
  numberingSystem: 'latn',
} as Intl.RelativeTimeFormatOptions);
const RELATIVE_STEPS: Array<[Intl.RelativeTimeFormatUnit, number]> = [
  ['second', 60],
  ['minute', 60],
  ['hour', 24],
  ['day', 7],
];

/** «منذ 5 دقائق»; falls back to the date after a week. */
export function formatRelative(value: string | Date, now = Date.now()) {
  let delta = Math.round((new Date(value).getTime() - now) / 1000);
  for (const [unit, size] of RELATIVE_STEPS) {
    if (Math.abs(delta) < size) return relativeFormat.format(delta, unit);
    delta = Math.round(delta / size);
  }
  return formatDate(value);
}

const dayFormat = new Intl.DateTimeFormat(LOCALE, {
  calendar: 'gregory',
  numberingSystem: 'latn',
  day: 'numeric',
  month: 'short',
  timeZone: 'UTC',
});

/** `YYYY-MM-DD` (a calendar day, no time zone) → «30 سبتمبر». */
export const formatDay = (isoDay: string) => dayFormat.format(new Date(`${isoDay}T00:00:00Z`));

export function formatBytes(bytes: number) {
  if (bytes < 1024) return `${formatNumber(bytes)} بايت`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${formatNumber(Math.round(kb))} ك.ب`;
  return `${formatNumber(Math.round((kb / 1024) * 10) / 10)} م.ب`;
}
