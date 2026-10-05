import { apiFetch, jsonBody } from '@/lib/api-client';
import { toQuery, type Paginated } from '@/lib/query';

import type { TeamMember, TeamMemberInput } from './types';

type Data<T> = { data: T };

export type TeamListQuery = {
  q?: string;
  page?: number;
  pageSize?: number;
  visible?: boolean;
};

export const teamApi = {
  list: (query: TeamListQuery = {}) =>
    apiFetch<Paginated<TeamMember>>(`/admin/team${toQuery(query)}`),

  get: async (id: string) => (await apiFetch<Data<TeamMember>>(`/admin/team/${id}`)).data,

  create: async (input: Partial<TeamMemberInput>) =>
    (
      await apiFetch<Data<TeamMember>>('/admin/team', {
        method: 'POST',
        body: jsonBody(input),
      })
    ).data,

  update: async (id: string, input: Partial<TeamMemberInput>) =>
    (
      await apiFetch<Data<TeamMember>>(`/admin/team/${id}`, {
        method: 'PATCH',
        body: jsonBody(input),
      })
    ).data,

  remove: (id: string) => apiFetch<void>(`/admin/team/${id}`, { method: 'DELETE' }),

  reorder: (items: Array<{ id: string; order: number }>) =>
    apiFetch<void>('/admin/team/reorder', { method: 'PUT', body: jsonBody({ items }) }),
};
