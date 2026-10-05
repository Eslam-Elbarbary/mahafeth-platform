import { z } from 'zod';

/*
 * Global website copy (menus, footer, buttons, form labels, internal page headers), stored as
 * settings: one JSON object per key with `<field>Ar` / `<field>En` strings. Each field below is
 * `[arabic, english, maxLength]`; the pair is the website's current copy, used as the seed default
 * and mirrored by `apps/web/src/content/fallback/global-content.ts`. Empty fields fall back to it.
 */

type Field = readonly [ar: string, en: string, max: number];
type Fields = Record<string, Field>;

const LABEL = 120;
const BODY = 500;

export const navigationFields = {
  navLabel: ['القائمة الرئيسية', 'Main navigation', LABEL],
  mobileMenu: ['القائمة', 'Menu', LABEL],
  about: ['نحن محافظ', 'About Mahafeth', LABEL],
  projects: ['مشاريعنا', 'Our projects', LABEL],
  services: ['خدماتنا', 'Our services', LABEL],
  leadership: ['كلمة الإدارة', 'Leadership', LABEL],
  contact: ['تواصل معنا', 'Contact us', LABEL],
  partners: ['شركاء النجاح', 'Our partners', LABEL],
  aboutPage: ['عن محافظ', 'About Mahafeth', LABEL],
  journey: ['مسيرتنا', 'Our journey', LABEL],
  branches: ['فروعنا', 'Our branches', LABEL],
  careers: ['وظائف', 'Careers', LABEL],
  allProjects: ['سجلّ المشاريع كاملًا', 'Explore all projects', LABEL],
  aboutMenuBody: [
    'شركة محافظ للاستثمار العقاري المحدودة، تعمل في التطوير والتسويق العقاري في جدة والرياض وأبها.',
    'Mahafeth Real Estate Investment Co. Ltd. develops and markets real estate in Jeddah, Riyadh and Abha.',
    BODY,
  ],
  projectsMenuBody: [
    'مشاريع سكنية متكاملة في جدة والرياض وأبها، من دراسة الفكرة إلى تسليم المفتاح، بوحدات تلبّي مختلف الاحتياجات والميزانيات.',
    'Complete residential developments in Jeddah, Riyadh and Abha, from initial concept to key handover, with homes for different needs and budgets.',
    BODY,
  ],
  servicesMenuBody: [
    '6 ست خدمات تغطي دورة العقار كاملة: من التسويق والتطوير، إلى الاستثمار والوساطة وإدارة الأملاك.',
    '6 services covering the full real estate lifecycle: marketing, development, investment, brokerage and property management.',
    BODY,
  ],
  footerHeading: ['سجّل اهتمامك', 'Register your interest', LABEL],
  footerTagline: [
    'نطوّر ونسوّق مشاريع سكنية متكاملة في جدة والرياض وأبها، من دراسة الفكرة إلى تسليم المفتاح.',
    'Developing and marketing complete residential projects in Jeddah, Riyadh and Abha, from concept to key handover.',
    BODY,
  ],
  footerCompany: ['الشركة', 'Company', LABEL],
  footerProjects: ['مشاريعنا', 'Our projects', LABEL],
  footerServices: ['خدماتنا', 'Our services', LABEL],
  footerContact: ['تواصل معنا', 'Contact us', LABEL],
  footerPhone: ['العناية بالعملاء', 'Customer care', LABEL],
  footerWhatsapp: ['واتساب', 'WhatsApp', LABEL],
  footerBranches: ['فروعنا', 'Our branches', LABEL],
  footerSocial: ['تابعنا على منصات التواصل الاجتماعي', 'Follow us on social media', LABEL],
  footerRights: ['جميع الحقوق محفوظة.', 'All rights reserved.', LABEL],
} as const satisfies Fields;

