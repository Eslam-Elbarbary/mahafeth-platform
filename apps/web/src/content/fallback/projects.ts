import type { Locale } from '@/lib/i18n/config';

import { l, localize, type Bilingual } from '../localize';
import { media } from '../media';
import { composeProjectDetail, type ProjectDetailFields } from '../project-copy';
import type { ProjectDetail, ShowcaseProject } from '../types';

/*
 * Temporary project content — the fallback used when the CMS is unreachable or has no published
 * projects, and field by field when a CMS project leaves a detail empty. Only `lib/cms/projects.ts`
 * reads this module. Cards are listed in display order (all featured); detail fields are keyed by
 * slug. Copy only restates published facts.
 */

const units = l('وحدة سكنية', 'Residential units');
const sizes = l('المساحات', 'Unit sizes');
const handover = l('التسليم', 'Handover');
const sqm = l('م²', 'm²');
const underConstruction = l('تحت الإنشاء', 'Under construction');

const cards: Bilingual<ShowcaseProject>[] = [
  {
    slug: 'mahafeth-diamond',
    name: l('محافظ دايموند', 'Mahafeth Diamond'),
    city: 'jeddah',
    location: l('جدة، حي الصفا', 'Jeddah, Al Safa district'),
    status: 'AVAILABLE',
    statusLabel: l('متاح للبيع', 'Available for sale'),
    image: media(
      '/images/projects/diamond.png',
      2048,
      1143,
      l('مشروع محافظ دايموند', 'Mahafeth Diamond project'),
      '50% 58%',
    ),
    href: '/projects/mahafeth-diamond',
    linkLabel: l('محافظ دايموند — اضغط هنا', 'Mahafeth Diamond — view project'),
    facts: [
      { value: '36', label: units },
      { value: '160 – 280', unit: sqm, label: sizes },
      { value: '2025', label: handover },
    ],
  },
  {
    slug: 'mahafeth-platinum',
    name: l('محافظ بلاتينيوم', 'Mahafeth Platinum'),
    city: 'jeddah',
    location: l('جدة، حي النزهة', 'Jeddah, Al Nuzha district'),
    status: 'UNDER_CONSTRUCTION',
    statusLabel: underConstruction,
    image: media(
      '/images/projects/platinum.png',
      1080,
      1920,
      l('مشروع محافظ بلاتينيوم', 'Mahafeth Platinum project'),
      '50% 52%',
    ),
    href: '/projects/mahafeth-platinum',
    linkLabel: l('محافظ بلاتينيوم — اضغط هنا', 'Mahafeth Platinum — view project'),
    facts: [
      { value: '48', label: units },
      { value: '145 – 320', unit: sqm, label: sizes },
      { value: '2026', label: handover },
    ],
  },
  {
    slug: 'abha-view',
    name: l('أبها فيو', 'Abha View'),
    city: 'abha',
    location: l('أبها، حي الوردتين', 'Abha, Al Wardatain district'),
    status: 'UNDER_CONSTRUCTION',
    statusLabel: underConstruction,
    image: media(
      '/images/media/poster-figures.jpg',
      1600,
      900,
      l('مشروع أبها فيو', 'Abha View project'),
      '50% 50%',
    ),
    href: '/projects/abha-view',
    linkLabel: l('أبها فيو — اضغط هنا', 'Abha View — view project'),
    facts: [
      { value: '52', label: units },
      { value: '150 – 310', unit: sqm, label: sizes },
      { value: '2026', label: handover },
    ],
  },
];

const jeddah = l('جدة', 'Jeddah');

