import type { z } from 'zod';

import type { createPageBody, listPagesQuery, updatePageBody } from './pages.schema.js';

export type ListPagesQuery = z.infer<typeof listPagesQuery>;
export type CreatePageInput = z.infer<typeof createPageBody>;
export type UpdatePageInput = z.infer<typeof updatePageBody>;

/** Slugs of the pages the website renders; seeded and expected to exist. */
export const CORE_PAGE_SLUGS = ['home', 'about', 'services', 'contact', 'leadership'] as const;
export type CorePageSlug = (typeof CORE_PAGE_SLUGS)[number];
