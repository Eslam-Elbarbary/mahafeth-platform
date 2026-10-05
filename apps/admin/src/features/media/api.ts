import { apiFetch, jsonBody } from '@/lib/api-client';
import { toQuery, type Paginated } from '@/lib/query';

import type { MediaItem } from './types';

type Data<T> = { data: T };

export type MediaListQuery = { q?: string; page?: number; pageSize?: number; type?: string };

export type MediaUploadMeta = {
  altAr?: string;
  altEn?: string;
  width?: number;
  height?: number;
};

export const mediaApi = {
  list: (query: MediaListQuery = {}) =>
    apiFetch<Paginated<MediaItem>>(`/admin/media${toQuery({ type: 'image/', ...query })}`),

  get: async (id: string) => (await apiFetch<Data<MediaItem>>(`/admin/media/${id}`)).data,

  upload: async (file: File, meta: MediaUploadMeta = {}) => {
    const form = new FormData();
    form.set('file', file);
    for (const [key, value] of Object.entries(meta)) {
      if (value !== undefined && value !== '') form.set(key, String(value));
    }
    return (await apiFetch<Data<MediaItem>>('/admin/media', { method: 'POST', body: form })).data;
  },

  update: async (id: string, input: { altAr: string | null; altEn: string | null }) =>
    (
      await apiFetch<Data<MediaItem>>(`/admin/media/${id}`, {
        method: 'PATCH',
        body: jsonBody(input),
      })
    ).data,

  remove: (id: string) => apiFetch<void>(`/admin/media/${id}`, { method: 'DELETE' }),
};
