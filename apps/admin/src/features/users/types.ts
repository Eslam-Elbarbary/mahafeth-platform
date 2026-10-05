/* Mirrors `apps/backend/src/modules/users` request/response shapes. */
import type { BadgeTone } from '@/components/ui/badge';
import type { Role } from '@/features/auth/types';

export const ROLES = ['SUPER_ADMIN', 'ADMIN', 'EDITOR'] as const satisfies readonly Role[];

export const USER_STATUSES = ['ACTIVE', 'INACTIVE'] as const;
export type UserStatus = (typeof USER_STATUSES)[number];

export const roleMeta: Record<Role, { label: string; description: string; tone: BadgeTone }> = {
  SUPER_ADMIN: {
    label: 'مدير عام',
    description: 'صلاحيات كاملة: المحتوى والطلبات والإعدادات والمستخدمون وسجل التغييرات.',
    tone: 'dark',
  },
  ADMIN: {
    label: 'مدير',
    description: 'إدارة المحتوى وطلبات الاهتمام، دون المستخدمين والإعدادات.',
    tone: 'info',
  },
  EDITOR: {
    label: 'محرر',
    description: 'إدارة المحتوى فقط: المشاريع والخدمات والصفحات والوسائط والفريق والشركاء.',
    tone: 'neutral',
  },
};

export const userStatusLabels: Record<UserStatus, string> = {
  ACTIVE: 'نشط',
  INACTIVE: 'معطّل',
};

export type User = {
  id: string;
  name: string;
  email: string;
  role: Role;
  isActive: boolean;
  lastLoginAt: string | null;
  createdAt: string;
  updatedAt: string;
  _count: { assignedLeads: number };
};

export type UserStats = {
  total: number;
  active: number;
  inactive: number;
  byRole: Record<Role, number>;
};

export type UserCreateInput = {
  name: string;
  email: string;
  role: Role;
  isActive: boolean;
  password: string;
};

export type UserUpdateInput = Partial<Omit<UserCreateInput, 'password'>>;

/** Arabic messages for the users API's rule violations (by error code). */
export const userErrorMessages: Record<string, string> = {
  EMAIL_TAKEN: 'البريد الإلكتروني مستخدم لحساب آخر.',
  SELF_DELETE: 'لا يمكنك حذف حسابك.',
  SELF_UPDATE: 'لا يمكنك تغيير دورك أو تعطيل حسابك.',
  LAST_SUPER_ADMIN: 'يجب أن يبقى مدير عام نشط واحد على الأقل.',
};

/** Password rule shared with the API (`auth.schema.ts`). */
export const PASSWORD_MIN = 10;
