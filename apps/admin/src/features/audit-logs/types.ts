/* Mirrors `apps/backend/src/modules/audit` response shapes. */
import {
  BriefcaseBusiness,
  Building2,
  FileText,
  Handshake,
  Images,
  Inbox,
  type LucideIcon,
  Pencil,
  Plus,
  Settings,
  Trash2,
  UserCog,
  Users,
} from 'lucide-react';

import type { BadgeTone } from '@/components/ui/badge';
import type { Role } from '@/features/auth/types';

export const AUDIT_ENTITIES = [
  'projects',
  'services',
  'pages',
  'settings',
  'users',
  'leads',
  'media',
  'team',
  'partners',
] as const;
export type AuditEntity = (typeof AUDIT_ENTITIES)[number];

export const AUDIT_ACTIONS = ['CREATE', 'UPDATE', 'DELETE'] as const;
export type AuditAction = (typeof AUDIT_ACTIONS)[number];

export type AuditData = Record<string, unknown>;

export type AuditLog = {
  id: string;
  userId: string | null;
  userName: string | null;
  userEmail: string | null;
  userRole: Role | null;
  action: AuditAction;
  entity: AuditEntity;
  entityId: string;
  entityLabel: string | null;
  oldData: AuditData | null;
  newData: AuditData | null;
  ipAddress: string | null;
  createdAt: string;
  /** Admin URL of the record, or null when it no longer exists. */
  href: string | null;
};

export const entityMeta: Record<AuditEntity, { label: string; plural: string; icon: LucideIcon }> =
  {
    projects: { label: 'مشروع', plural: 'المشاريع', icon: Building2 },
    services: { label: 'خدمة', plural: 'الخدمات', icon: BriefcaseBusiness },
    pages: { label: 'صفحة', plural: 'صفحات الموقع', icon: FileText },
    settings: { label: 'إعداد', plural: 'الإعدادات والمحتوى العام', icon: Settings },
    users: { label: 'مستخدم', plural: 'المستخدمون', icon: UserCog },
    leads: { label: 'طلب اهتمام', plural: 'طلبات الاهتمام', icon: Inbox },
    media: { label: 'ملف وسائط', plural: 'مكتبة الوسائط', icon: Images },
    team: { label: 'عضو فريق', plural: 'فريق القيادة', icon: Users },
    partners: { label: 'شريك', plural: 'الشركاء', icon: Handshake },
  };

/** `entityId` of entries that record a drag-and-drop reorder of a whole list. */
export const REORDER_ENTITY_ID = 'order';

export const actionMeta: Record<
  AuditAction,
  { label: string; verb: string; tone: BadgeTone; icon: LucideIcon }
> = {
  CREATE: { label: 'إنشاء', verb: 'أنشأ', tone: 'success', icon: Plus },
  UPDATE: { label: 'تعديل', verb: 'عدّل', tone: 'info', icon: Pencil },
  DELETE: { label: 'حذف', verb: 'حذف', tone: 'danger', icon: Trash2 },
};
