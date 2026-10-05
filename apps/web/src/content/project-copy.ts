import type { Locale } from '@/lib/i18n/config';

import { l, localize, type Bilingual, type L } from './localize';
import type {
  ProjectDetail,
  ProjectDetailLabels,
  ProjectFeature,
  ProjectStatus,
  ShowcaseProject,
} from './types';

/*
 * Presentation copy shared by every project source (CMS adapter and temporary fallback):
 * page labels, status vocabulary, company-wide features and the stats/facts builders.
 */

/** Everything a project page shows beyond the card; `features` are the project-specific ones. */
export type ProjectDetailFields = Omit<ProjectDetail, keyof ShowcaseProject | 'stats'>;

const sqm = l('م²', 'm²');
const residential = l('وحدة سكنية', 'Residential units');
const sizeRange = l('المساحات', 'Unit sizes');
const handoverYear = l('سنة التسليم', 'Handover year');
const handover = l('التسليم', 'Handover');

export const statusLabels: Record<ProjectStatus, L> = {
  AVAILABLE: l('متاح للبيع', 'Available for sale'),
  UNDER_CONSTRUCTION: l('تحت الإنشاء', 'Under construction'),
  COMING_SOON: l('قريبًا', 'Coming soon'),
  SOLD_OUT: l('مباع بالكامل', 'Sold out'),
};

export function completionLabel(status: ProjectStatus, year: number, locale: Locale): string {
  const done = status === 'AVAILABLE' || status === 'SOLD_OUT';
  return localize<string>(
    done
      ? l(`تسليم ${year}`, `Handover ${year}`)
      : l(`تسليم متوقع ${year}`, `Expected handover ${year}`),
    locale,
  );
}

export const projectLinkLabel = (name: string, locale: Locale) =>
  localize<string>(l(`${name} — اضغط هنا`, `${name} — view project`), locale);

/** Card facts in the home showcase format; only the values that are known. */
export function projectFacts(
  { units, area, completion }: { units?: number; area?: [number, number]; completion?: number },
  locale: Locale,
): ShowcaseProject['facts'] {
  const t = (value: L) => localize<string>(value, locale);
  const facts: ShowcaseProject['facts'] = [];
  if (units) facts.push({ value: String(units), label: t(residential) });
  if (area) facts.push({ value: `${area[0]} – ${area[1]}`, unit: t(sqm), label: t(sizeRange) });
  if (completion) facts.push({ value: String(completion), label: t(handover) });
  return facts;
}

/** Company-wide features every project shares; per-project ones are prepended. */
const sharedFeatures: Bilingual<ProjectFeature>[] = [
  {
    icon: 'key',
    title: l('من الفكرة إلى تسليم المفتاح', 'From concept to key handover'),
    body: l(
      'تتولى محافظ دورة المشروع كاملة: الدراسة والتطوير والتسويق حتى التسليم.',
      'Mahafeth runs the full cycle — study, development and marketing through to handover.',
    ),
  },
  {
    icon: 'service',
    title: l('خدمة بعد التسليم', 'After-handover service'),
    body: l(
      'فريق العناية بالعملاء يرافقك من أول استفسار إلى ما بعد استلام وحدتك.',
      'Customer care stays with you from the first enquiry to after you receive your home.',
    ),
  },
  {
    icon: 'shield',
    title: l('محافظ للاستثمار العقاري', 'Mahafeth Real Estate'),
    body: l(
      'خبرة متخصصة في التطوير والتسويق العقاري، وفروع في جدة والرياض وأبها.',
      'Specialist experience in real estate development and marketing, with branches in Jeddah, Riyadh and Abha.',
    ),
  },
];

