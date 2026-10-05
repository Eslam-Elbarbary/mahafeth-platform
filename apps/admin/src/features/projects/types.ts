/* Mirrors `apps/backend/src/modules/projects` request/response shapes. */
import type { BadgeTone } from '@/components/ui/badge';
import type { MediaSummary } from '@/features/media/types';

export type { Paginated } from '@/lib/query';

export const PROJECT_STATUSES = [
  'AVAILABLE',
  'UNDER_CONSTRUCTION',
  'COMING_SOON',
  'SOLD_OUT',
] as const;
export type ProjectStatus = (typeof PROJECT_STATUSES)[number];

export const PUBLISH_STATUSES = ['PUBLISHED', 'DRAFT', 'ARCHIVED'] as const;
export type PublishStatus = (typeof PUBLISH_STATUSES)[number];

export const PROJECT_IMAGE_CATEGORIES = ['COVER', 'GALLERY', 'FLOOR_PLAN'] as const;
export type ProjectImageCategory = (typeof PROJECT_IMAGE_CATEGORIES)[number];

export const PROJECT_FEATURE_ICONS = [
  'plan',
  'key',
  'shield',
  'pin',
  'service',
  'calendar',
] as const;
export type ProjectFeatureIcon = (typeof PROJECT_FEATURE_ICONS)[number];

export const statusMeta: Record<ProjectStatus, { label: string; tone: BadgeTone }> = {
  AVAILABLE: { label: 'متاح للبيع', tone: 'success' },
  UNDER_CONSTRUCTION: { label: 'تحت الإنشاء', tone: 'warning' },
  COMING_SOON: { label: 'قريبًا', tone: 'info' },
  SOLD_OUT: { label: 'مباع بالكامل', tone: 'neutral' },
};

export const publishMeta: Record<PublishStatus, { label: string; tone: BadgeTone }> = {
  PUBLISHED: { label: 'منشور', tone: 'success' },
  DRAFT: { label: 'مسودة', tone: 'neutral' },
  ARCHIVED: { label: 'مؤرشف', tone: 'danger' },
};

export const categoryMeta: Record<ProjectImageCategory, { label: string; hint: string }> = {
  COVER: {
    label: 'صورة الغلاف',
    hint: 'تظهر في بطاقات المشاريع وخلفية رأس صفحة المشروع.',
  },
  GALLERY: {
    label: 'معرض الصور',
    hint: 'تظهر في معرض صفحة المشروع وعارض الصور بهذا الترتيب.',
  },
  FLOOR_PLAN: {
    label: 'المخططات',
    hint: 'مخططات الوحدات — محفوظة الآن وستُعرض عند إضافة قسم المخططات للموقع.',
  },
};

export const featureIconLabels: Record<ProjectFeatureIcon, string> = {
  plan: 'مخطط',
  key: 'مفتاح',
  shield: 'حماية',
  pin: 'موقع',
  service: 'خدمة',
  calendar: 'تقويم',
};

/** City keys the website knows (map pins, labels); others are allowed but have no pin. */
export const KNOWN_CITIES: Array<{ key: string; label: string }> = [
  { key: 'jeddah', label: 'جدة' },
  { key: 'riyadh', label: 'الرياض' },
  { key: 'abha', label: 'أبها' },
];

export const cityLabel = (key: string) => KNOWN_CITIES.find((c) => c.key === key)?.label ?? key;

export type SizeRange = { min: number; max: number };

export type ProjectFeature = {
  icon: ProjectFeatureIcon;
  titleAr: string;
  titleEn: string;
  bodyAr?: string | null;
  bodyEn?: string | null;
};

export type ProjectImage = {
  id: string;
  projectId: string;
  mediaId: string;
  category: ProjectImageCategory;
  captionAr: string | null;
  captionEn: string | null;
  order: number;
  media: MediaSummary;
};

export type Project = {
  id: string;
  slug: string;
  titleAr: string;
  titleEn: string;
  summaryAr: string | null;
  summaryEn: string | null;
  descriptionAr: string | null;
  descriptionEn: string | null;
  city: string;
  locationAr: string | null;
  locationEn: string | null;
  status: ProjectStatus;
  publishStatus: PublishStatus;
  featured: boolean;
  order: number;
  unitsCount: number | null;
  sizeRange: SizeRange | null;
  completionYear: number | null;
  features: ProjectFeature[] | null;
  latitude: number | null;
  longitude: number | null;
  metaTitleAr: string | null;
  metaTitleEn: string | null;
  metaDescriptionAr: string | null;
  metaDescriptionEn: string | null;
  coverImageId: string | null;
  coverImage: MediaSummary | null;
  createdAt: string;
  updatedAt: string;
};

export type ProjectListItem = Project & {
  /** First `COVER` image only. */
  gallery?: ProjectImage[];
  _count: { gallery: number; leads: number };
};
export type ProjectDetail = Project & { gallery: ProjectImage[] };

export type ProjectInput = Omit<Project, 'id' | 'coverImage' | 'createdAt' | 'updatedAt'>;
