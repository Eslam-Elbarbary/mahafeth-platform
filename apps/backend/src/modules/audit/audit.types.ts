import type { z } from 'zod';

import type { AuditAction } from '../../generated/prisma/client.js';
import type { AUDIT_ENTITIES, listAuditLogsQuery } from './audit.schema.js';

export type AuditEntity = (typeof AUDIT_ENTITIES)[number];
export type ListAuditLogsQuery = z.infer<typeof listAuditLogsQuery>;

export type AuditData = Record<string, unknown>;

export interface AuditEntry {
  action: AuditAction;
  entity: AuditEntity;
  entityId: string;
  entityLabel?: string | null;
  oldData?: AuditData | null;
  newData?: AuditData | null;
}
