import { apiFetch, jsonBody } from '@/lib/api-client';
import { toQuery, type Paginated } from '@/lib/query';

import type {
  ProjectDetail,
  ProjectImage,
  ProjectImageCategory,
  ProjectInput,
  ProjectListItem,
  ProjectStatus,
  PublishStatus,
} from './types';

type Data<T> = { data: T };

export type ProjectListQuery = {
  q?: string;
  page?: number;
  pageSize?: number;
  city?: string;
  status?: ProjectStatus;
  publishStatus?: PublishStatus;
  featured?: boolean;
};

export const projectsApi = {
  list: (query: ProjectListQuery = {}) =>
    apiFetch<Paginated<ProjectListItem>>(`/admin/projects${toQuery(query)}`),

  get: async (id: string) => (await apiFetch<Data<ProjectDetail>>(`/admin/projects/${id}`)).data,

  create: async (input: Partial<ProjectInput>) =>
    (
      await apiFetch<Data<ProjectDetail>>('/admin/projects', {
        method: 'POST',
        body: jsonBody(input),
      })
    ).data,

  update: async (id: string, input: Partial<ProjectInput>) =>
    (
      await apiFetch<Data<ProjectDetail>>(`/admin/projects/${id}`, {
        method: 'PATCH',
        body: jsonBody(input),
      })
    ).data,

  remove: (id: string) => apiFetch<void>(`/admin/projects/${id}`, { method: 'DELETE' }),

  addImage: async (
    id: string,
    input: {
      mediaId: string;
      category: ProjectImageCategory;
      captionAr?: string;
      captionEn?: string;
    },
  ) =>
    (
      await apiFetch<Data<ProjectImage>>(`/admin/projects/${id}/images`, {
        method: 'POST',
        body: jsonBody(input),
      })
    ).data,

  updateImage: async (
    id: string,
    imageId: string,
    input: Partial<Pick<ProjectImage, 'category' | 'captionAr' | 'captionEn' | 'order'>>,
  ) =>
    (
      await apiFetch<Data<ProjectImage>>(`/admin/projects/${id}/images/${imageId}`, {
        method: 'PATCH',
        body: jsonBody(input),
      })
    ).data,

  removeImage: (id: string, imageId: string) =>
    apiFetch<void>(`/admin/projects/${id}/images/${imageId}`, { method: 'DELETE' }),

  reorderImages: async (id: string, items: Array<{ id: string; order: number }>) =>
    (
      await apiFetch<Data<ProjectImage[]>>(`/admin/projects/${id}/images/reorder`, {
        method: 'PUT',
        body: jsonBody({ items }),
      })
    ).data,
};
