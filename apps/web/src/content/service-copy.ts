import type { Locale } from '@/lib/i18n/config';

import { l, localize, type Bilingual } from './localize';
import type { ServiceDetailLabels } from './types';

/* Presentation copy shared by every service source (CMS adapter and temporary fallback). */

const labels: Bilingual<ServiceDetailLabels> = {
  overview: { label: l('عن الخدمة', 'About the service'), facts: l('لمحة سريعة', 'At a glance') },
  factKeys: {
    service: l('الخدمة', 'Service'),
    scope: l('النطاق', 'Coverage'),
    developer: l('مقدّم الخدمة', 'Provided by'),
  },
  scopeValue: l('جدة · الرياض · أبها', 'Jeddah · Riyadh · Abha'),
  developerValue: l('محافظ للاستثمار العقاري', 'Mahafeth Real Estate Investment'),
  enquire: l('سجّل اهتمامك', 'Register your interest'),
  more: { label: l('خدماتنا', 'Our services'), title: [l('خدمات أخرى', 'More services')] },
  next: l('الخدمة التالية', 'Next service'),
};

export function getServiceDetailLabels(locale: Locale): ServiceDetailLabels {
  return localize<ServiceDetailLabels>(labels, locale);
}

export const serviceNumber = (index: number) => String(index + 1).padStart(2, '0');
