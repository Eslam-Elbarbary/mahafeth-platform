import type { z } from 'zod';

import type { LeadStatus } from '../../generated/prisma/client.js';
import type { listLeadsQuery, submitLeadBody, updateLeadBody } from './leads.schema.js';

export type SubmitLeadInput = z.infer<typeof submitLeadBody>;
export type ListLeadsQuery = z.infer<typeof listLeadsQuery>;
export type UpdateLeadInput = z.infer<typeof updateLeadBody>;

export interface LeadRequestMeta {
  ipAddress: string | null;
  userAgent: string | null;
}

export interface LeadStats {
  total: number;
  /** Leads created in the last 7 days. */
  recent: number;
  byStatus: Record<LeadStatus, number>;
}
