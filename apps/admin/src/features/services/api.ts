import { apiFetch, jsonBody } from '@/lib/api-client';
import { toQuery, type Paginated } from '@/lib/query';

import type { PublishStatus, Service, ServiceInput } from './types';

type Data<T> = { data: T };

export type ServiceListQuery = {
  q?: string;
  page?: number;
  pageSize?: number;
  status?: PublishStatus;
};

export const servicesApi = {
  list: (query: ServiceListQuery = {}) =>
    apiFetch<Paginated<Service>>(`/admin/services${toQuery(query)}`),

  get: async (id: string) => (await apiFetch<Data<Service>>(`/admin/services/${id}`)).data,

  create: async (input: Partial<ServiceInput>) =>
    (
      await apiFetch<Data<Service>>('/admin/services', {
        method: 'POST',
        body: jsonBody(input),
      })
    ).data,

  update: async (id: string, input: Partial<ServiceInput>) =>
    (
      await apiFetch<Data<Service>>(`/admin/services/${id}`, {
        method: 'PATCH',
        body: jsonBody(input),
      })
    ).data,

  remove: (id: string) => apiFetch<void>(`/admin/services/${id}`, { method: 'DELETE' }),
};
