import type { Locale } from '@/lib/i18n/config';

import { l, localize, type Bilingual } from '../localize';
import { media } from '../media';
import type { TeamMember } from '../types';

/*
 * Temporary leadership members — the fallback used when the CMS is unreachable or has no visible
 * member. Only `lib/cms/team.ts` reads this module. The backend seed imports the same members
 * (and portraits) into the CMS.
 */

const members: Bilingual<TeamMember>[] = [
  {
    id: 'sultan-albassami',
    name: l('سلطان البسامي', 'Sultan Al Bassami'),
    role: l('رئيس مجلس الإدارة', 'Chairman of the Board'),
    bio: [
      l(
        'تعمل القيادة الرشيدة على أن يكون الاستثمار العقاري عامل جذب للمستثمر المحلي والأجنبي، ونحن نمضي قدمًا نحو تحقيق أهداف رؤية مملكتنا بما يخدم الوطن والمواطن.',
        'The Kingdom’s leadership is working to make real estate investment attractive to local and international investors. We continue towards the goals of our Kingdom’s Vision in ways that serve the nation and its citizens.',
      ),
    ],
    photo: media(
      '/images/people/sultan-albassami.jpg',
      1080,
      1080,
      l('سلطان البسامي', 'Sultan Al Bassami'),
    ),
  },
  {
    id: 'khalid-albassami',
    name: l('خالد البسامي', 'Khalid Al Bassami'),
    role: l('الرئيس التنفيذي', 'Chief Executive Officer'),
    bio: [
      l(
        'ارتفع عدد سكان المملكة من سبعة وعشرين إلى خمسة وثلاثين مليون نسمة، وزاد الطلب على المساكن. حرصنا على مواكبة التطورات التقنية لتحقيق أعلى مستويات النجاح في الاستثمار المتميز.',
        'The Kingdom’s population grew from twenty-seven to thirty-five million, increasing the demand for homes. We have kept pace with technological advances to achieve the highest standards of success in distinguished investment.',
      ),
    ],
    photo: media(
      '/images/people/khalid-albassami.jpg',
      1080,
      1080,
      l('خالد البسامي', 'Khalid Al Bassami'),
    ),
  },
  {
    id: 'amr-khattab',
    name: l('عمرو خطاب', 'Amr Khattab'),
    role: l('المدير العام', 'General Manager'),
    bio: [
      l(
        'نعمل جاهدين للمساهمة في زيادة الاستثمار العقاري بالمملكة عن طريق مشاريعنا وفريقنا المحترف، بخطط مدروسة بعناية وطرق علمية تهدف إلى تحقيق الأهداف المنشودة.',
        'We work to grow real estate investment in the Kingdom through our projects and professional team, using carefully considered plans and systematic methods to achieve our goals.',
      ),
    ],
    photo: media('/images/people/amr-khattab.jpg', 1080, 1080, l('عمرو خطاب', 'Amr Khattab')),
  },
];

export function fallbackTeam(locale: Locale): TeamMember[] {
  return localize<TeamMember[]>(members, locale);
}
