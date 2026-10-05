import { apiFetch } from '@/lib/api-client';
import { toQuery, type Paginated } from '@/lib/query';

import type { AuditAction, AuditEntity, AuditLog } from './types';

export type AuditLogQuery = {
  q?: string;
  page?: number;
  pageSize?: number;
  entity?: AuditEntity;
  action?: AuditAction;
  userId?: string;
  entityId?: string;
  /** ISO timestamps. */
  from?: string;
  to?: string;
};

export const auditLogsApi = {
  list: (query: AuditLogQuery = {}) =>
    apiFetch<Paginated<AuditLog>>(`/admin/audit-logs${toQuery(query)}`),
};
