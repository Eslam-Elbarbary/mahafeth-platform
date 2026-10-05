import { apiFetch } from '@/lib/api-client';
import { toQuery } from '@/lib/query';

import type { ActivityItem, DashboardSummary, LeadsChart, TopProject } from './types';

type Data<T> = { data: T };

export const dashboardApi = {
  summary: async () => (await apiFetch<Data<DashboardSummary>>('/admin/dashboard/summary')).data,

  leadsChart: async (days: number) =>
    (await apiFetch<Data<LeadsChart>>(`/admin/dashboard/leads-chart${toQuery({ days })}`)).data,

  topProjects: async (query: { limit?: number; days?: number } = {}) =>
    (await apiFetch<Data<TopProject[]>>(`/admin/dashboard/top-projects${toQuery(query)}`)).data,

  activity: async (limit = 12) =>
    (await apiFetch<Data<ActivityItem[]>>(`/admin/dashboard/activity${toQuery({ limit })}`)).data,
};
