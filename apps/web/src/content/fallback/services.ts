import type { Locale } from '@/lib/i18n/config';

import { l, localize, type Bilingual } from '../localize';
import { media } from '../media';
import { serviceNumber } from '../service-copy';
import type { MediaAsset, ServiceDetail, ServiceItem } from '../types';

/*
 * Temporary services content — the fallback used when the CMS is unreachable or has no published
 * services, and per slug when a CMS service has no image. Only `lib/cms/services.ts` reads this
 * module. Listed in display order; slugs match the seeded CMS services.
 */

type FallbackService = {
  slug: string;
  title: string;
  summary: string;
  body: string;
  image: MediaAsset;
};

const services: Bilingual<FallbackService>[] = [
  {
    slug: 'real-estate-marketing',
    title: l('التسويق العقاري', 'Real estate marketing'),
    summary: l(
      'خطة تسويقية وإعلانية كاملة لكل مشروع، وفريق مبيعات في الموقع.',
      'A complete marketing and advertising plan for every project, with an on-site sales team.',
    ),
    body: l(
      'حملات ممولة على كل المنصات، إدارة حسابات، تقارير أداء أسبوعية وشهرية، ومبيعات ميدانية على مدار الساعة.',
      'Paid campaigns across platforms, account management, weekly and monthly performance reports, and round-the-clock on-site sales.',
    ),
    image: media('/images/services/services-1.jpg', 1080, 1080),
  },
  {
    slug: 'real-estate-development',
    title: l('التطوير العقاري', 'Real estate development'),
    summary: l(
      'من دراسة الفكرة إلى تسليم العقار، بفريق هندسي ومعماري.',
      'From concept studies to property handover, supported by engineering and architectural teams.',
    ),
    body: l(
      'دراسة جدوى، تصميم، إشراف تنفيذ، ضمانات بناء مفعّلة، وخدمة ما بعد البيع.',
      'Feasibility studies, design, construction supervision, active building warranties and after-sales care.',
    ),
    image: media('/images/services/services-2.jpg', 1080, 1080),
  },
  {
    slug: 'real-estate-participation',
    title: l('المساهمات العقارية', 'Real estate participation'),
    summary: l(
      'فرص استثمار جماعي في أصول مدروسة بحصص واضحة.',
      'Collective investment opportunities in carefully assessed assets, with clearly defined shares.',
    ),
    body: l(
      'حصص موثّقة، عقود واضحة، وتقارير دورية للمساهمين.',
      'Documented shares, clear contracts and regular reports for participants.',
    ),
    image: media('/images/media/poster-projects.jpg', 1920, 1080),
  },
  {
    slug: 'investment-funds',
    title: l('الصناديق الاستثمارية', 'Investment funds'),
    summary: l(
      'أوعية استثمارية عقارية بمرونة أعلى ومخاطر موزّعة.',
      'Real estate investment vehicles offering greater flexibility and diversified risk.',
    ),
    body: l(
      'دخول مرن إلى السوق، ومخاطر موزّعة على أكثر من أصل.',
      'Flexible market access, with risk spread across multiple assets.',
    ),
    image: media('/images/media/poster-figures.jpg', 1600, 900),
  },
  {
    slug: 'real-estate-brokerage',
    title: l('الوساطة العقارية', 'Real estate brokerage'),
    summary: l(
      'بيع وشراء وتأجير موثّق، بتقييم مبني على بيانات السوق.',
      'Documented sales, purchases and leasing, with valuations based on market data.',
    ),
    body: l(
      'وساطة موثّقة في البيع والشراء والتأجير، وتقييم سعري مبني على بيانات السوق لا على التقدير.',
      'Documented brokerage for sales, purchases and leasing, with pricing based on market data rather than guesswork.',
    ),
    image: media('/images/projects/project-2.jpg', 1080, 1920),
  },
  {
    slug: 'property-management',
    title: l('إدارة الأملاك', 'Property management'),
    summary: l(
      'إدارة تشغيلية للأصول: عقود وتحصيل وصيانة وتقارير عائد.',
      'Operational asset management: contracts, collections, maintenance and return reports.',
    ),
    body: l(
      'عقود وتحصيل، صيانة دورية، وتقارير عائد واضحة لأصحاب الأملاك.',
      'Contracts and collections, scheduled maintenance and clear return reports for property owners.',
    ),
    image: media('/images/media/branches.jpg', 1080, 1920),
  },
];

function toItem(service: FallbackService, index: number): ServiceItem {
  return {
    ...service,
    no: serviceNumber(index),
    href: `/services/${service.slug}`,
    image: { ...service.image, alt: service.image.alt || service.title },
  };
}

export function fallbackServices(locale: Locale): ServiceItem[] {
  return localize<FallbackService[]>(services, locale).map(toItem);
}

export function fallbackServiceDetail(slug: string, locale: Locale): ServiceDetail | null {
  const item = fallbackServices(locale).find((service) => service.slug === slug);
  if (!item) return null;
  return {
    ...item,
    description: [item.body],
    meta: { title: item.title, description: item.summary },
  };
}
