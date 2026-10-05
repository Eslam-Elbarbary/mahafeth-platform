import { z } from 'zod';

import { AuditAction } from '../../generated/prisma/client.js';
import { searchQuery } from '../../lib/schemas.js';

export const AUDIT_ENTITIES = [
  'projects',
  'services',
  'pages',
  'settings',
  'users',
  'leads',
  'media',
  'team',
  'partners',
] as const;

export const listAuditLogsQuery = searchQuery.extend({
  entity: z.enum(AUDIT_ENTITIES).optional(),
  action: z.enum(AuditAction).optional(),
  userId: z.uuid().optional(),
  entityId: z.string().trim().min(1).max(191).optional(),
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
});
