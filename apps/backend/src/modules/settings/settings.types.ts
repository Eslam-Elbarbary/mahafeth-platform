import type { z } from 'zod';

import type {
  bulkUpsertSettingsBody,
  listSettingsQuery,
  upsertSettingBody,
} from './settings.schema.js';

export type ListSettingsQuery = z.infer<typeof listSettingsQuery>;
export type UpsertSettingInput = z.infer<typeof upsertSettingBody>;
export type BulkUpsertSettingsInput = z.infer<typeof bulkUpsertSettingsBody>;

/** Public settings flattened to `{ [key]: value }` for the website. */
export type PublicSettings = Record<string, unknown>;