const labels: Bilingual<ProjectDetailLabels> = {
  enquire: l('سجّل اهتمامك بالمشروع', 'Register your interest'),
  sqm,
  overview: {
    label: l('نظرة عامة', 'Overview'),
    title: [l('تفاصيل', 'Project'), l('المشروع', 'overview')],
    facts: l('معلومات سريعة', 'At a glance'),
  },
  factKeys: {
    city: l('المدينة', 'City'),
    district: l('الحي', 'District'),
    type: l('نوع المشروع', 'Type'),
    developer: l('المطوّر', 'Developer'),
  },
  typeValue: l('سكني', 'Residential'),
  developerValue: l('محافظ للاستثمار العقاري', 'Mahafeth Real Estate Investment'),
  statsLabel: l('أرقام المشروع', 'Key figures'),
  gallery: {
    label: l('معرض الصور', 'Gallery'),
    title: [l('المشروع', 'The project'), l('بالصور', 'in pictures')],
    open: l('عرض بملء الشاشة', 'View fullscreen'),
    close: l('إغلاق', 'Close'),
    prev: l('الصورة السابقة', 'Previous image'),
    next: l('الصورة التالية', 'Next image'),
    thumbs: l('صور المشروع', 'Project images'),
  },
  info: {
    label: l('معلومات المشروع', 'Project information'),
    title: [l('كل ما تحتاج', 'Everything you need'), l('معرفته', 'to know')],
    location: l('الموقع', 'Location'),
    units: l('عدد الوحدات', 'Units'),
    status: l('حالة المشروع', 'Status'),
    completion: l('موعد التسليم', 'Completion'),
    area: l('المساحات', 'Unit sizes'),
    features: l('المزايا', 'Features'),
  },
  location: {
    label: l('الموقع', 'Location'),
    title: [l('موقع', 'Where'), l('المشروع', 'you’ll live')],
    pending: l(
      'سيُضاف الموقع الدقيق على الخريطة قريبًا',
      'The exact map location will be added soon',
    ),
    coords: l('الإحداثيات', 'Coordinates'),
    directions: l('الاتجاهات عبر خرائط Google', 'Directions on Google Maps'),
    city: l('المدينة', 'City'),
  },
  cta: {
    label: l('سجّل اهتمامك', 'Register your interest'),
    title: [l('خطوتك الأولى', 'Your first step'), l('نحو منزلك', 'towards home')],
    body: l(
      'اترك بياناتك وسيتواصل معك فريق محافظ بتفاصيل المشروع والوحدات المتاحة.',
      'Leave your details and the Mahafeth team will contact you about the project and available homes.',
    ),
    primary: l('سجّل اهتمامك بهذا المشروع', 'Register interest in this project'),
    call: l('اتصل بنا', 'Call us'),
    whatsapp: l('واتساب', 'WhatsApp'),
  },
  more: {
    label: l('مشاريع أخرى', 'More projects'),
    title: [l('استكشف', 'Explore'), l('مشاريعنا الأخرى', 'our other projects')],
    all: l('جميع المشاريع', 'All projects'),
  },
};

export function getProjectDetailLabels(locale: Locale): ProjectDetailLabels {
  return localize<ProjectDetailLabels>(labels, locale);
}

/** Card + detail fields → the `ProjectDetail` the page components render. */
export function composeProjectDetail(
  card: ShowcaseProject,
  fields: ProjectDetailFields,
  locale: Locale,
): ProjectDetail {
  const t = (value: L) => localize<string>(value, locale);
  const [min, max] = fields.area;
  const stats: ProjectDetail['stats'] = [];
  if (fields.units) stats.push({ value: fields.units, label: t(residential) });
  if (min && max) stats.push({ value: [min, max], unit: t(sqm), label: t(sizeRange) });
  if (fields.completion) {
    stats.push({
      value: fields.completion,
      plain: true,
      label: t(handoverYear),
      note: card.statusLabel,
    });
  }
  return {
    ...card,
    ...fields,
    stats,
    features: [...fields.features, ...localize<ProjectFeature[]>(sharedFeatures, locale)],
  };
}
