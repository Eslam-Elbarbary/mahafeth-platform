import { z } from 'zod';

export const idParams = z.object({ id: z.uuid() });
export const slugParams = z.object({ slug: z.string().min(1).max(160) });

export const slug = z
  .string()
  .trim()
  .toLowerCase()
  .max(160)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Use lowercase letters, numbers and single dashes');

export const requiredText = (max: number) => z.string().trim().min(1).max(max);
export const optionalText = (max: number) => z.string().trim().max(max).nullish();
export const longText = z.string().trim().max(65_000).nullish();
export const mediaId = z.uuid().nullish();
export const sortOrder = z.number().int().min(0).max(100_000);

export const paginationQuery = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

export const searchQuery = paginationQuery.extend({
  q: z.string().trim().min(1).max(120).optional(),
});

export const reorderBody = z.object({
  items: z
    .array(z.object({ id: z.uuid(), order: sortOrder }))
    .min(1)
    .max(500),
});

export const booleanQuery = z.stringbool().optional();

export type Pagination = z.infer<typeof paginationQuery>;
export type ReorderInput = z.infer<typeof reorderBody>;
