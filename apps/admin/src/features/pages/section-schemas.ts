import type { SectionType } from './types';

/*
 * What the editor shows for each section type — mirrors `sectionContentSchemas` in the backend
 * and only lists fields the website design actually renders. Every field is optional: an empty
 * field keeps the website's bundled copy.
 */

/** `<key>Ar` / `<key>En` pair. */
export type TextDef = {
  kind: 'text';
  key: string;
  label: string;
  hint?: string;
  multiline?: boolean;
  max: number;
};

/** `{ labelAr, labelEn, href? }` group. */
export type ButtonDef = {
  kind: 'button';
  key: string;
  label: string;
  hint?: string;
  href: boolean;
};

/** One media id. */
export type MediaDef = { kind: 'media'; key: string; label: string; hint?: string };

/** Fixed slots of an id array (`imageIds[0]`, `imageIds[1]`…). */
export type MediaSlotsDef = { kind: 'mediaSlots'; key: string; labels: string[]; hint?: string };

export type NumberDef = {
  kind: 'number';
  key: string;
  label: string;
  hint?: string;
  min: number;
  max: number;
};

export type ItemFieldDef =
  | Omit<TextDef, 'hint'>
  | {
      kind: 'plain';
      key: string;
      label: string;
      placeholder?: string;
      max: number;
      /** Required on every row, optionally matching `pattern`. */
      pattern?: { regex: RegExp; message: string };
    }
  | { kind: 'bool'; key: string; label: string }
  | { kind: 'select'; key: string; label: string; options: Array<{ value: string; label: string }> }
  | { kind: 'media'; key: string; label: string };

export type ListDef = {
  kind: 'list';
  key: string;
  label: string;
  hint: string;
  addLabel: string;
  max: number;
  fields: ItemFieldDef[];
};

export type FieldDef = TextDef | ButtonDef | MediaDef | MediaSlotsDef | NumberDef | ListDef;

export type SectionSchema = {
  label: string;
  description: string;
  /** Section heading (`titleAr` / `titleEn`); omitted when the design has none. */
  title?: { label: string; hint?: string; multiline?: boolean };
  /** Main image (`imageId`); omitted when the design has none. */
  image?: { label: string; hint?: string };
  fields: FieldDef[];
};

const text = (key: string, label: string, max: number, extra: Partial<TextDef> = {}): TextDef => ({
  kind: 'text',
  key,
  label,
  max,
  ...extra,
});
const label = text('label', 'العنوان الصغير', 120, { hint: 'يظهر فوق العنوان الرئيسي.' });
const description = (max = 1000, hint?: string) =>
  text('description', 'الوصف', max, { multiline: true, hint });
const multilineTitle = {
  label: 'العنوان',
  hint: 'كل سطر يظهر كسطر مستقل في العنوان.',
  multiline: true,
};

const INTEREST_OPTIONS = [
  { value: 'own', label: 'التملّك' },
  { value: 'invest', label: 'الاستثمار' },
  { value: 'owner', label: 'ملّاك الأراضي' },
  { value: 'partner', label: 'الشراكات' },
  { value: 'job', label: 'التوظيف' },
];

