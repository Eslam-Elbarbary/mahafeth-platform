import { l, type L, type Bilingual } from '../localize';
import { media } from '../media';
import type {
  ButtonLabels,
  GlobalLabels,
  HeaderPageKey,
  NavigationLabels,
  PageContent,
} from '../types';

/*
 * Global copy (menus, footer, buttons, labels, form labels, internal page headers) used when the
 * CMS is disabled or unreachable, and for any field left empty in the CMS (`lib/cms/global-content.ts`).
 * Mirrors the backend seed defaults (`modules/settings/global-content.ts`) field for field: the
 * CMS stores each entry below as `<field>Ar` / `<field>En`.
 */

type Pairs<T> = { [K in keyof T]: L };

export const navigationFallback: Pairs<NavigationLabels> = {
  navLabel: l('القائمة الرئيسية', 'Main navigation'),
  mobileMenu: l('القائمة', 'Menu'),
  about: l('نحن محافظ', 'About Mahafeth'),
  projects: l('مشاريعنا', 'Our projects'),
  services: l('خدماتنا', 'Our services'),
  leadership: l('كلمة الإدارة', 'Leadership'),
  contact: l('تواصل معنا', 'Contact us'),
  partners: l('شركاء النجاح', 'Our partners'),
  aboutPage: l('عن محافظ', 'About Mahafeth'),
  journey: l('مسيرتنا', 'Our journey'),
  branches: l('فروعنا', 'Our branches'),
  careers: l('وظائف', 'Careers'),
  allProjects: l('سجلّ المشاريع كاملًا', 'Explore all projects'),
  aboutMenuBody: l(
    'شركة محافظ للاستثمار العقاري المحدودة، تعمل في التطوير والتسويق العقاري في جدة والرياض وأبها.',
    'Mahafeth Real Estate Investment Co. Ltd. develops and markets real estate in Jeddah, Riyadh and Abha.',
  ),
  projectsMenuBody: l(
    'مشاريع سكنية متكاملة في جدة والرياض وأبها، من دراسة الفكرة إلى تسليم المفتاح، بوحدات تلبّي مختلف الاحتياجات والميزانيات.',
    'Complete residential developments in Jeddah, Riyadh and Abha, from initial concept to key handover, with homes for different needs and budgets.',
  ),
  servicesMenuBody: l(
    '6 ست خدمات تغطي دورة العقار كاملة: من التسويق والتطوير، إلى الاستثمار والوساطة وإدارة الأملاك.',
    '6 services covering the full real estate lifecycle: marketing, development, investment, brokerage and property management.',
  ),
  footerHeading: l('سجّل اهتمامك', 'Register your interest'),
  footerTagline: l(
    'نطوّر ونسوّق مشاريع سكنية متكاملة في جدة والرياض وأبها، من دراسة الفكرة إلى تسليم المفتاح.',
    'Developing and marketing complete residential projects in Jeddah, Riyadh and Abha, from concept to key handover.',
  ),
  footerCompany: l('الشركة', 'Company'),
  footerProjects: l('مشاريعنا', 'Our projects'),
  footerServices: l('خدماتنا', 'Our services'),
  footerContact: l('تواصل معنا', 'Contact us'),
  footerPhone: l('العناية بالعملاء', 'Customer care'),
  footerWhatsapp: l('واتساب', 'WhatsApp'),
  footerBranches: l('فروعنا', 'Our branches'),
  footerSocial: l('تابعنا على منصات التواصل الاجتماعي', 'Follow us on social media'),
  footerRights: l('جميع الحقوق محفوظة.', 'All rights reserved.'),
};

/** Flat CMS fields of `forms.interest`, assembled into `InterestFormLabels`. */
export type InterestFormFields = {
  nameLabel: string;
  phoneLabel: string;
  cityLabel: string;
  interestLabel: string;
  cityJeddah: string;
  cityRiyadh: string;
  cityAbha: string;
  interestOwn: string;
  interestInvest: string;
  interestOwner: string;
  interestPartner: string;
  interestJob: string;
  projectLabel: string;
  projectClear: string;
  errorName: string;
  errorPhone: string;
  errorCity: string;
  errorSubmit: string;
  again: string;
};

export const interestFormFallback: Pairs<InterestFormFields> = {
  nameLabel: l('الاسم', 'Name'),
  phoneLabel: l('رقم الجوال', 'Mobile number'),
  cityLabel: l('المدينة', 'City'),
  interestLabel: l('اهتمامك', 'Your interest'),
  cityJeddah: l('جدة', 'Jeddah'),
  cityRiyadh: l('الرياض', 'Riyadh'),
  cityAbha: l('أبها', 'Abha'),
  interestOwn: l('تملّك وحدة سكنية', 'Buy a home'),
  interestInvest: l('استثمار عقاري', 'Property investment'),
  interestOwner: l('تسويق أو إدارة أملاك', 'Marketing or property management'),
  interestPartner: l('شراكة', 'Partnership'),
  interestJob: l('فرصة عمل', 'Career opportunity'),
  projectLabel: l('المشروع المختار', 'Selected project'),
  projectClear: l('إزالة المشروع', 'Remove project'),
  errorName: l('اكتب اسمك كاملًا.', 'Please enter your full name.'),
  errorPhone: l(
    'اكتب رقم جوال صحيحًا، مثل 05xxxxxxxx.',
    'Please enter a valid mobile number, such as 05xxxxxxxx.',
  ),
  errorCity: l('اختر المدينة.', 'Please select a city.'),
  errorSubmit: l(
    'تعذّر إرسال الطلب، حاول مرة أخرى.',
    'We couldn’t send your enquiry. Please try again.',
  ),
  again: l('إرسال طلب آخر', 'Submit another enquiry'),
};

