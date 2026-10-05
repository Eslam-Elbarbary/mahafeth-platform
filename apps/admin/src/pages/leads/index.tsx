import {
  CalendarClock,
  CircleCheck,
  FilterX,
  Inbox,
  PhoneCall,
  Sparkles,
  Trash2,
} from 'lucide-react';
import { useState } from 'react';
import { useSearchParams } from 'react-router';

import { EmptyState, PageHeader, Skeleton } from '@/components/layout/page-header';
import { StatCard } from '@/components/layout/stat-card';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Select } from '@/components/ui/form-controls';
import { Pagination } from '@/components/ui/pagination';
import { SearchInput } from '@/components/ui/search-input';
import { useToast } from '@/components/ui/toast-context';
import { leadsApi, type LeadListQuery } from '@/features/leads/api';
import { LeadStatusBadge } from '@/features/leads/lead-badges';
import { LeadDrawer } from '@/features/leads/lead-drawer';
import {
  LEAD_SOURCES,
  LEAD_STATUSES,
  leadInterestLabels,
  leadSourceLabels,
  leadStatusMeta,
  type Lead,
  type LeadSource,
  type LeadStatus,
} from '@/features/leads/types';
import { projectsApi } from '@/features/projects/api';
import { cityLabel } from '@/features/projects/types';
import { ApiError } from '@/lib/api-client';
import { formatDateTime, formatNumber } from '@/lib/format';
import { useDebouncedValue } from '@/lib/hooks';
import { describeApiError, useApiQuery } from '@/lib/use-api-query';
import { cn } from '@/lib/utils';

const PAGE_SIZE = 20;
const FILTER_KEYS = ['q', 'status', 'source', 'project'] as const;

function readFilters(params: URLSearchParams): LeadListQuery {
  const status = params.get('status');
  const source = params.get('source');
  return {
    status: LEAD_STATUSES.includes(status as LeadStatus) ? (status as LeadStatus) : undefined,
    source: LEAD_SOURCES.includes(source as LeadSource) ? (source as LeadSource) : undefined,
    projectId: params.get('project') ?? undefined,
  };
}

