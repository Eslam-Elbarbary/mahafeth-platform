import type { CmsSettings } from '@/lib/cms/types';

import { brandImages } from '../media';

/*
 * Global settings used when the CMS is disabled, unreachable, or leaves a field empty — the values
 * the site shipped with, in the `GET /settings` shape so both sources resolve the same way. Social
 * profiles are not published yet (their icons link to `#`).
 */
export const fallbackSettings = {
  branding: {
    companyNameAr: 'محافظ للاستثمار العقاري',
    companyNameEn: 'Mahafeth Real Estate Investment',
  },
  contact: {
    phone: '920019105',
    whatsapp: '966507531002',
    email: '',
    branches: [
      { cityAr: 'جدة', cityEn: 'Jeddah', addressAr: 'الإدارة العامة', addressEn: 'Head office', phone: '' },
      { cityAr: 'الرياض', cityEn: 'Riyadh', addressAr: 'فرع', addressEn: 'Branch', phone: '' },
      { cityAr: 'أبها', cityEn: 'Abha', addressAr: 'فرع', addressEn: 'Branch', phone: '' },
    ],
  },
  social: { instagram: '', linkedin: '', twitter: '', snapchat: '' },
  seo: {
    titleAr: 'محافظ للاستثمار العقاري | جودة حياة تُبنى بثقة',
    titleEn: 'Mahafeth Real Estate Investment | Quality of life, built on trust',
    descriptionAr:
      'شركة محافظ للاستثمار العقاري المحدودة. تطوير وتسويق عقاري في جدة والرياض وأبها.',
    descriptionEn:
      'Mahafeth Real Estate Investment Co. Ltd. Real estate development and marketing in Jeddah, Riyadh and Abha.',
  },
  footer: {
    legalLinks: [
      { titleAr: 'بيان الخصوصية', titleEn: 'Privacy statement', url: '#' },
      { titleAr: 'الشروط والأحكام', titleEn: 'Terms and conditions', url: '#' },
      { titleAr: 'بيان إخلاء المسؤولية', titleEn: 'Disclaimer', url: '#' },
    ],
  },
} satisfies CmsSettings;

/** Bundled brand images (`public/images/brand`). */
export const fallbackBrand = {
  logo: brandImages.logo192,
  seal: brandImages.logo512,
  favicon: '/images/brand/logo-seal-192.png',
};
