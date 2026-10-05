import type { Locale } from '@/lib/i18n/config';

import { l, localize, type Bilingual } from '../localize';
import { media } from '../media';
import type {
  BranchesContent,
  ContactInfoContent,
  ContactMapContent,
  HomeContent,
  InterestSectionContent,
  LeadershipIntroContent,
  NotFoundContent,
  PageContent,
  PageCtaContent,
  StatementContent,
} from '../types';

/** Home copy; the interest form's labels come from the global content. */
export type HomeFallback = Omit<HomeContent, 'interest'> & { interest: InterestSectionContent };

/*
 * Page copy used when the CMS is disabled or unreachable, and for any field left empty in a CMS
 * section (`lib/cms/pages.ts`). The backend seed (`prisma/seed-pages.ts`) starts the CMS with the
 * same copy, so both sources render the same pages.
 */

const platinum = l('مشروع محافظ بلاتينيوم', 'Mahafeth Platinum project');
const posterFigures = media('/images/media/poster-figures.jpg', 1600, 900);
const register = l('سجّل اهتمامك', 'Register your interest');

/* ────────────────────────────── Home ────────────────────────────── */

const home: Bilingual<HomeFallback> = {
  intro: {
    words: [l('محافظ', 'Mahafeth'), l('للاستثمار', 'Real Estate'), l('العقاري', 'Investment')],
  },
  sparks: [
    { top: '22%', left: '18%', delay: '-1s' },
    { top: '68%', left: '76%', delay: '-3.4s' },
    { top: '41%', left: '58%', delay: '-5.6s' },
    { top: '78%', left: '34%', delay: '-2.2s' },
    { top: '14%', left: '64%', delay: '-6.4s' },
  ],
  hero: {
    label: l('محافظ للاستثمار العقاري', 'Mahafeth Real Estate Investment'),
    eyebrow: l('محافظ للاستثمار العقاري', 'Mahafeth Real Estate'),
    titleLines: [l('جودة حياة', 'Quality of life'), l('تُبنى بثقة', 'Built on trust')],
    sub: l(
      'نطوّر ونسوّق مشاريع سكنية متكاملة في جدة والرياض وأبها، تجمع بين التصميم الرصين وجودة التنفيذ وخدمة ما بعد البيع.',
      'We develop and market residential projects in Jeddah, Riyadh and Abha, combining thoughtful design, quality construction and after-sales care.',
    ),
    cta: { label: l('استكشف مشاريعنا', 'Explore our projects'), href: '#projects' },
    film: {
      label: l('شاهد فيلم محافظ', 'Watch our film'),
      dialogLabel: l('فيلم محافظ', 'Mahafeth corporate film'),
      poster: posterFigures,
    },
    backdrop: media('/images/media/poster-projects.jpg', 1920, 1080, '', '50% 60%'),
    hint: l('انزل لاستكشاف المزيد', 'Scroll to explore'),
  },
  about: {
    label: l('عن محافظ', 'About Mahafeth'),
    titleLines: [
      l('نطوّر ونسوّق مشاريع', 'We develop and market projects'),
      l('ترتقي بجودة الحياة', 'That elevate quality of life'),
    ],
    primaryImage: media('/images/projects/platinum.png', 1080, 1920, platinum),
    secondaryImage: media(
      '/images/about/headquarters.png',
      1080,
      1080,
      l('مقر شركة محافظ للاستثمار العقاري', 'Mahafeth Real Estate Investment headquarters'),
      '50% 50%',
    ),
    lede: l(
      'شركة محافظ للاستثمار العقاري المحدودة شركة سعودية مقرها جدة، تعمل في التطوير والتسويق العقاري في جدة والرياض وأبها. تغطي محافظ دورة العقار كاملة: من دراسة الفكرة، إلى التصميم والتنفيذ، إلى تسليم المفتاح وخدمة ما بعد البيع، بفريق هندسي ومعماري متخصص وفرق مبيعات تعمل في مواقع المشاريع.',
      'Mahafeth Real Estate Investment Co. Ltd. is a Saudi company headquartered in Jeddah, developing and marketing real estate in Jeddah, Riyadh and Abha. Mahafeth covers the full real estate lifecycle, from concept studies, design and construction to key handover and after-sales care, supported by specialist engineering and architectural teams and on-site sales teams.',
    ),
    more: l('المزيد', 'Learn more'),
    less: l('أقل', 'Show less'),
    story: {
      label: l('مسيرتنا', 'Our journey'),
      items: [
        {
          year: '2006',
          title: l('بداية المسيرة العقارية', 'Beginning of the real estate journey'),
          body: l(
            'تأسيس محافظ ودخول قطاع الاستثمار العقاري بالتسويق والتطوير، وبناء شبكة علاقات محلية قوية.',
            'Mahafeth is established, entering real estate investment through marketing and development while building a strong local network.',
          ),
        },
        {
          year: '2023',
          title: l('قسم السكني وخدمات الأفراد', 'Residential sales and services'),
          body: l(
            'تدشين قسم مبيعات السكني للعمل مباشرة مع العميل من أول استفسار حتى التسليم.',
            'Launching a residential sales division to work directly with customers from the first enquiry to handover.',
          ),
        },
        {
          year: '2030',
          current: true,
          title: l('المستهدف', 'Our goal'),
          body: l(
            'المساهمة في رفع نسبة تملّك المواطنين للمساكن ضمن مستهدفات رؤية المملكة.',
            'Helping increase home ownership among Saudi citizens in line with the Kingdom’s Vision targets.',
          ),
        },
      ],
    },
    figures: [
      { value: 1450, label: l('وحدة سكنية حصرية', 'Exclusive residential units') },
      { value: 1015, label: l('وحدة سكنية مباعة', 'Residential units sold') },
      { value: 48, label: l('مشروعًا تحت الإنشاء', 'Projects under construction') },
      { value: 2500, plus: true, label: l('عميل', 'Customers') },
      { value: 325, label: l('مليون ريال قيمة سوقية', 'Million SAR in market value') },
    ],
  },
  showcase: {
    label: l('مشاريعنا', 'Our projects'),
    title: l('أبرز مشاريعنا', 'Featured projects'),
    cta: { label: l('سجلّ المشاريع كاملًا', 'Explore all projects'), href: '/projects' },
    pagerLabel: l('التنقّل بين المشاريع', 'Project navigation'),
    exploreLabel: l('استكشف المشروع', 'Explore project'),
    pins: [
      { city: 'riyadh', label: l('الرياض', 'Riyadh'), x: 508, y: 332 },
      { city: 'jeddah', label: l('جدة', 'Jeddah'), x: 208, y: 460 },
      { city: 'abha', label: l('أبها', 'Abha'), x: 340, y: 592 },
    ],
  },
  services: {
    label: l('خدماتنا', 'Our services'),
    titleLines: [
      l('6 ست خدمات تغطي', '6 services covering'),
      l('دورة العقار كاملة', 'The full real estate lifecycle'),
    ],
    more: l('تفاصيل الخدمة', 'Service details'),
  },
  leadership: {
    label: l('فريق القيادة', 'Our leadership team'),
    title: l('كلمة الإدارة', 'Leadership'),
    trackLabel: l(
      'كلمات الإدارة — اسحب يمينًا ويسارًا',
      'Leadership messages — swipe left or right',
    ),
    dotsLabel: l('المتحدّثون', 'Speakers'),
    dotLabel: l('المتحدّث', 'Speaker'),
    swipeHint: l('اسحب للتنقّل', 'Swipe to explore'),
  },
  reach: {
    label: l('تواصل مع محافظ', 'Connect with Mahafeth'),
    title: l('حدّد اهتمامك', 'Tell us your interests'),
    items: [
      {
        key: 'own',
        title: l('تملّك الوحدات السكنية', 'Home ownership'),
        body: l(
          'شقق وفلل في جدة والرياض وأبها، بتمويل عقاري مدعوم ومتابعة كاملة من اختيار الوحدة حتى الإفراغ واستلام المفتاح.',
          'Apartments and villas in Jeddah, Riyadh and Abha, with supported home financing and guidance from choosing a home to title transfer and key handover.',
        ),
        button: register,
      },
      {
        key: 'invest',
        title: l('الاستثمار العقاري', 'Real estate investment'),
        body: l(
          'مساهمات وصناديق عقارية في أصول مدروسة، بحصص موثّقة وعقود واضحة وتقارير دورية للمستثمرين.',
          'Real estate participation and funds in carefully assessed assets, with documented shares, clear contracts and regular investor reports.',
        ),
        button: register,
      },
      {
        key: 'owner',
        title: l('ملاك الأراضي والعقارات', 'Land and property owners'),
        body: l(
          'تسويق وإدارة أملاك وتقييم سعري مبني على بيانات السوق، لأصحاب الأراضي والعقارات الراغبين في البيع أو التأجير أو التطوير.',
          'Marketing, property management and market-based valuations for land and property owners looking to sell, lease or develop.',
        ),
        button: register,
      },
      {
        key: 'partner',
        title: l('شركاء النجاح', 'Our partners'),
        body: l(
          'بنوك وجهات تمويل ومقاولون وموردون يشاركوننا تمويل الوحدات وتنفيذ المشاريع وتشغيلها بمعايير واضحة.',
          'Banks, finance providers, contractors and suppliers working with us to finance homes, deliver projects and manage operations to clear standards.',
        ),
        button: l('كن شريكنا', 'Become a partner'),
      },
      {
        key: 'job',
        title: l('فرص العمل', 'Career opportunities'),
        body: l(
          'انضم إلى فريق محافظ في جدة أو الرياض أو أبها، في المبيعات والتسويق والهندسة وإدارة المشاريع.',
          'Join Mahafeth in Jeddah, Riyadh or Abha, in sales, marketing, engineering and project management.',
        ),
        button: l('قدّم طلبك', 'Apply now'),
      },
    ],
  },
  interest: {
    label: register,
    titleLines: [l('اترك بياناتك', 'Leave your details'), l('ونتواصل معك', 'We’ll be in touch')],
    lede: l(
      'مستشار مبيعات مختص بمدينتك يتواصل معك خلال يوم عمل واحد، ويجيب على كل ما يخص الوحدات والأسعار وخيارات التمويل.',
      'A sales consultant for your city will contact you within one business day to answer your questions about homes, prices and financing options.',
    ),
    points: [
      l(
        'عرض للوحدات المتاحة في المشروع الأقرب لاحتياجك وميزانيتك.',
        'Explore available homes that best match your needs and budget.',
      ),
      l(
        'مساعدة في إجراءات التمويل العقاري المدعوم حتى الإفراغ.',
        'Support with home financing procedures through to title transfer.',
      ),
      l(
        'متابعة كاملة بعد البيع مع فريق خدمة العملاء.',
        'Ongoing after-sales support from our customer care team.',
      ),
    ],
    card: {
      title: l('بيانات التواصل', 'Contact details'),
      body: l(
        'اترك بياناتك ويتواصل معك مستشار مبيعات مختص بمدينتك.',
        'Leave your details and a sales consultant for your city will contact you.',
      ),
    },
    submit: l('أرسل الطلب', 'Submit enquiry'),
    note: l(
      'بإرسال الطلب توافق على أن يتواصل معك فريق محافظ عبر الجوال.',
      'By submitting, you agree to be contacted by the Mahafeth team by phone.',
    ),
    success: {
      title: l('وصلنا طلبك', 'Enquiry received'),
      body: l(
        'سيتواصل معك فريق المبيعات خلال يوم عمل على الرقم الذي أدخلته.',
        'Our sales team will contact you within one business day at the number you provided.',
      ),
    },
  },
  partners: {
    label: l('شركاء النجاح', 'Our partners'),
    lede: l(
      'بنوك وجهات تمويل وعلامات نعمل معها في تمويل الوحدات وتنفيذ المشاريع وتشغيلها.',
      'Banks, finance providers and brands working with us to finance homes, deliver projects and manage operations.',
    ),
  },
};

