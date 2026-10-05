import { apiFetch, jsonBody } from '@/lib/api-client';

import type { AuthUser, LoginInput, LoginResult } from './types';

type Data<T> = { data: T };

export const authApi = {
  login: async (input: LoginInput) =>
    (await apiFetch<Data<LoginResult>>('/auth/login', { method: 'POST', body: jsonBody(input) }))
      .data,

  me: async (signal?: AbortSignal) => (await apiFetch<Data<AuthUser>>('/auth/me', { signal })).data,
};
