/* Mirrors `apps/backend/src/modules/dashboard` response shapes. */
import type { LeadStatus } from '@/features/leads/types';
import type { PublishStatus } from '@/features/projects/types';

type PublishCounts = { total: number; published: number };

export type DashboardSummary = {
  projects: PublishCounts & { featured: number };
  services: PublishCounts;
  pages: PublishCounts;
  /** `null` for roles without access to leads. */
  leads: {
    total: number;
    new: number;
    contacted: number;
    qualified: number;
    converted: number;
    lost: number;
    recent: number;
  } | null;
};

export type LeadsChartPoint = { date: string; total: number; converted: number };

export type LeadsChart = {
  days: number;
  timeZone: string;
  series: LeadsChartPoint[];
  total: number;
  converted: number;
  previousTotal: number;
};

export type TopProject = {
  id: string;
  slug: string;
  titleAr: string;
  titleEn: string;
  publishStatus: PublishStatus;
  leads: number;
  converted: number;
};

export type ActivityType =
  'lead' | 'project' | 'service' | 'page' | 'partner' | 'team' | 'media' | 'settings';

export type ActivityItem = {
  id: string;
  type: ActivityType;
  action: 'created' | 'updated';
  title: string;
  detail: string | null;
  status: LeadStatus | PublishStatus | null;
  href: string;
  at: string;
};
