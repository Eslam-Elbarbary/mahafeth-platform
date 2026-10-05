import type { z } from 'zod';

import type { LeadStatus, PublishStatus } from '../../generated/prisma/client.js';
import type { activityQuery, leadsChartQuery, topProjectsQuery } from './dashboard.schema.js';

export type LeadsChartQuery = z.infer<typeof leadsChartQuery>;
export type TopProjectsQuery = z.infer<typeof topProjectsQuery>;
export type ActivityQuery = z.infer<typeof activityQuery>;

export interface PublishCounts {
  total: number;
  published: number;
}

export interface DashboardSummary {
  projects: PublishCounts & { featured: number };
  services: PublishCounts;
  pages: PublishCounts;
  /** `null` for roles that cannot see leads (personal data). */
  leads: {
    total: number;
    new: number;
    contacted: number;
    qualified: number;
    converted: number;
    lost: number;
    /** Created in the last 7 days. */
    recent: number;
  } | null;
}

export interface LeadsChartPoint {
  /** `YYYY-MM-DD` in the reporting time zone. */
  date: string;
  total: number;
  converted: number;
}

export interface LeadsChart {
  days: number;
  timeZone: string;
  series: LeadsChartPoint[];
  total: number;
  converted: number;
  /** Leads in the equal-length period before `series`, for the trend. */
  previousTotal: number;
}

export interface TopProject {
  id: string;
  slug: string;
  titleAr: string;
  titleEn: string;
  publishStatus: PublishStatus;
  leads: number;
  converted: number;
}

export type ActivityType =
  'lead' | 'project' | 'service' | 'page' | 'partner' | 'team' | 'media' | 'settings';

export interface ActivityItem {
  id: string;
  type: ActivityType;
  action: 'created' | 'updated';
  title: string;
  /** Extra context: lead status, settings group, uploader… */
  detail: string | null;
  status: LeadStatus | PublishStatus | null;
  /** Admin route of the record. */
  href: string;
  at: Date;
}
