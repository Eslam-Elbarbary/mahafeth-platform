import { apiFetch, jsonBody } from '@/lib/api-client';
import { toQuery, type Paginated } from '@/lib/query';

import type {
  PageDetail,
  PageInput,
  PageListItem,
  PageSection,
  SectionInput,
  SectionType,
} from './types';

type Data<T> = { data: T };

export const pagesApi = {
  list: () => apiFetch<Paginated<PageListItem>>(`/admin/pages${toQuery({ pageSize: 100 })}`),

  getBySlug: async (slug: string) =>
    (await apiFetch<Data<PageDetail>>(`/admin/pages/by-slug/${encodeURIComponent(slug)}`)).data,

  update: async (id: string, input: Partial<PageInput>) =>
    (
      await apiFetch<Data<PageDetail>>(`/admin/pages/${id}`, {
        method: 'PATCH',
        body: jsonBody(input),
      })
    ).data,
};

export const sectionsApi = {
  create: async (pageId: string, type: SectionType, input: Partial<SectionInput> = {}) =>
    (
      await apiFetch<Data<PageSection>>('/admin/sections', {
        method: 'POST',
        body: jsonBody({ pageId, type, ...input }),
      })
    ).data,

  update: async (id: string, input: Partial<SectionInput>) =>
    (
      await apiFetch<Data<PageSection>>(`/admin/sections/${id}`, {
        method: 'PATCH',
        body: jsonBody(input),
      })
    ).data,

  reorder: (pageId: string, ids: string[]) =>
    apiFetch<unknown>('/admin/sections/reorder', {
      method: 'PUT',
      body: jsonBody({ pageId, items: ids.map((id, order) => ({ id, order })) }),
    }),
};
