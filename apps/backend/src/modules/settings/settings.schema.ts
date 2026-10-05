import { z } from 'zod';

export const settingKey = z
  .string()
  .trim()
  .max(120)
  .regex(/^[a-z][a-zA-Z0-9]*(?:\.[a-zA-Z0-9]+)*$/, 'Use dot-separated keys, e.g. contact.phone');

export const keyParams = z.object({ key: settingKey });

/** `nested` (default): `{ group: { field } }` with media URLs; `flat`: the original key → value map. */
export const publicSettingsQuery = z.object({
  format: z.enum(['nested', 'flat']).default('nested'),
});

export const listSettingsQuery = z.object({
  group: z.string().trim().max(60).optional(),
});

export const upsertSettingBody = z.object({
  value: z.json().refine((v) => v !== null, 'Value cannot be null; delete the setting instead'),
  group: z.string().trim().min(1).max(60).optional(),
  isPublic: z.boolean().optional(),
  description: z.string().trim().max(255).nullish(),
});

export const bulkUpsertSettingsBody = z.object({
  items: z
    .array(upsertSettingBody.extend({ key: settingKey }))
    .min(1)
    .max(200),
});