/* ────────────────────────── Internal pages ───────────────────────── */

export type PageKey = 'about' | 'projects' | 'services' | 'leadership' | 'partners' | 'contact';

/** Pages whose header is managed in the Pages CMS; the rest are in the global content. */
export type CmsPageKey = 'about' | 'leadership' | 'contact';

const pages: Bilingual<Record<CmsPageKey, PageContent>> = {
  about: {
    meta: {
      title: l('عن محافظ', 'About Mahafeth'),
      description: l(
        'شركة محافظ للاستثمار العقاري: مسيرتنا وأرقامنا ورؤيتنا.',
        'Mahafeth Real Estate Investment: our journey, figures and vision.',
      ),
    },
    crumb: l('عن محافظ', 'About'),
    hero: {
      eyebrow: l('محافظ للاستثمار العقاري', 'Mahafeth Real Estate'),
      titleLines: [
        l('خبرة متخصصة', 'Specialized real estate'),
        l('في التطوير العقاري', 'expertise'),
      ],
      lede: l(
        'من جدة والرياض وأبها، نغطي دورة العقار كاملة من دراسة الفكرة إلى تسليم المفتاح.',
        'From Jeddah, Riyadh and Abha, covering the full real estate lifecycle from concept to key handover.',
      ),
      media: media('/images/about/headquarters.png', 1080, 1080, '', '50% 42%'),
    },
  },
  leadership: {
    meta: {
      title: l('كلمة الإدارة', 'Leadership'),
      description: l(
        'كلمة مجلس الإدارة والإدارة التنفيذية في شركة محافظ للاستثمار العقاري.',
        'Messages from the board and executive leadership of Mahafeth Real Estate Investment.',
      ),
    },
    crumb: l('كلمة الإدارة', 'Leadership'),
    hero: {
      eyebrow: l('فريق القيادة', 'Leadership team'),
      titleLines: [l('رؤية تقودها', 'A vision led'), l('الخبرة', 'by experience')],
      media: media('/images/media/poster-figures.jpg', 1600, 900, '', '50% 50%'),
    },
  },
  contact: {
    meta: {
      title: l('تواصل معنا', 'Contact us'),
      description: l(
        'تواصل مع محافظ أو سجّل اهتمامك بمشاريعنا في جدة والرياض وأبها.',
        'Contact Mahafeth or register your interest in our projects in Jeddah, Riyadh and Abha.',
      ),
    },
    crumb: l('تواصل معنا', 'Contact'),
    hero: {
      eyebrow: l('نحن هنا لخدمتك', 'We are here to help'),
      titleLines: [l('لنبدأ', 'Let’s start'), l('الحديث', 'the conversation')],
      lede: l(
        'اختر اهتمامك وسيتواصل معك فريقنا في أقرب وقت.',
        'Choose your interest and our team will be in touch shortly.',
      ),
      media: media('/images/media/contact.jpg', 1920, 1080, '', '50% 50%'),
    },
  },
};

