import { Star } from 'lucide-react';

import { Badge } from '@/components/ui/badge';

import { publishMeta, statusMeta, type ProjectStatus, type PublishStatus } from './types';

export function ProjectStatusBadge({ status }: { status: ProjectStatus }) {
  const meta = statusMeta[status];
  return (
    <Badge tone={meta.tone} dot>
      {meta.label}
    </Badge>
  );
}

export function PublishBadge({ status }: { status: PublishStatus }) {
  const meta = publishMeta[status];
  return <Badge tone={meta.tone}>{meta.label}</Badge>;
}

export function FeaturedBadge() {
  return (
    <Badge tone="warning">
      <Star className="fill-current" /> مميز
    </Badge>
  );
}
