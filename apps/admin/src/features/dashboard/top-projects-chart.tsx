import { Building2 } from 'lucide-react';
import { Link } from 'react-router';

import { EmptyState, Skeleton } from '@/components/layout/page-header';
import { Section } from '@/components/ui/form-controls';
import { formatNumber } from '@/lib/format';
import { describeApiError, useApiQuery } from '@/lib/use-api-query';

import { dashboardApi } from './api';

const LIMIT = 5;

/** Projects ranked by leads in the chart period; bar = leads, dark part = converted. */
export function TopProjectsChart({ days, className }: { days: number; className?: string }) {
  const { data, error } = useApiQuery(`dashboard-top-projects|${days}`, () =>
    dashboardApi.topProjects({ limit: LIMIT, days }),
  );
  const max = Math.max(1, ...(data ?? []).map((p) => p.leads));

  return (
    <Section
      title="المشاريع الأكثر طلبًا"
      description={`حسب طلبات آخر ${formatNumber(days)} يومًا.`}
      className={className}
    >
      {error && !data ? (
        <p className="text-sm text-destructive">{describeApiError(error)}</p>
      ) : !data ? (
        <div className="grid gap-4">
          {Array.from({ length: 4 }, (_, i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </div>
      ) : data.length === 0 ? (
        <EmptyState
          icon={<Building2 />}
          title="لا توجد طلبات مرتبطة بمشاريع"
          description="تظهر هنا المشاريع عند وصول طلبات من صفحاتها."
        />
      ) : (
        <ol className="grid gap-4">
          {data.map((project, i) => (
            <li key={project.id} data-project-id={project.id} className="grid gap-1.5">
              <div className="flex items-center justify-between gap-3 text-sm">
                <Link
                  to={`/leads?project=${project.id}`}
                  className="flex min-w-0 items-center gap-2 font-medium hover:text-primary"
                >
                  <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-muted text-[11px] tabular-nums">
                    {formatNumber(i + 1)}
                  </span>
                  <span className="truncate">{project.titleAr}</span>
                </Link>
                <span className="shrink-0 text-xs text-muted-foreground tabular-nums">
                  {formatNumber(project.leads)} طلب · {formatNumber(project.converted)} محوّل
                </span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-muted">
                <div
                  className="relative h-full rounded-full bg-primary/30"
                  style={{ width: `${(project.leads / max) * 100}%` }}
                >
                  <div
                    className="absolute inset-y-0 start-0 rounded-full bg-primary"
                    style={{ width: `${(project.converted / project.leads) * 100}%` }}
                  />
                </div>
              </div>
            </li>
          ))}
        </ol>
      )}
    </Section>
  );
}
