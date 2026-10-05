/* Mirrors `apps/backend/src/modules/leads` request/response shapes. */
import type { BadgeTone } from '@/components/ui/badge';

export type { Paginated } from '@/lib/query';

export const LEAD_STATUSES = ['NEW', 'CONTACTED', 'QUALIFIED', 'CONVERTED', 'LOST'] as const;
export type LeadStatus = (typeof LEAD_STATUSES)[number];

export const LEAD_SOURCES = ['WEBSITE', 'CONTACT_FORM', 'PROJECT_PAGE'] as const;
export type LeadSource = (typeof LEAD_SOURCES)[number];

export const LEAD_INTERESTS = ['OWN', 'INVEST', 'OWNER_SERVICES', 'PARTNERSHIP', 'JOB'] as const;
export type LeadInterest = (typeof LEAD_INTERESTS)[number];

export const leadStatusMeta: Record<LeadStatus, { label: string; tone: BadgeTone }> = {
  NEW: { label: 'جديد', tone: 'info' },
  CONTACTED: { label: 'تم التواصل', tone: 'warning' },
  QUALIFIED: { label: 'مؤهل', tone: 'dark' },
  CONVERTED: { label: 'تم التحويل', tone: 'success' },
  LOST: { label: 'مفقود', tone: 'danger' },
};

export const leadSourceLabels: Record<LeadSource, string> = {
  WEBSITE: 'الموقع',
  CONTACT_FORM: 'نموذج التواصل',
  PROJECT_PAGE: 'صفحة مشروع',
};

export const leadInterestLabels: Record<LeadInterest, string> = {
  OWN: 'تملّك',
  INVEST: 'استثمار',
  OWNER_SERVICES: 'خدمات الملاك',
  PARTNERSHIP: 'شراكة',
  JOB: 'توظيف',
};

export type LeadUser = { id: string; name: string; email: string };

export type Lead = {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  city: string | null;
  interestType: LeadInterest | null;
  message: string | null;
  projectId: string | null;
  locale: 'ar' | 'en';
  source: LeadSource;
  status: LeadStatus;
  notes: string | null;
  assignedToId: string | null;
  createdAt: string;
  updatedAt: string;
  project: { id: string; slug: string; titleAr: string; titleEn: string } | null;
  assignedTo: LeadUser | null;
};

export type LeadStats = {
  total: number;
  recent: number;
  byStatus: Record<LeadStatus, number>;
};

export type LeadUpdateInput = Partial<{
  status: LeadStatus;
  notes: string | null;
  assignedToId: string | null;
}>;
