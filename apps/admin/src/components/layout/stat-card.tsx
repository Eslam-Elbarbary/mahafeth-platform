import type { ReactNode } from 'react';
import { Link } from 'react-router';

import { Skeleton } from '@/components/layout/page-header';
import { formatNumber } from '@/lib/format';
import { cn } from '@/lib/utils';

/** KPI tile: icon, label, number (skeleton while `undefined`) and an optional hint line. */
export function StatCard({
  icon,
  label,
  value,
  hint,
  to,
}: {
  icon: ReactNode;
  label: string;
  value: number | undefined;
  hint?: ReactNode;
  /** Makes the whole card a link. */
  to?: string;
}) {
  const body = (
    <>
      <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary [&_svg]:size-5">
        {icon}
      </span>
      <div className="grid min-w-0 gap-0.5">
        <span className="text-xs text-muted-foreground">{label}</span>
        {value === undefined ? (
          <Skeleton className="h-6 w-10" />
        ) : (
          <span className="text-xl font-bold tabular-nums">{formatNumber(value)}</span>
        )}
        {hint && <span className="truncate text-xs text-muted-foreground">{hint}</span>}
      </div>
    </>
  );
  const className = 'flex items-center gap-4 rounded-xl border bg-background p-4 shadow-xs';
  return to ? (
    <Link
      to={to}
      className={cn(className, 'transition-colors hover:border-primary/40 hover:bg-muted/30')}
    >
      {body}
    </Link>
  ) : (
    <div className={className}>{body}</div>
  );
}
