import type { z } from 'zod';

import type {
  createSectionBody,
  listSectionsQuery,
  reorderSectionsBody,
  updateSectionBody,
} from './sections.schema.js';

export type ListSectionsQuery = z.infer<typeof listSectionsQuery>;
export type CreateSectionInput = z.infer<typeof createSectionBody>;
export type UpdateSectionInput = z.infer<typeof updateSectionBody>;
export type ReorderSectionsInput = z.infer<typeof reorderSectionsBody>;