/** Where each page's closing band leads, so the site reads as one journey. */
export const NEXT_PAGE: Record<PageKey, PageKey> = {
  about: 'projects',
  projects: 'services',
  services: 'leadership',
  leadership: 'partners',
  partners: 'contact',
  contact: 'about',
};

/* ─────────────────────────── Page blocks ─────────────────────────── */

const aboutVision: Bilingual<StatementContent> = {
  label: l('رؤيتنا', 'Our vision'),
  titleLines: [l('نحو مستهدفات', 'Towards'), l('رؤية 2030', 'Vision 2030')],
  body: l(
    'نعمل على المساهمة في رفع نسبة تملّك المواطنين للمساكن ضمن مستهدفات رؤية المملكة، عبر مشاريع سكنية متكاملة وخدمة تمتد من أول استفسار حتى ما بعد التسليم.',
    'We aim to help increase home ownership among Saudi citizens in line with the Kingdom’s Vision targets, through complete residential projects and service that runs from the first enquiry to after handover.',
  ),
  image: media(
    '/images/projects/project-1.jpg',
    1080,
    1920,
    l('مشروع سكني من محافظ', 'A Mahafeth residential project'),
    '50% 55%',
  ),
};

const pageCta: Bilingual<PageCtaContent> = {
  label: l('تواصل مع محافظ', 'Connect with Mahafeth'),
  titleLines: [l('لنبنِ معًا', 'Let’s build'), l('ما يدوم', 'what lasts')],
  body: l(
    'فريقنا جاهز للإجابة عن استفساراتك حول التملّك والاستثمار وإدارة الأملاك.',
    'Our team is ready to answer your questions on home ownership, investment and property management.',
  ),
  button: { label: register },
  call: l('اتصل بنا', 'Call us'),
  whatsapp: l('واتساب', 'WhatsApp'),
  image: media('/images/media/poster-figures.jpg', 1600, 900, '', '50% 50%'),
};

