import { apiFetch, jsonBody } from '@/lib/api-client';

import type { Setting, SettingInput } from './types';

type Data<T> = { data: T };

export const settingsApi = {
  list: async () => (await apiFetch<Data<Setting[]>>('/admin/settings')).data,

  save: async (items: SettingInput[]) =>
    (
      await apiFetch<Data<Setting[]>>('/admin/settings', {
        method: 'PUT',
        body: jsonBody({ items }),
      })
    ).data,
};
