import type { Role } from '@/features/auth/types';
import {
  leadInterestLabels,
  leadSourceLabels,
  leadStatusMeta,
  type LeadInterest,
  type LeadSource,
  type LeadStatus,
} from '@/features/leads/types';
import { sectionLabel } from '@/features/pages/section-schemas';
import type { SectionType } from '@/features/pages/types';
import {
  categoryMeta,
  cityLabel,
  publishMeta,
  statusMeta,
  type ProjectImageCategory,
  type ProjectStatus,
  type PublishStatus,
} from '@/features/projects/types';
import { roleMeta } from '@/features/users/types';
import { formatBytes, formatDateTime, formatNumber } from '@/lib/format';

import type { AuditData, AuditEntity, AuditLog } from './types';

const FIELD_LABELS: Record<string, string> = {
  titleAr: 'العنوان (عربي)',
  titleEn: 'العنوان (إنجليزي)',
  slug: 'الرابط',
  summaryAr: 'الملخص (عربي)',
  summaryEn: 'الملخص (إنجليزي)',
  descriptionAr: 'الوصف (عربي)',
  descriptionEn: 'الوصف (إنجليزي)',
  city: 'المدينة',
  locationAr: 'الموقع (عربي)',
  locationEn: 'الموقع (إنجليزي)',
  status: 'الحالة',
  publishStatus: 'حالة النشر',
  featured: 'مميز',
  order: 'الترتيب',
  unitsCount: 'عدد الوحدات',
  sizeRange: 'المساحات',
  completionYear: 'سنة التسليم',
  features: 'المزايا',
  latitude: 'خط العرض',
  longitude: 'خط الطول',
  metaTitleAr: 'عنوان SEO (عربي)',
  metaTitleEn: 'عنوان SEO (إنجليزي)',
  metaDescriptionAr: 'وصف SEO (عربي)',
  metaDescriptionEn: 'وصف SEO (إنجليزي)',
  coverImageId: 'صورة الغلاف',
  imageId: 'الصورة',
  ogImageId: 'صورة المشاركة',
  icon: 'الأيقونة',
  publishedAt: 'تاريخ النشر',
  name: 'الاسم',
  email: 'البريد الإلكتروني',
  role: 'الدور',
  isActive: 'الحساب نشط',
  passwordReset: 'كلمة المرور',
  phone: 'الجوال',
  interestType: 'نوع الاهتمام',
  message: 'الرسالة',
  locale: 'لغة الزائر',
  source: 'المصدر',
  notes: 'الملاحظات',
  project: 'المشروع',
  assignedTo: 'المسؤول',
  key: 'المفتاح',
  group: 'المجموعة',
  value: 'القيمة',
  isPublic: 'عام',
  description: 'الوصف',
  content: 'المحتوى',
  contentAr: 'المحتوى (عربي)',
  contentEn: 'المحتوى (إنجليزي)',
  visible: 'ظاهر',
  category: 'التصنيف',
  mediaId: 'الملف',
  url: 'رابط الملف',
  captionAr: 'الوصف (عربي)',
  captionEn: 'الوصف (إنجليزي)',
  filename: 'اسم الملف المخزّن',
  originalName: 'اسم الملف',
  mimeType: 'نوع الملف',
  size: 'الحجم',
  width: 'العرض',
  height: 'الارتفاع',
  altAr: 'النص البديل (عربي)',
  altEn: 'النص البديل (إنجليزي)',
  nameAr: 'الاسم (عربي)',
  nameEn: 'الاسم (إنجليزي)',
  positionAr: 'المنصب (عربي)',
  positionEn: 'المنصب (إنجليزي)',
  bioAr: 'النبذة (عربي)',
  bioEn: 'النبذة (إنجليزي)',
  photoId: 'الصورة',
  logoId: 'الشعار',
  websiteUrl: 'الموقع الإلكتروني',
};

/** Bookkeeping fields left out of create/delete snapshots. */
export const HIDDEN_FIELDS = new Set(['id', 'createdAt', 'updatedAt', 'deletedAt']);

/** `section:HERO` / `section:RICH_TEXT:ab12cd34` (page section changes) → its section type. */
export const sectionTypeOf = (key: string) =>
  key.startsWith('section:') ? (key.split(':')[1] as SectionType) : null;

export function fieldLabel(key: string) {
  // `gallery:<image short id>` (project image changes) and `order:<item name>` (list reorders).
  if (key.startsWith('gallery:')) return `صورة المعرض · ${key.slice(8)}`;
  if (key.startsWith('order:')) return `ترتيب: ${key.slice(6)}`;
  const section = sectionTypeOf(key);
  if (section) {
    try {
      return `قسم: ${sectionLabel(section)}`;
    } catch {
      return `قسم: ${section}`;
    }
  }
  return FIELD_LABELS[key] ?? key;
}

const ISO_DATE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/;

/** Readable text for a scalar value, or `null` when it needs structured rendering. */
export function formatValue(entity: AuditEntity, key: string, value: unknown): string | null {
  if (value === null || value === undefined || value === '') return '—';
  if (typeof value === 'boolean') {
    if (key === 'passwordReset') return value ? 'أُعيد تعيينها' : '—';
    return value ? 'نعم' : 'لا';
  }
  if (typeof value === 'number') {
    if (key === 'completionYear') return String(value);
    if (key === 'size') return formatBytes(value);
    return formatNumber(value);
  }
  if (typeof value !== 'string') {
    if (typeof value === 'object' && !Array.isArray(value)) {
      const named = value as { titleAr?: unknown; name?: unknown };
      if (typeof named.titleAr === 'string') return named.titleAr;
      if (typeof named.name === 'string') return named.name;
    }
    return null;
  }
  if (key === 'role' && value in roleMeta) return roleMeta[value as Role].label;
  if (key === 'publishStatus' && value in publishMeta)
    return publishMeta[value as PublishStatus].label;
  if (key === 'status') {
    if (entity === 'leads' && value in leadStatusMeta)
      return leadStatusMeta[value as LeadStatus].label;
    if (entity === 'projects' && value in statusMeta)
      return statusMeta[value as ProjectStatus].label;
    if (value in publishMeta) return publishMeta[value as PublishStatus].label;
  }
  if (key === 'source' && value in leadSourceLabels) return leadSourceLabels[value as LeadSource];
  if (key === 'interestType' && value in leadInterestLabels) {
    return leadInterestLabels[value as LeadInterest];
  }
  if (key === 'category' && value in categoryMeta) {
    return categoryMeta[value as ProjectImageCategory].label;
  }
  if (key === 'city') return cityLabel(value);
  if (key === 'locale') return value === 'ar' ? 'العربية' : 'English';
  if (ISO_DATE.test(value)) return formatDateTime(value);
  return value;
}

/** The fields an entry shows: changed fields for updates, the snapshot for create/delete. */
export function changedFields(log: AuditLog): string[] {
  const data: AuditData = (log.action === 'DELETE' ? log.oldData : log.newData) ?? {};
  const keys = Object.keys(data);
  return log.action === 'UPDATE' ? keys : keys.filter((key) => !HIDDEN_FIELDS.has(key));
}
