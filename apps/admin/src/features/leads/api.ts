import { apiFetch, jsonBody } from '@/lib/api-client';
import { toQuery, type Paginated } from '@/lib/query';

import type { Lead, LeadSource, LeadStats, LeadStatus, LeadUpdateInput, LeadUser } from './types';

type Data<T> = { data: T };

export type LeadListQuery = {
  q?: string;
  page?: number;
  pageSize?: number;
  status?: LeadStatus;
  source?: LeadSource;
  projectId?: string;
};

export const leadsApi = {
  list: (query: LeadListQuery = {}) => apiFetch<Paginated<Lead>>(`/admin/leads${toQuery(query)}`),

  stats: async () => (await apiFetch<Data<LeadStats>>('/admin/leads/stats')).data,

  assignees: async () => (await apiFetch<Data<LeadUser[]>>('/admin/leads/assignees')).data,

  get: async (id: string) => (await apiFetch<Data<Lead>>(`/admin/leads/${id}`)).data,

  update: async (id: string, input: LeadUpdateInput) =>
    (
      await apiFetch<Data<Lead>>(`/admin/leads/${id}`, {
        method: 'PATCH',
        body: jsonBody(input),
      })
    ).data,

  remove: (id: string) => apiFetch<void>(`/admin/leads/${id}`, { method: 'DELETE' }),
};
