import { TrendingDown, TrendingUp } from 'lucide-react';

import { Skeleton } from '@/components/layout/page-header';
import { Section } from '@/components/ui/form-controls';
import { formatDay, formatNumber } from '@/lib/format';
import { describeApiError, useApiQuery } from '@/lib/use-api-query';
import { cn } from '@/lib/utils';

import { dashboardApi } from './api';
import type { LeadsChart as LeadsChartData } from './types';

const CHART_PERIODS = [7, 30, 90] as const;
export type ChartPeriod = (typeof CHART_PERIODS)[number];

const TICKS = 5;

function PeriodSwitch({
  value,
  onChange,
}: {
  value: ChartPeriod;
  onChange: (days: ChartPeriod) => void;
}) {
  return (
    <div
      role="group"
      aria-label="الفترة"
      className="flex gap-1 rounded-lg border bg-muted/40 p-0.5"
    >
      {CHART_PERIODS.map((days) => (
        <button
          key={days}
          type="button"
          aria-pressed={value === days}
          data-days={days}
          onClick={() => onChange(days)}
          className={cn(
            'rounded-md px-2.5 py-1 text-xs font-medium transition-colors',
            value === days
              ? 'bg-background text-foreground shadow-xs'
              : 'text-muted-foreground hover:text-foreground',
          )}
        >
          {formatNumber(days)} يومًا
        </button>
      ))}
    </div>
  );
}

function Trend({ current, previous }: { current: number; previous: number }) {
  if (previous === 0) return null;
  const change = Math.round(((current - previous) / previous) * 100);
  const up = change >= 0;
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 text-xs font-medium',
        up ? 'text-success' : 'text-destructive',
      )}
      title="مقارنة بالفترة السابقة"
    >
      {up ? <TrendingUp className="size-3.5" /> : <TrendingDown className="size-3.5" />}
      <span dir="ltr">
        {up ? '+' : ''}
        {formatNumber(change)}%
      </span>
    </span>
  );
}

function Bars({ data }: { data: LeadsChartData }) {
  const max = Math.max(1, ...data.series.map((p) => p.total));
  const step = Math.max(1, Math.floor((data.series.length - 1) / (TICKS - 1)));
  const ticks = new Set(
    data.series.map((_, i) => i).filter((i) => i % step === 0 || i === data.series.length - 1),
  );

  return (
    <div className="grid gap-2">
      <div className="relative h-52">
        <div className="pointer-events-none absolute inset-0 flex flex-col justify-between">
          {[max, Math.round(max / 2), 0].map((value, i) => (
            <div key={i} className="flex items-center gap-2">
              <span className="w-6 text-end text-[10px] text-muted-foreground tabular-nums">
                {formatNumber(value)}
              </span>
              <span className="h-px flex-1 border-t border-dashed" />
            </div>
          ))}
        </div>
        <div
          className={cn(
            'absolute inset-y-0 start-8 end-0 flex items-end',
            data.series.length > 45 ? 'gap-px' : 'gap-1',
          )}
        >
          {data.series.map((point) => (
            <div
              key={point.date}
              className="group relative flex h-full flex-1 items-end"
              data-date={point.date}
              data-total={point.total}
            >
              <div
                className="relative w-full overflow-hidden rounded-t-sm bg-primary/25 transition-colors group-hover:bg-primary/40"
                style={{ height: point.total ? `${(point.total / max) * 100}%` : '2px' }}
              >
                <div
                  className="absolute inset-x-0 bottom-0 bg-primary"
                  style={{ height: point.total ? `${(point.converted / point.total) * 100}%` : 0 }}
                />
              </div>
              <div className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-1 hidden -translate-x-1/2 rounded-md border bg-popover px-2 py-1 text-xs whitespace-nowrap shadow-md group-hover:block">
                <p className="font-medium">{formatDay(point.date)}</p>
                <p className="text-muted-foreground">
                  {formatNumber(point.total)} طلب · {formatNumber(point.converted)} محوّل
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="flex ps-8">
        {data.series.map((point, i) => (
          <span
            key={point.date}
            className="flex-1 overflow-visible text-center text-[10px] whitespace-nowrap text-muted-foreground"
          >
            {ticks.has(i) ? formatDay(point.date) : ''}
          </span>
        ))}
      </div>
    </div>
  );
}

/** Daily leads for the selected period, converted leads stacked at the bottom of each bar. */
export function LeadsChart({
  days,
  onDaysChange,
  className,
}: {
  days: ChartPeriod;
  onDaysChange: (days: ChartPeriod) => void;
  className?: string;
}) {
  const { data, error } = useApiQuery(`dashboard-leads-chart|${days}`, () =>
    dashboardApi.leadsChart(days),
  );
  const current = data?.days === days ? data : undefined;
  const rate =
    current && current.total > 0 ? Math.round((current.converted / current.total) * 100) : 0;

  return (
    <Section
      title="طلبات الاهتمام"
      description="عدد الطلبات اليومية، والجزء الداكن هو ما تم تحويله."
      actions={<PeriodSwitch value={days} onChange={onDaysChange} />}
      className={className}
    >
      {error && !data ? (
        <p className="text-sm text-destructive">{describeApiError(error)}</p>
      ) : !data ? (
        <Skeleton className="h-64 w-full" />
      ) : (
        <div className={cn('grid gap-4', !current && 'opacity-60 transition-opacity')}>
          <div className="flex flex-wrap items-end gap-x-8 gap-y-2">
            <div className="grid gap-0.5">
              <span className="text-xs text-muted-foreground">إجمالي الفترة</span>
              <span className="flex items-center gap-2">
                <span className="text-2xl font-bold tabular-nums">{formatNumber(data.total)}</span>
                <Trend current={data.total} previous={data.previousTotal} />
              </span>
            </div>
            <div className="grid gap-0.5">
              <span className="text-xs text-muted-foreground">تم تحويلها</span>
              <span className="text-2xl font-bold tabular-nums">
                {formatNumber(data.converted)}
              </span>
            </div>
            <div className="grid gap-0.5">
              <span className="text-xs text-muted-foreground">نسبة التحويل</span>
              <span className="text-2xl font-bold tabular-nums" dir="ltr">
                {formatNumber(rate)}%
              </span>
            </div>
            <div className="ms-auto flex items-center gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <span className="size-2.5 rounded-sm bg-primary/25" /> كل الطلبات
              </span>
              <span className="flex items-center gap-1.5">
                <span className="size-2.5 rounded-sm bg-primary" /> محوّلة
              </span>
            </div>
          </div>
          <Bars data={data} />
          {data.total === 0 && (
            <p className="text-center text-xs text-muted-foreground">
              لا توجد طلبات في هذه الفترة.
            </p>
          )}
        </div>
      )}
    </Section>
  );
}
