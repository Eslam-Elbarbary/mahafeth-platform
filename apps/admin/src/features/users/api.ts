import type { Role } from '@/features/auth/types';
import { ApiError, apiFetch, jsonBody } from '@/lib/api-client';
import { toQuery, type Paginated } from '@/lib/query';
import { describeApiError } from '@/lib/use-api-query';

import {
  type User,
  type UserCreateInput,
  userErrorMessages,
  type UserStats,
  type UserStatus,
  type UserUpdateInput,
} from './types';

type Data<T> = { data: T };

export type UserListQuery = {
  q?: string;
  page?: number;
  pageSize?: number;
  role?: Role;
  status?: UserStatus;
};

export const usersApi = {
  list: (query: UserListQuery = {}) => apiFetch<Paginated<User>>(`/admin/users${toQuery(query)}`),

  stats: async () => (await apiFetch<Data<UserStats>>('/admin/users/stats')).data,

  get: async (id: string) => (await apiFetch<Data<User>>(`/admin/users/${id}`)).data,

  create: async (input: UserCreateInput) =>
    (await apiFetch<Data<User>>('/admin/users', { method: 'POST', body: jsonBody(input) })).data,

  update: async (id: string, input: UserUpdateInput) =>
    (
      await apiFetch<Data<User>>(`/admin/users/${id}`, {
        method: 'PATCH',
        body: jsonBody(input),
      })
    ).data,

  resetPassword: (id: string, password: string) =>
    apiFetch<void>(`/admin/users/${id}/reset-password`, {
      method: 'POST',
      body: jsonBody({ password }),
    }),

  remove: (id: string) => apiFetch<void>(`/admin/users/${id}`, { method: 'DELETE' }),
};

/** Arabic message for a users API failure, including its rule violations. */
export function describeUserError(error: unknown) {
  if (!(error instanceof ApiError)) return undefined;
  return (error.code && userErrorMessages[error.code]) || describeApiError(error);
}
