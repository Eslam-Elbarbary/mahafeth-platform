import { Badge } from '@/components/ui/badge';

import { leadStatusMeta, type LeadStatus } from './types';

export function LeadStatusBadge({ status }: { status: LeadStatus }) {
  const meta = leadStatusMeta[status];
  return (
    <Badge tone={meta.tone} dot>
      {meta.label}
    </Badge>
  );
}