const leadershipIntro: Bilingual<LeadershipIntroContent> = {
  label: l('فريق القيادة', 'Leadership team'),
  titleLines: [l('خبرة تقود', 'Experience that leads'), l('رؤية واضحة', 'a clear vision')],
  body: [
    l(
      'يقود محافظ للاستثمار العقاري فريق يجمع بين الخبرة الطويلة في السوق العقاري السعودي والتخصص في التطوير والتسويق والاستثمار العقاري.',
      'Mahafeth Real Estate is led by a team that combines long experience in the Saudi real estate market with specialist expertise in real estate development, marketing and investment.',
    ),
    l(
      'نضع جودة التنفيذ وثقة العميل في مقدمة كل قرار، ونمضي نحو مستهدفات رؤية المملكة 2030 في رفع نسبة تملّك المساكن.',
      'We put build quality and customer trust at the heart of every decision as we work towards the Kingdom’s Vision 2030 home ownership targets.',
    ),
  ],
  members: l('أعضاء الإدارة', 'Leadership members'),
};

const contactInfo: Bilingual<ContactInfoContent> = {
  label: l('بيانات التواصل', 'Contact information'),
  titleLines: [l('قنوات', 'Ways to'), l('التواصل', 'reach us')],
  phone: l('الرقم الموحد', 'Unified number'),
  whatsapp: l('واتساب', 'WhatsApp'),
  email: l('البريد الإلكتروني', 'Email'),
};