const details: Record<string, Bilingual<ProjectDetailFields>> = {
  'mahafeth-diamond': {
    cityLabel: jeddah,
    district: l('حي الصفا', 'Al Safa'),
    summary: l(
      'محافظ دايموند مشروع سكني في حي الصفا بجدة، يضم 36 وحدة سكنية بمساحات تتراوح بين 160 و280 م²، ومتاح للبيع مع تسليم في 2025.',
      'Mahafeth Diamond is a residential project in Jeddah’s Al Safa district with 36 homes from 160 to 280 m², available for sale with handover in 2025.',
    ),
    description: [
      l(
        'محافظ دايموند مشروع سكني في حي الصفا بجدة، يضم 36 وحدة سكنية بمساحات تتراوح بين 160 و280 مترًا مربعًا.',
        'Mahafeth Diamond is a residential project in Jeddah’s Al Safa district, with 36 homes ranging from 160 to 280 square metres.',
      ),
      l(
        'المشروع متاح للبيع الآن مع تسليم في 2025، ويتولى فريق محافظ تطويره وتسويقه وخدمة ملّاكه بعد التسليم.',
        'The project is available for sale now with handover in 2025, developed, marketed and serviced after handover by the Mahafeth team.',
      ),
    ],
    units: 36,
    area: [160, 280],
    completion: 2025,
    completionLabel: l('تسليم 2025', 'Handover 2025'),
    features: [
      {
        icon: 'plan',
        title: l('مساحات من 160 إلى 280 م²', 'Homes from 160 to 280 m²'),
        body: l(
          '36 وحدة سكنية بمساحات متنوعة تناسب احتياجات الأسرة.',
          '36 homes in a range of sizes to suit different households.',
        ),
      },
      {
        icon: 'pin',
        title: l('في حي الصفا بجدة', 'In Jeddah’s Al Safa district'),
        body: l(
          'موقع داخل حي سكني قائم في جدة.',
          'Set within an established residential district of Jeddah.',
        ),
      },
    ],
    gallery: [
      {
        image: media(
          '/images/projects/diamond.png',
          2048,
          1143,
          l('واجهة محافظ دايموند', 'Mahafeth Diamond façade'),
          '50% 58%',
        ),
        caption: l('الواجهة الرئيسية', 'Main façade'),
      },
      {
        image: media(
          '/images/projects/project-3.jpg',
          1080,
          1920,
          l('ممر المشاة أمام محافظ دايموند', 'Walkway in front of Mahafeth Diamond'),
          '50% 55%',
        ),
        caption: l('المدخل وممر المشاة', 'Entrance and walkway'),
      },
    ],
    coordinates: null,
  },
  'mahafeth-platinum': {
    cityLabel: jeddah,
    district: l('حي النزهة', 'Al Nuzha'),
    summary: l(
      'محافظ بلاتينيوم مشروع سكني تحت الإنشاء في حي النزهة بجدة، يضم 48 وحدة سكنية بمساحات تتراوح بين 145 و320 م²، مع تسليم متوقع في 2026.',
      'Mahafeth Platinum is a residential project under construction in Jeddah’s Al Nuzha district with 48 homes from 145 to 320 m², with handover expected in 2026.',
    ),
    description: [
      l(
        'محافظ بلاتينيوم مشروع سكني في حي النزهة بجدة، يضم 48 وحدة سكنية بمساحات تتراوح بين 145 و320 مترًا مربعًا.',
        'Mahafeth Platinum is a residential project in Jeddah’s Al Nuzha district, with 48 homes ranging from 145 to 320 square metres.',
      ),
      l(
        'المشروع تحت الإنشاء مع تسليم متوقع في 2026، ويمكنك تسجيل اهتمامك الآن ليتواصل معك فريقنا بالتفاصيل.',
        'The project is under construction with handover expected in 2026 — register your interest and our team will contact you with details.',
      ),
    ],
    units: 48,
    area: [145, 320],
    completion: 2026,
    completionLabel: l('تسليم متوقع 2026', 'Expected handover 2026'),
    features: [
      {
        icon: 'plan',
        title: l('مساحات من 145 إلى 320 م²', 'Homes from 145 to 320 m²'),
        body: l(
          '48 وحدة سكنية بمساحات متنوعة تناسب احتياجات الأسرة.',
          '48 homes in a range of sizes to suit different households.',
        ),
      },
      {
        icon: 'pin',
        title: l('في حي النزهة بجدة', 'In Jeddah’s Al Nuzha district'),
        body: l(
          'موقع داخل حي سكني قائم في جدة.',
          'Set within an established residential district of Jeddah.',
        ),
      },
    ],
    gallery: [
      {
        image: media(
          '/images/projects/platinum.png',
          1080,
          1920,
          l('واجهة محافظ بلاتينيوم', 'Mahafeth Platinum façade'),
          '50% 52%',
        ),
        caption: l('الواجهة ليلًا', 'Façade at night'),
      },
      {
        image: media(
          '/images/projects/project-1.jpg',
          1080,
          1920,
          l('المنظر الأمامي لمحافظ بلاتينيوم', 'Front elevation of Mahafeth Platinum'),
          '50% 50%',
        ),
        caption: l('المنظر الأمامي', 'Front elevation'),
      },
      {
        image: media(
          '/images/media/poster-projects.jpg',
          1920,
          1080,
          l('تفاصيل واجهة محافظ بلاتينيوم', 'Mahafeth Platinum façade detail'),
          '50% 50%',
        ),
        caption: l('تفاصيل الواجهة', 'Façade detail'),
      },
    ],
    coordinates: null,
  },
  'abha-view': {
    cityLabel: l('أبها', 'Abha'),
    district: l('حي الوردتين', 'Al Wardatain'),
    summary: l(
      'أبها فيو مشروع سكني تحت الإنشاء في حي الوردتين بأبها، يضم 52 وحدة سكنية بمساحات تتراوح بين 150 و310 م²، مع تسليم متوقع في 2026.',
      'Abha View is a residential project under construction in Abha’s Al Wardatain district with 52 homes from 150 to 310 m², with handover expected in 2026.',
    ),
    description: [
      l(
        'أبها فيو مشروع سكني في حي الوردتين بأبها، يضم 52 وحدة سكنية بمساحات تتراوح بين 150 و310 مترًا مربعًا.',
        'Abha View is a residential project in Abha’s Al Wardatain district, with 52 homes ranging from 150 to 310 square metres.',
      ),
      l(
        'المشروع تحت الإنشاء مع تسليم متوقع في 2026، ويمكنك تسجيل اهتمامك الآن ليتواصل معك فريقنا بالتفاصيل.',
        'The project is under construction with handover expected in 2026 — register your interest and our team will contact you with details.',
      ),
    ],
    units: 52,
    area: [150, 310],
    completion: 2026,
    completionLabel: l('تسليم متوقع 2026', 'Expected handover 2026'),
    features: [
      {
        icon: 'plan',
        title: l('مساحات من 150 إلى 310 م²', 'Homes from 150 to 310 m²'),
        body: l(
          '52 وحدة سكنية بمساحات متنوعة تناسب احتياجات الأسرة.',
          '52 homes in a range of sizes to suit different households.',
        ),
      },
      {
        icon: 'pin',
        title: l('في حي الوردتين بأبها', 'In Abha’s Al Wardatain district'),
        body: l('موقع داخل حي سكني في مدينة أبها.', 'Set within a residential district of Abha.'),
      },
    ],
    gallery: [
      {
        image: media(
          '/images/media/poster-figures.jpg',
          1600,
          900,
          l('منظر جوي لمشروع أبها فيو', 'Aerial view of Abha View'),
          '50% 50%',
        ),
        caption: l('منظر جوي للمشروع', 'Aerial view'),
      },
      {
        image: media(
          '/images/projects/project-2.jpg',
          1080,
          1920,
          l('مباني أبها فيو عند الغروب', 'Abha View buildings at sunset'),
          '50% 62%',
        ),
        caption: l('المباني عند الغروب', 'Buildings at sunset'),
      },
    ],
    coordinates: null,
  },
};

export function fallbackProjectCards(locale: Locale): ShowcaseProject[] {
  return localize<ShowcaseProject[]>(cards, locale);
}

export function fallbackProjectFields(slug: string, locale: Locale): ProjectDetailFields | null {
  const fields = details[slug];
  return fields ? localize<ProjectDetailFields>(fields, locale) : null;
}

export function fallbackProjectDetail(slug: string, locale: Locale): ProjectDetail | null {
  const card = fallbackProjectCards(locale).find((p) => p.slug === slug);
  const fields = fallbackProjectFields(slug, locale);
  return card && fields ? composeProjectDetail(card, fields, locale) : null;
}
