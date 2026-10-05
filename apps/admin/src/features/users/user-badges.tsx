import { ShieldCheck } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import type { Role } from '@/features/auth/types';
import { cn } from '@/lib/utils';

import { roleMeta } from './types';

export function RoleBadge({ role }: { role: Role }) {
  const meta = roleMeta[role];
  return (
    <Badge tone={meta.tone} data-role={role}>
      {role === 'SUPER_ADMIN' && <ShieldCheck />}
      {meta.label}
    </Badge>
  );
}

const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');

export function UserAvatar({ name, className }: { name: string; className?: string }) {
  return (
    <span
      aria-hidden
      className={cn(
        'flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary',
        className,
      )}
    >
      {initials(name) || '?'}
    </span>
  );
}
