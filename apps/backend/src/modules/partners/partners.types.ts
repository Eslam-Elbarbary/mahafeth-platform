import type { z } from 'zod';

import type { createPartnerBody, listPartnersQuery, updatePartnerBody } from './partners.schema.js';

export type ListPartnersQuery = z.infer<typeof listPartnersQuery>;
export type CreatePartnerInput = z.infer<typeof createPartnerBody>;
export type UpdatePartnerInput = z.infer<typeof updatePartnerBody>;
