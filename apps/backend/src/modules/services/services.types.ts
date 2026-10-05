import type { z } from 'zod';

import type { createServiceBody, listServicesQuery, updateServiceBody } from './services.schema.js';

export type ListServicesQuery = z.infer<typeof listServicesQuery>;
export type CreateServiceInput = z.infer<typeof createServiceBody>;
export type UpdateServiceInput = z.infer<typeof updateServiceBody>;