export const buttonsFallback: Pairs<ButtonLabels> = {
  register: l('سجّل اهتمامك', 'Register your interest'),
  registerNow: l('سجّل اهتمامك الآن', 'Register your interest now'),
  more: l('المزيد', 'Learn more'),
  contactUs: l('تواصل معنا', 'Contact us'),
  whatsapp: l('واتساب', 'WhatsApp'),
  call: l('اتصل بنا', 'Call us'),
  close: l('إغلاق', 'Close'),
  nextPage: l('الصفحة التالية', 'Next page'),
};

export const labelsFallback: Pairs<GlobalLabels> = {
  home: l('الصفحة الرئيسية', 'Home'),
  crumbHome: l('الرئيسية', 'Home'),
  scrollHint: l('انزل لاستكشاف المزيد', 'Scroll to explore'),
  quickContact: l('تواصل سريع', 'Quick contact'),
  whatsappAria: l('تواصل معنا عبر واتساب', 'Chat with us on WhatsApp'),
  callAria: l('اتصل بمحافظ', 'Call Mahafeth'),
  linkedin: l('لينكدإن', 'LinkedIn'),
  x: l('إكس', 'X'),
  instagram: l('إنستغرام', 'Instagram'),
  snapchat: l('سناب شات', 'Snapchat'),
  menuOpen: l('فتح القائمة', 'Open menu'),
  menuClose: l('إغلاق القائمة', 'Close menu'),
  toTop: l('زر التمرير للأعلى', 'Back to top'),
  themeToggle: l('تبديل الوضع الليلي والنهاري', 'Switch between dark and light mode'),
  themeTitle: l('تبديل الوضع', 'Switch theme'),
  cursorView: l('عرض', 'View'),
  cursorExplore: l('استكشف', 'Explore'),
  cursorClick: l('اضغط', 'Click'),
};

/** Projects, services and partners page headers (the other pages' are in the Pages CMS). */
export const headersFallback: Record<HeaderPageKey, Bilingual<PageContent>> = {
  projects: {
    meta: {
      title: l('مشاريعنا', 'Our projects'),
      description: l(
        'مشاريع محافظ السكنية في جدة والرياض وأبها — الحالة والمساحات وموعد التسليم.',
        'Mahafeth residential projects in Jeddah, Riyadh and Abha — status, unit sizes and handover.',
      ),
    },
    crumb: l('مشاريعنا', 'Projects'),
    hero: {
      eyebrow: l('جدة · الرياض · أبها', 'Jeddah · Riyadh · Abha'),
      titleLines: [l('مشاريع تُبنى', 'Homes built'), l('لتدوم', 'to last')],
      lede: l(
        'مشاريع سكنية متكاملة بوحدات تلبّي مختلف الاحتياجات والميزانيات.',
        'Complete residential developments with homes for different needs and budgets.',
      ),
      media: media('/images/projects/diamond.png', 2048, 1143, '', '50% 58%'),
    },
  },
  services: {
    meta: {
      title: l('خدماتنا', 'Our services'),
      description: l(
        'ست خدمات تغطي دورة العقار كاملة: التسويق والتطوير والمساهمات والصناديق والوساطة وإدارة الأملاك.',
        'Six services across the real estate lifecycle: marketing, development, participation, funds, brokerage and property management.',
      ),
    },
    crumb: l('خدماتنا', 'Services'),
    hero: {
      eyebrow: l('دورة العقار كاملة', 'The full real estate lifecycle'),
      titleLines: [l('خبرة تغطي', 'Expertise at'), l('كل مرحلة', 'every stage')],
      lede: l(
        'من التسويق والتطوير إلى الاستثمار والوساطة وإدارة الأملاك.',
        'From marketing and development to investment, brokerage and property management.',
      ),
      media: media('/images/services/services-2.jpg', 1080, 1080, '', '50% 50%'),
    },
  },
  partners: {
    meta: {
      title: l('شركاء النجاح', 'Our partners'),
      description: l(
        'الجهات والشركاء الذين نعمل معهم في مشاريع محافظ.',
        'The organisations and partners we work with across Mahafeth projects.',
      ),
    },
    crumb: l('شركاء النجاح', 'Partners'),
    hero: {
      eyebrow: l('شركاء النجاح', 'Our partners'),
      titleLines: [l('نجاح نصنعه', 'Success we build'), l('معًا', 'together')],
      media: media('/images/media/poster-projects.jpg', 1920, 1080, '', '50% 60%'),
    },
  },
};
