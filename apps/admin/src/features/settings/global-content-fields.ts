/*
 * Editable global website copy. Mirrors `apps/backend/src/modules/settings/global-content.ts`:
 * each setting key stores `<field>Ar` / `<field>En` strings (max lengths match the backend), and an
 * empty field shows the website's bundled copy.
 */

export type ContentTab = 'navigation' | 'forms' | 'buttons' | 'labels' | 'headers';

export type ContentField = {
  name: string;
  label: string;
  max: number;
  multiline?: boolean;
  hint?: string;
  /** Heading lines allowed (one per text line). */
  maxLines?: number;
};

export type ContentGroup = { title: string; description?: string; fields: ContentField[] };

export type ContentKey = {
  key: string;
  tab: ContentTab;
  groups: ContentGroup[];
  /** Header keys also hold a hero image (`imageId`). */
  image?: { title: string; description: string };
};

const LABEL = 120;
const BODY = 500;
const MESSAGE = 255;

const label = (name: string, text: string, hint?: string): ContentField => ({
  name,
  label: text,
  max: LABEL,
  ...(hint && { hint }),
});
const body = (name: string, text: string, max = BODY): ContentField => ({
  name,
  label: text,
  max,
  multiline: true,
});

const header = (key: 'projects' | 'services' | 'partners', title: string): ContentKey => ({
  key: `headers.${key}`,
  tab: 'headers',
  groups: [
    {
      title,
      description: 'الواجهة السينمائية أعلى الصفحة ومسار التنقل وبيانات محركات البحث.',
      fields: [
        label('crumb', 'اسم الصفحة في مسار التنقل'),
        { name: 'eyebrow', label: 'النص التمهيدي', max: 255 },
        {
          name: 'title',
          label: 'العنوان',
          max: 255,
          multiline: true,
          maxLines: 3,
          hint: 'كل سطر يظهر في سطر مستقل (3 أسطر كحد أقصى).',
        },
        body('lede', 'الوصف المختصر', 1000),
        { name: 'metaTitle', label: 'عنوان محركات البحث', max: 160 },
        body('metaDescription', 'وصف محركات البحث', 320),
      ],
    },
  ],
  image: {
    title: 'صورة الواجهة',
    description: 'خلفية الواجهة أعلى الصفحة وصورة شريط «الصفحة التالية».',
  },
});