const SCHEMAS: Record<SectionType, SectionSchema> = {
  HERO: {
    label: 'الواجهة الرئيسية',
    description: 'أول ما يظهر في الصفحة: العنوان والوصف والصورة.',
    title: multilineTitle,
    image: { label: 'صورة الخلفية', hint: 'صورة عريضة بدقة عالية (1920px على الأقل).' },
    fields: [
      text('eyebrow', 'النص التمهيدي', 255, { hint: 'سطر قصير فوق العنوان.' }),
      text('subtitle', 'الوصف', 1000, { multiline: true }),
    ],
  },
  ABOUT: {
    label: 'من نحن',
    description: 'التعريف بالشركة مع صورتين، ويعرض الخط الزمني والأرقام إن كانا ظاهرين.',
    title: multilineTitle,
    fields: [
      label,
      description(3000),
      text('buttonText', 'نص زر «اقرأ المزيد»', 120),
      text('buttonCloseText', 'نص زر الإغلاق', 120),
      {
        kind: 'mediaSlots',
        key: 'imageIds',
        labels: ['الصورة الرئيسية', 'الصورة الثانوية'],
      },
    ],
  },
  STORY: {
    label: 'قصتنا',
    description: 'التعريف بالشركة مع صورتين، ويعرض الخط الزمني والأرقام إن كانا ظاهرين.',
    title: multilineTitle,
    fields: [
      label,
      description(3000),
      text('buttonText', 'نص زر «اقرأ المزيد»', 120),
      text('buttonCloseText', 'نص زر الإغلاق', 120),
      {
        kind: 'mediaSlots',
        key: 'imageIds',
        labels: ['الصورة الرئيسية', 'الصورة الثانوية'],
      },
    ],
  },
  STATS: {
    label: 'الأرقام',
    description: 'أرقام الإنجاز المتحركة داخل قسم «من نحن».',
    fields: [
      {
        kind: 'list',
        key: 'items',
        label: 'الأرقام',
        hint: 'عند إضافة رقم واحد على الأقل تحل القائمة محل الأرقام الافتراضية.',
        addLabel: 'إضافة رقم',
        max: 12,
        fields: [
          {
            kind: 'plain',
            key: 'value',
            label: 'القيمة',
            placeholder: '2500+',
            max: 11,
            pattern: {
              regex: /^\+?\d{1,9}\+?$/,
              message: 'أرقام فقط، مع + اختيارية (مثل 2500+)',
            },
          },
          text('label', 'الوصف', 120),
        ],
      },
    ],
  },
  TIMELINE: {
    label: 'الخط الزمني',
    description: 'محطات مسيرة الشركة، تظهر داخل قسم «من نحن» عند الضغط على «اقرأ المزيد».',
    fields: [
      label,
      {
        kind: 'list',
        key: 'items',
        label: 'المحطات',
        hint: 'عند إضافة محطة واحدة على الأقل تحل القائمة محل المحطات الافتراضية.',
        addLabel: 'إضافة محطة',
        max: 20,
        fields: [
          { kind: 'plain', key: 'year', label: 'السنة', placeholder: '2024', max: 20 },
          { kind: 'bool', key: 'current', label: 'المرحلة الحالية' },
          text('title', 'العنوان', 255),
          text('description', 'الوصف', 1000, { multiline: true }),
          { kind: 'media', key: 'imageId', label: 'صورة (اختيارية، لا يعرضها التصميم الحالي)' },
        ],
      },
    ],
  },
  PROJECTS_SHOWCASE: {
    label: 'معرض المشاريع',
    description: 'عرض المشاريع المميزة. المشاريع نفسها تُدار من قسم المشاريع.',
    title: { label: 'العنوان' },
    fields: [
      label,
      { kind: 'button', key: 'button', label: 'زر عرض كل المشاريع', href: true },
      text('exploreLabel', 'نص «استكشف المشروع»', 120),
    ],
  },
  SERVICES: {
    label: 'الخدمات',
    description: 'عرض الخدمات. الخدمات نفسها تُدار من قسم الخدمات.',
    title: multilineTitle,
    fields: [label, text('linkLabel', 'نص رابط الخدمة', 120)],
  },
  LEADERSHIP: {
    label: 'كلمات القيادة',
    description: 'بطاقات أعضاء القيادة. الأعضاء يُدارون من قسم فريق العمل.',
    title: { label: 'العنوان' },
    fields: [label, text('swipeHint', 'تلميح السحب', 120)],
  },
  CONTACT: {
    label: 'مسارات التواصل',
    description: 'بطاقات الاهتمام (تملّك، استثمار…) التي تفتح نموذج التواصل.',
    title: { label: 'العنوان' },
    fields: [
      label,
      {
        kind: 'list',
        key: 'items',
        label: 'البطاقات',
        hint: 'كل مسار مرة واحدة. الحقول الفارغة تأخذ النص الافتراضي للمسار.',
        addLabel: 'إضافة بطاقة',
        max: INTEREST_OPTIONS.length,
        fields: [
          { kind: 'select', key: 'key', label: 'المسار', options: INTEREST_OPTIONS },
          text('title', 'العنوان', 255),
          text('description', 'الوصف', 1000, { multiline: true }),
          text('button', 'نص الزر', 120),
        ],
      },
    ],
  },
  INTEREST_FORM: {
    label: 'نموذج الاهتمام',
    description: 'نموذج تسجيل الاهتمام ونصوصه. حقول النموذج نفسها ثابتة.',
    title: multilineTitle,
    fields: [
      label,
      description(),
      {
        kind: 'list',
        key: 'points',
        label: 'النقاط',
        hint: 'مزايا قصيرة بجانب النموذج.',
        addLabel: 'إضافة نقطة',
        max: 6,
        fields: [text('text', 'النص', 255)],
      },
      text('cardTitle', 'عنوان البطاقة', 255),
      text('cardBody', 'نص البطاقة', 1000, { multiline: true }),
      text('submit', 'نص زر الإرسال', 120),
      text('note', 'ملاحظة أسفل النموذج', 500),
      text('successTitle', 'عنوان رسالة النجاح', 255),
      text('successBody', 'نص رسالة النجاح', 1000, { multiline: true }),
    ],
  },
  PARTNERS: {
    label: 'الشركاء',
    description: 'شريط شعارات الشركاء. الشعارات تُدار من قسم الشركاء.',
    fields: [label, description()],
  },
  CTA: {
    label: 'دعوة للتواصل',
    description: 'شريط ختامي بزر تواصل واتصال وواتساب.',
    title: multilineTitle,
    image: { label: 'صورة الخلفية' },
    fields: [
      label,
      description(),
      {
        kind: 'button',
        key: 'button',
        label: 'الزر الرئيسي',
        hint: 'رابط داخلي مثل /contact#interest أو رابط كامل.',
        href: true,
      },
      text('callLabel', 'نص زر الاتصال', 120),
      text('whatsappLabel', 'نص زر واتساب', 120),
    ],
  },
  VISION: {
    label: 'الرؤية',
    description: 'فقرة الرؤية مع صورة.',
    title: multilineTitle,
    image: { label: 'الصورة' },
    fields: [label, description(3000)],
  },
  MISSION: {
    label: 'الرسالة',
    description: 'فقرة الرسالة مع صورة. تظهر فقط بعد كتابة نصها.',
    title: multilineTitle,
    image: { label: 'الصورة' },
    fields: [label, description(3000)],
  },
  INTRO: {
    label: 'المقدمة',
    description: 'فقرات تعريفية قبل بطاقات القيادة.',
    title: multilineTitle,
    fields: [
      label,
      description(5000, 'افصل بين الفقرات بسطر فارغ.'),
      text('membersLabel', 'عنوان قائمة الأعضاء', 120),
    ],
  },
  CONTACT_INFO: {
    label: 'بيانات التواصل',
    description: 'الهاتف وواتساب والبريد. الأرقام نفسها تُدار من إعدادات الموقع.',
    title: multilineTitle,
    fields: [
      label,
      description(),
      text('phoneLabel', 'عنوان الهاتف', 120),
      text('whatsappLabel', 'عنوان واتساب', 120),
      text('emailLabel', 'عنوان البريد', 120),
      text('hoursLabel', 'عنوان ساعات العمل', 120),
      text('hours', 'ساعات العمل', 255, { hint: 'اتركه فارغًا لإخفاء ساعات العمل.' }),
    ],
  },
  BRANCHES: {
    label: 'الفروع',
    description: 'قائمة الفروع. الفروع نفسها تُدار من إعدادات الموقع.',
    title: multilineTitle,
    fields: [label, description()],
  },
  MAP: {
    label: 'الخريطة',
    description: 'موقع المكتب على الخريطة مع رابط الاتجاهات.',
    title: multilineTitle,
    fields: [
      label,
      description(),
      text('address', 'العنوان', 255),
      {
        kind: 'number',
        key: 'latitude',
        label: 'خط العرض',
        hint: 'مثال: 24.7136',
        min: -90,
        max: 90,
      },
      {
        kind: 'number',
        key: 'longitude',
        label: 'خط الطول',
        hint: 'مثال: 46.6753',
        min: -180,
        max: 180,
      },
      text('directionsLabel', 'نص رابط الاتجاهات', 120),
    ],
  },
  RICH_TEXT: {
    label: 'نص حر',
    description: 'فقرة نصية.',
    title: { label: 'العنوان' },
    fields: [text('body', 'النص', 20_000, { multiline: true })],
  },
};

/** Homepage hero extras: CTA button, film button, scroll hint and the coin artwork. */
const HOME_HERO_FIELDS: FieldDef[] = [
  {
    kind: 'button',
    key: 'primaryButton',
    label: 'الزر الرئيسي',
    hint: 'رابط قسم مثل #projects أو صفحة مثل /contact.',
    href: true,
  },
  {
    kind: 'button',
    key: 'secondaryButton',
    label: 'زر الفيلم',
    hint: 'يفتح الفيلم التعريفي.',
    href: false,
  },
  text('hint', 'تلميح التمرير', 120),
  {
    kind: 'media',
    key: 'logoImageId',
    label: 'شعار العملة',
    hint: 'يظهر على وجهي العملة المتحركة. اتركه فارغًا لاستخدام الختم الافتراضي.',
  },
];

export function sectionSchema(type: SectionType, pageSlug: string): SectionSchema {
  const schema = SCHEMAS[type];
  if (type === 'HERO' && pageSlug === 'home') {
    return { ...schema, fields: [...schema.fields, ...HOME_HERO_FIELDS] };
  }
  return schema;
}

export const sectionLabel = (type: SectionType) => SCHEMAS[type].label;