export const interestFormFields = {
  nameLabel: ['الاسم', 'Name', LABEL],
  phoneLabel: ['رقم الجوال', 'Mobile number', LABEL],
  cityLabel: ['المدينة', 'City', LABEL],
  interestLabel: ['اهتمامك', 'Your interest', LABEL],
  cityJeddah: ['جدة', 'Jeddah', LABEL],
  cityRiyadh: ['الرياض', 'Riyadh', LABEL],
  cityAbha: ['أبها', 'Abha', LABEL],
  interestOwn: ['تملّك وحدة سكنية', 'Buy a home', LABEL],
  interestInvest: ['استثمار عقاري', 'Property investment', LABEL],
  interestOwner: ['تسويق أو إدارة أملاك', 'Marketing or property management', LABEL],
  interestPartner: ['شراكة', 'Partnership', LABEL],
  interestJob: ['فرصة عمل', 'Career opportunity', LABEL],
  projectLabel: ['المشروع المختار', 'Selected project', LABEL],
  projectClear: ['إزالة المشروع', 'Remove project', LABEL],
  errorName: ['اكتب اسمك كاملًا.', 'Please enter your full name.', 255],
  errorPhone: [
    'اكتب رقم جوال صحيحًا، مثل 05xxxxxxxx.',
    'Please enter a valid mobile number, such as 05xxxxxxxx.',
    255,
  ],
  errorCity: ['اختر المدينة.', 'Please select a city.', 255],
  errorSubmit: [
    'تعذّر إرسال الطلب، حاول مرة أخرى.',
    'We couldn’t send your enquiry. Please try again.',
    255,
  ],
  again: ['إرسال طلب آخر', 'Submit another enquiry', LABEL],
} as const satisfies Fields;

export const buttonFields = {
  register: ['سجّل اهتمامك', 'Register your interest', LABEL],
  registerNow: ['سجّل اهتمامك الآن', 'Register your interest now', LABEL],
  more: ['المزيد', 'Learn more', LABEL],
  contactUs: ['تواصل معنا', 'Contact us', LABEL],
  whatsapp: ['واتساب', 'WhatsApp', LABEL],
  call: ['اتصل بنا', 'Call us', LABEL],
  close: ['إغلاق', 'Close', LABEL],
  nextPage: ['الصفحة التالية', 'Next page', LABEL],
} as const satisfies Fields;

export const labelFields = {
  home: ['الصفحة الرئيسية', 'Home', LABEL],
  crumbHome: ['الرئيسية', 'Home', LABEL],
  scrollHint: ['انزل لاستكشاف المزيد', 'Scroll to explore', LABEL],
  quickContact: ['تواصل سريع', 'Quick contact', LABEL],
  whatsappAria: ['تواصل معنا عبر واتساب', 'Chat with us on WhatsApp', LABEL],
  callAria: ['اتصل بمحافظ', 'Call Mahafeth', LABEL],
  linkedin: ['لينكدإن', 'LinkedIn', LABEL],
  x: ['إكس', 'X', LABEL],
  instagram: ['إنستغرام', 'Instagram', LABEL],
  snapchat: ['سناب شات', 'Snapchat', LABEL],
  menuOpen: ['فتح القائمة', 'Open menu', LABEL],
  menuClose: ['إغلاق القائمة', 'Close menu', LABEL],
  toTop: ['زر التمرير للأعلى', 'Back to top', LABEL],
  themeToggle: ['تبديل الوضع الليلي والنهاري', 'Switch between dark and light mode', LABEL],
  themeTitle: ['تبديل الوضع', 'Switch theme', LABEL],
  cursorView: ['عرض', 'View', 40],
  cursorExplore: ['استكشف', 'Explore', 40],
  cursorClick: ['اضغط', 'Click', 40],
} as const satisfies Fields;