export const CONTENT_KEYS: ContentKey[] = [
  {
    key: 'navigation.labels',
    tab: 'navigation',
    groups: [
      {
        title: 'القائمة الرئيسية',
        description: 'روابط رأس الصفحة وقائمة الجوال.',
        fields: [
          label('about', 'نحن محافظ'),
          label('projects', 'مشاريعنا'),
          label('services', 'خدماتنا'),
          label('leadership', 'كلمة الإدارة'),
          label('contact', 'تواصل معنا'),
          label('partners', 'شركاء النجاح', 'في قائمة الجوال وقائمة «نحن محافظ» والتذييل.'),
          label('mobileMenu', 'عنوان قائمة الجوال'),
          label('navLabel', 'وصف القائمة لقارئات الشاشة'),
        ],
      },
      {
        title: 'القوائم المنسدلة',
        description: 'النصوص داخل القوائم المنسدلة لروابط «نحن محافظ» و«مشاريعنا» و«خدماتنا».',
        fields: [
          label('aboutPage', 'رابط «عن محافظ»'),
          label('journey', 'رابط «مسيرتنا»'),
          label('branches', 'رابط «فروعنا»'),
          label('allProjects', 'رابط «سجلّ المشاريع كاملًا»'),
          body('aboutMenuBody', 'وصف قائمة «نحن محافظ»'),
          body('projectsMenuBody', 'وصف قائمة «مشاريعنا»'),
          body('servicesMenuBody', 'وصف قائمة «خدماتنا»'),
        ],
      },
      {
        title: 'التذييل',
        description: 'عناوين أعمدة التذييل ونصوصه. سطر «تم التطوير بواسطة» ثابت.',
        fields: [
          label('footerHeading', 'العنوان الرئيسي'),
          body('footerTagline', 'النبذة'),
          label('footerCompany', 'عمود «الشركة»'),
          label('footerProjects', 'عمود «مشاريعنا»'),
          label('footerServices', 'عمود «خدماتنا»'),
          label('footerContact', 'عمود «تواصل معنا»'),
          label('footerPhone', 'تسمية الرقم الموحد'),
          label('footerWhatsapp', 'تسمية الواتساب'),
          label('footerBranches', 'تسمية الفروع'),
          label('careers', 'رابط «وظائف»'),
          label('footerSocial', 'عنوان منصات التواصل'),
          label('footerRights', 'نص الحقوق'),
        ],
      },
    ],
  },
  {
    key: 'forms.interest',
    tab: 'forms',
    groups: [
      {
        title: 'حقول نموذج «سجّل اهتمامك»',
        description:
          'تظهر التسمية داخل الحقل (بدل النص التوضيحي) ثم تنتقل أعلاه عند الكتابة. عنوان النموذج ونصوصه تُدار من صفحات الموقع.',
        fields: [
          label('nameLabel', 'حقل الاسم'),
          label('phoneLabel', 'حقل رقم الجوال'),
          label('cityLabel', 'حقل المدينة'),
          label('interestLabel', 'حقل الاهتمام'),
          label('projectLabel', 'تسمية المشروع المختار'),
          label('projectClear', 'زر إزالة المشروع (لقارئات الشاشة)'),
        ],
      },
      {
        title: 'خيارات المدينة',
        fields: [
          label('cityJeddah', 'جدة'),
          label('cityRiyadh', 'الرياض'),
          label('cityAbha', 'أبها'),
        ],
      },
      {
        title: 'خيارات الاهتمام',
        fields: [
          label('interestOwn', 'تملّك وحدة سكنية'),
          label('interestInvest', 'استثمار عقاري'),
          label('interestOwner', 'تسويق أو إدارة أملاك'),
          label('interestPartner', 'شراكة'),
          label('interestJob', 'فرصة عمل'),
        ],
      },
      {
        title: 'رسائل التحقق',
        description: 'تظهر أسفل النموذج عند نقص بيانات أو تعذّر الإرسال.',
        fields: [
          { name: 'errorName', label: 'الاسم غير مكتمل', max: MESSAGE },
          { name: 'errorPhone', label: 'رقم الجوال غير صحيح', max: MESSAGE },
          { name: 'errorCity', label: 'لم تُختر المدينة', max: MESSAGE },
          { name: 'errorSubmit', label: 'تعذّر الإرسال', max: MESSAGE },
        ],
      },
      {
        title: 'بعد الإرسال',
        fields: [label('again', 'زر إرسال طلب آخر')],
      },
    ],
  },
  {
    key: 'global.buttons',
    tab: 'buttons',
    groups: [
      {
        title: 'الأزرار العامة',
        description: 'أزرار الدعوة لاتخاذ إجراء المتكررة في رأس الصفحة والقوائم والتذييل.',
        fields: [
          label('register', 'سجّل اهتمامك', 'زر رأس الصفحة.'),
          label('registerNow', 'سجّل اهتمامك الآن', 'زر التذييل.'),
          label('more', 'المزيد', 'في القوائم المنسدلة.'),
          label('contactUs', 'تواصل معنا', 'في عمود التواصل بالتذييل.'),
          label('whatsapp', 'واتساب', 'زر التواصل العائم.'),
          label('call', 'اتصل بنا', 'زر التواصل العائم.'),
          label('close', 'إغلاق', 'زر إغلاق الفيديو.'),
          label('nextPage', 'الصفحة التالية', 'شريط الانتقال أسفل الصفحات الداخلية.'),
        ],
      },
    ],
  },
  {
    key: 'global.labels',
    tab: 'labels',
    groups: [
      {
        title: 'التنقل',
        fields: [
          label('home', 'اسم الصفحة الرئيسية', 'يُضاف لاسم الشركة في وصف الشعار.'),
          label('crumbHome', 'الرئيسية في مسار التنقل'),
          label('scrollHint', 'تلميح التمرير'),
          label('menuOpen', 'فتح القائمة (لقارئات الشاشة)'),
          label('menuClose', 'إغلاق القائمة (لقارئات الشاشة)'),
          label('toTop', 'زر العودة للأعلى (لقارئات الشاشة)'),
        ],
      },
      {
        title: 'التواصل السريع',
        fields: [
          label('quickContact', 'عنوان التواصل السريع'),
          label('whatsappAria', 'وصف زر الواتساب (لقارئات الشاشة)'),
          label('callAria', 'وصف زر الاتصال (لقارئات الشاشة)'),
        ],
      },
      {
        title: 'منصات التواصل',
        description: 'أسماء الأيقونات في التذييل (لقارئات الشاشة).',
        fields: [
          label('linkedin', 'لينكدإن'),
          label('x', 'إكس'),
          label('instagram', 'إنستغرام'),
          label('snapchat', 'سناب شات'),
        ],
      },
      {
        title: 'الوضع والمؤشر',
        fields: [
          label('themeToggle', 'زر تبديل الوضع (لقارئات الشاشة)'),
          label('themeTitle', 'تلميح زر تبديل الوضع'),
          { name: 'cursorView', label: 'المؤشر: عرض', max: 40 },
          { name: 'cursorExplore', label: 'المؤشر: استكشف', max: 40 },
          { name: 'cursorClick', label: 'المؤشر: اضغط', max: 40 },
        ],
      },
    ],
  },
  header('projects', 'صفحة المشاريع'),
  header('services', 'صفحة الخدمات'),
  header('partners', 'صفحة شركاء النجاح'),
];
