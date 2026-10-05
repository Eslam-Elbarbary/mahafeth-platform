import { apiFetch, jsonBody } from '@/lib/api-client';
import { toQuery, type Paginated } from '@/lib/query';

import type { Partner, PartnerInput } from './types';

type Data<T> = { data: T };

export type PartnerListQuery = {
  q?: string;
  page?: number;
  pageSize?: number;
  visible?: boolean;
};

export const partnersApi = {
  list: (query: PartnerListQuery = {}) =>
    apiFetch<Paginated<Partner>>(`/admin/partners${toQuery(query)}`),

  get: async (id: string) => (await apiFetch<Data<Partner>>(`/admin/partners/${id}`)).data,

  create: async (input: Partial<PartnerInput>) =>
    (
      await apiFetch<Data<Partner>>('/admin/partners', {
        method: 'POST',
        body: jsonBody(input),
      })
    ).data,

  update: async (id: string, input: Partial<PartnerInput>) =>
    (
      await apiFetch<Data<Partner>>(`/admin/partners/${id}`, {
        method: 'PATCH',
        body: jsonBody(input),
      })
    ).data,

  remove: (id: string) => apiFetch<void>(`/admin/partners/${id}`, { method: 'DELETE' }),

  reorder: (items: Array<{ id: string; order: number }>) =>
    apiFetch<void>('/admin/partners/reorder', { method: 'PUT', body: jsonBody({ items }) }),
};