/** Internal page header fields; `title` holds one heading line per text line. */
const headerFields = (defaults: {
  crumb: [string, string];
  eyebrow: [string, string];
  title: [string, string];
  lede: [string, string];
  metaTitle: [string, string];
  metaDescription: [string, string];
}) =>
  ({
    crumb: [...defaults.crumb, LABEL],
    eyebrow: [...defaults.eyebrow, 255],
    title: [...defaults.title, 255],
    lede: [...defaults.lede, 1000],
    metaTitle: [...defaults.metaTitle, 160],
    metaDescription: [...defaults.metaDescription, 320],
  }) as const satisfies Fields;

export const pageHeaderFields = {
  projects: headerFields({
    crumb: ['مشاريعنا', 'Projects'],
    eyebrow: ['جدة · الرياض · أبها', 'Jeddah · Riyadh · Abha'],
    title: ['مشاريع تُبنى\nلتدوم', 'Homes built\nto last'],
    lede: [
      'مشاريع سكنية متكاملة بوحدات تلبّي مختلف الاحتياجات والميزانيات.',
      'Complete residential developments with homes for different needs and budgets.',
    ],
    metaTitle: ['مشاريعنا', 'Our projects'],
    metaDescription: [
      'مشاريع محافظ السكنية في جدة والرياض وأبها — الحالة والمساحات وموعد التسليم.',
      'Mahafeth residential projects in Jeddah, Riyadh and Abha — status, unit sizes and handover.',
    ],
  }),
  services: headerFields({
    crumb: ['خدماتنا', 'Services'],
    eyebrow: ['دورة العقار كاملة', 'The full real estate lifecycle'],
    title: ['خبرة تغطي\nكل مرحلة', 'Expertise at\nevery stage'],
    lede: [
      'من التسويق والتطوير إلى الاستثمار والوساطة وإدارة الأملاك.',
      'From marketing and development to investment, brokerage and property management.',
    ],
    metaTitle: ['خدماتنا', 'Our services'],
    metaDescription: [
      'ست خدمات تغطي دورة العقار كاملة: التسويق والتطوير والمساهمات والصناديق والوساطة وإدارة الأملاك.',
      'Six services across the real estate lifecycle: marketing, development, participation, funds, brokerage and property management.',
    ],
  }),
  partners: headerFields({
    crumb: ['شركاء النجاح', 'Partners'],
    eyebrow: ['شركاء النجاح', 'Our partners'],
    title: ['نجاح نصنعه\nمعًا', 'Success we build\ntogether'],
    lede: ['', ''],
    metaTitle: ['شركاء النجاح', 'Our partners'],
    metaDescription: [
      'الجهات والشركاء الذين نعمل معهم في مشاريع محافظ.',
      'The organisations and partners we work with across Mahafeth projects.',
    ],
  }),
};

export type PageHeaderKey = keyof typeof pageHeaderFields;

/** Unknown keys are stripped; every field is optional (empty = the website's bundled copy). */
export function contentSchema(fields: Fields, extra: Record<string, z.ZodType> = {}) {
  const shape: Record<string, z.ZodType> = { ...extra };
  for (const [key, [, , max]] of Object.entries(fields)) {
    shape[`${key}Ar`] = z.string().trim().max(max).optional();
    shape[`${key}En`] = z.string().trim().max(max).optional();
  }
  return z.object(shape);
}

export function contentDefault(fields: Fields, extra: Record<string, unknown> = {}) {
  const value: Record<string, unknown> = {};
  for (const [key, [ar, en]] of Object.entries(fields)) {
    value[`${key}Ar`] = ar;
    value[`${key}En`] = en;
  }
  return { ...value, ...extra };
}

/** Header title: at most 3 heading lines. */
const titleLines = (value: unknown) =>
  typeof value !== 'string' || value.split('\n').filter((line) => line.trim()).length <= 3;

export const pageHeaderSchema = (key: PageHeaderKey) =>
  contentSchema(pageHeaderFields[key], { imageId: z.uuid().nullable().optional() })
    .refine((v) => titleLines(v.titleAr), { path: ['titleAr'], message: 'At most 3 lines' })
    .refine((v) => titleLines(v.titleEn), { path: ['titleEn'], message: 'At most 3 lines' });