function StatusFilter({
  value,
  counts,
  total,
  onChange,
}: {
  value: LeadStatus | undefined;
  counts: Record<LeadStatus, number> | undefined;
  total: number | undefined;
  onChange: (status: LeadStatus | undefined) => void;
}) {
  const options: Array<{ key: LeadStatus | undefined; label: string; count?: number }> = [
    { key: undefined, label: 'الكل', count: total },
    ...LEAD_STATUSES.map((status) => ({
      key: status,
      label: leadStatusMeta[status].label,
      count: counts?.[status],
    })),
  ];
  return (
    <div role="group" aria-label="فلترة حسب الحالة" className="flex flex-wrap gap-1.5 border-b p-3">
      {options.map((option) => {
        const active = value === option.key;
        return (
          <button
            key={option.key ?? 'all'}
            type="button"
            aria-pressed={active}
            data-status={option.key ?? 'ALL'}
            onClick={() => onChange(option.key)}
            className={cn(
              'inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-colors',
              active
                ? 'border-primary bg-primary text-primary-foreground'
                : 'bg-background text-muted-foreground hover:bg-accent hover:text-foreground',
            )}
          >
            {option.label}
            {option.count !== undefined && (
              <span
                className={cn(
                  'rounded-full px-1.5 tabular-nums',
                  active ? 'bg-primary-foreground/20' : 'bg-muted',
                )}
              >
                {formatNumber(option.count)}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

export default function LeadsPage() {
  const toast = useToast();
  const [params, setParams] = useSearchParams();
  const page = Math.max(1, Number(params.get('page')) || 1);
  const filters = readFilters(params);
  const openId = params.get('lead');
  const [search, setSearch] = useState(params.get('q') ?? '');
  const q = useDebouncedValue(search.trim());
  const [toDelete, setToDelete] = useState<Lead | null>(null);
  const [deleting, setDeleting] = useState(false);

  const query: LeadListQuery = { ...filters, q: q || undefined, page, pageSize: PAGE_SIZE };
  const { data, error, loading, reload, mutate } = useApiQuery(
    `leads|${JSON.stringify(query)}`,
    () => leadsApi.list(query),
  );
  const stats = useApiQuery('lead-stats', () => leadsApi.stats());
  const projects = useApiQuery('lead-projects', () => projectsApi.list({ pageSize: 100 }));

  const hasFilters = FILTER_KEYS.some((key) => params.has(key)) || search !== '';

  function setParam(key: string, value: string | undefined) {
    setParams(
      (current) => {
        const copy = new URLSearchParams(current);
        if (key !== 'page' && key !== 'lead') copy.delete('page');
        if (value) copy.set(key, value);
        else copy.delete(key);
        return copy;
      },
      { replace: true },
    );
  }

  function refresh() {
    reload();
    stats.reload();
  }

  async function confirmDelete() {
    if (!toDelete) return;
    setDeleting(true);
    try {
      await leadsApi.remove(toDelete.id);
      toast({ title: 'تم حذف الطلب', description: toDelete.name });
      setToDelete(null);
      refresh();
    } catch (err) {
      toast({
        tone: 'error',
        title: 'تعذّر حذف الطلب',
        description: err instanceof ApiError ? describeApiError(err) : undefined,
      });
    } finally {
      setDeleting(false);
    }
  }

  const items = data?.data ?? [];
  const byStatus = stats.data?.byStatus;

  return (
    <div className="grid gap-6">
      <PageHeader
        title="طلبات الاهتمام"
        description="الطلبات الواردة من نموذج الاهتمام في الموقع ومتابعتها حتى التحويل."
        actions={
          stats.data && (
            <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <CalendarClock className="size-4" />
              {formatNumber(stats.data.recent)} طلبًا خلال آخر 7 أيام
            </span>
          )
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={<Inbox />} label="إجمالي الطلبات" value={stats.data?.total} />
        <StatCard icon={<Sparkles />} label="طلبات جديدة" value={byStatus?.NEW} />
        <StatCard
          icon={<PhoneCall />}
          label="قيد المتابعة"
          value={byStatus && byStatus.CONTACTED + byStatus.QUALIFIED}
        />
        <StatCard icon={<CircleCheck />} label="تم تحويلها" value={byStatus?.CONVERTED} />
      </div>

      <div className="overflow-hidden rounded-xl border bg-background shadow-xs">
        <StatusFilter
          value={filters.status}
          counts={byStatus}
          total={stats.data?.total}
          onChange={(status) => setParam('status', status)}
        />
        <div className="flex flex-wrap items-center gap-3 border-b p-3">
          <SearchInput
            value={search}
            onChange={(value) => {
              setSearch(value);
              setParam('q', value.trim() || undefined);
            }}
            placeholder="ابحث بالاسم أو الجوال أو البريد…"
            className="min-w-56 flex-1"
          />
          <Select
            aria-label="المشروع"
            className="w-auto min-w-40"
            value={filters.projectId ?? ''}
            onChange={(e) => setParam('project', e.target.value || undefined)}
          >
            <option value="">كل المشاريع</option>
            {projects.data?.data.map((project) => (
              <option key={project.id} value={project.id}>
                {project.titleAr}
              </option>
            ))}
          </Select>
          <Select
            aria-label="المصدر"
            className="w-auto min-w-32"
            value={filters.source ?? ''}
            onChange={(e) => setParam('source', e.target.value || undefined)}
          >
            <option value="">كل المصادر</option>
            {LEAD_SOURCES.map((source) => (
              <option key={source} value={source}>
                {leadSourceLabels[source]}
              </option>
            ))}
          </Select>
          {hasFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSearch('');
                setParams({}, { replace: true });
              }}
            >
              <FilterX /> مسح الفلاتر
            </Button>
          )}
        </div>

        {error && (
          <p className="border-b bg-destructive/5 p-3 text-sm text-destructive">
            {describeApiError(error)}
          </p>
        )}

        {!loading && items.length === 0 ? (
          <div className="p-6">
            <EmptyState
              icon={<Inbox />}
              title={hasFilters ? 'لا توجد طلبات مطابقة' : 'لا توجد طلبات بعد'}
              description={
                hasFilters
                  ? 'غيّر الفلاتر أو كلمة البحث.'
                  : 'ستظهر هنا الطلبات المرسلة من نموذج الاهتمام في الموقع.'
              }
            />
          </div>
        ) : (
          <div className="relative overflow-x-auto">
            <table className="w-full min-w-[960px] text-sm">
              <thead className="bg-muted/50 text-xs text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 text-start font-medium">العميل</th>
                  <th className="px-4 py-3 text-start font-medium">المدينة</th>
                  <th className="px-4 py-3 text-start font-medium">الاهتمام</th>
                  <th className="px-4 py-3 text-start font-medium">المشروع</th>
                  <th className="px-4 py-3 text-start font-medium">المصدر</th>
                  <th className="px-4 py-3 text-start font-medium">الحالة</th>
                  <th className="px-4 py-3 text-start font-medium">التاريخ</th>
                  <th className="px-4 py-3">
                    <span className="sr-only">إجراءات</span>
                  </th>
                </tr>
              </thead>
              <tbody className={loading ? 'opacity-60 transition-opacity' : undefined}>
                {loading && items.length === 0
                  ? Array.from({ length: 5 }, (_, i) => (
                      <tr key={i} className="border-t">
                        <td className="px-4 py-3" colSpan={8}>
                          <Skeleton className="h-10 w-full" />
                        </td>
                      </tr>
                    ))
                  : items.map((lead) => (
                      <tr
                        key={lead.id}
                        data-lead-id={lead.id}
                        className={cn(
                          'cursor-pointer border-t transition-colors hover:bg-muted/30',
                          openId === lead.id && 'bg-muted/40',
                        )}
                        onClick={() => setParam('lead', lead.id)}
                      >
                        <td className="px-4 py-3">
                          <button
                            type="button"
                            className="grid gap-0.5 text-start"
                            onClick={(e) => {
                              e.stopPropagation();
                              setParam('lead', lead.id);
                            }}
                          >
                            <span className="font-semibold">{lead.name}</span>
                            <span className="text-xs text-muted-foreground" dir="ltr">
                              {lead.phone}
                            </span>
                          </button>
                        </td>
                        <td className="px-4 py-3">{lead.city ? cityLabel(lead.city) : '—'}</td>
                        <td className="px-4 py-3">
                          {lead.interestType ? leadInterestLabels[lead.interestType] : '—'}
                        </td>
                        <td className="px-4 py-3">{lead.project?.titleAr ?? '—'}</td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {leadSourceLabels[lead.source]}
                        </td>
                        <td className="px-4 py-3">
                          <LeadStatusBadge status={lead.status} />
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-muted-foreground">
                          {formatDateTime(lead.createdAt)}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex justify-end">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-8 text-destructive hover:bg-destructive/10 hover:text-destructive"
                              aria-label="حذف"
                              onClick={(e) => {
                                e.stopPropagation();
                                setToDelete(lead);
                              }}
                            >
                              <Trash2 />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
              </tbody>
            </table>
          </div>
        )}

        {data && data.meta.total > 0 && (
          <div className="border-t p-3">
            <Pagination
              page={page}
              pageSize={PAGE_SIZE}
              total={data.meta.total}
              onPageChange={(next) => setParam('page', next > 1 ? String(next) : undefined)}
            />
          </div>
        )}
      </div>

      <LeadDrawer
        leadId={openId}
        onClose={() => setParam('lead', undefined)}
        onUpdated={(updated) => {
          mutate((current) => ({
            ...current,
            data: current.data.map((lead) => (lead.id === updated.id ? updated : lead)),
          }));
          stats.reload();
        }}
        onDeleted={() => {
          setParam('lead', undefined);
          refresh();
        }}
      />

      <ConfirmDialog
        open={toDelete !== null}
        onOpenChange={(open) => !open && setToDelete(null)}
        busy={deleting}
        title="حذف الطلب؟"
        description={`سيُحذف طلب «${toDelete?.name ?? ''}» من القائمة. يمكن استعادته من قاعدة البيانات فقط.`}
        onConfirm={() => void confirmDelete()}
      />
    </div>
  );
}