const branches: Bilingual<BranchesContent> = {
  label: l('الفروع', 'Branches'),
  titleLines: [l('فروعنا', 'Our branches')],
};

const contactMap: Bilingual<ContactMapContent> = {
  label: l('الموقع', 'Location'),
  titleLines: [l('موقعنا', 'Find us')],
  address: l('جدة، المملكة العربية السعودية', 'Jeddah, Saudi Arabia'),
  coordinates: null,
  directions: l('الاتجاهات', 'Get directions'),
  pending: l('سيُضاف الموقع على الخريطة قريبًا', 'Map location coming soon'),
};

/* ─────────────────────────────── 404 ─────────────────────────────── */

const notFound: Bilingual<NotFoundContent> = {
  title: l('الصفحة غير موجودة', 'Page not found'),
  mark: '404',
  hero: {
    eyebrow: l('خطأ 404', 'Error 404'),
    titleLines: [l('هذه الصفحة', 'This page'), l('غير موجودة', 'doesn’t exist')],
    lede: l(
      'ربما نُقلت الصفحة أو تغيّر رابطها. عد إلى الصفحة الرئيسية لمتابعة استكشاف مشاريع محافظ وخدماتها.',
      'The page may have moved or its link may have changed. Head back to the homepage to keep exploring Mahafeth projects and services.',
    ),
    media: media('/images/media/poster-projects.jpg', 1920, 1080, '', '50% 60%'),
  },
  home: l('العودة إلى الرئيسية', 'Back to homepage'),
  projects: l('تصفّح المشاريع', 'Browse projects'),
};

/* ───────────────────────────── Access ───────────────────────────── */

export const getNotFoundContent = (locale: Locale) => localize<NotFoundContent>(notFound, locale);

export const getHomeContent = (locale: Locale) => localize<HomeFallback>(home, locale);
export const getPageContent = (key: CmsPageKey, locale: Locale) =>
  localize<PageContent>(pages[key], locale);

export const fallbackAboutVision = (locale: Locale) =>
  localize<StatementContent>(aboutVision, locale);
export const fallbackPageCta = (locale: Locale) => localize<PageCtaContent>(pageCta, locale);
export const fallbackLeadershipIntro = (locale: Locale) =>
  localize<LeadershipIntroContent>(leadershipIntro, locale);
export const fallbackContactInfo = (locale: Locale) =>
  localize<ContactInfoContent>(contactInfo, locale);
export const fallbackBranches = (locale: Locale) => localize<BranchesContent>(branches, locale);
export const fallbackContactMap = (locale: Locale) =>
  localize<ContactMapContent>(contactMap, locale);
