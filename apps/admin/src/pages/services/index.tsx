import {
  BriefcaseBusiness,
  ExternalLink,
  Eye,
  FileClock,
  FilterX,
  ImageOff,
  Pencil,
  Plus,
  Trash2,
} from 'lucide-react';
import { type ReactNode, useState } from 'react';
import { Link, useSearchParams } from 'react-router';

import { EmptyState, PageHeader, Skeleton } from '@/components/layout/page-header';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Select } from '@/components/ui/form-controls';
import { Pagination } from '@/components/ui/pagination';
import { SearchInput } from '@/components/ui/search-input';
import { useToast } from '@/components/ui/toast-context';
import { PublishBadge } from '@/features/projects/project-badges';
import { servicesApi, type ServiceListQuery } from '@/features/services/api';
import {
  PUBLISH_STATUSES,
  publishMeta,
  type PublishStatus,
  type Service,
} from '@/features/services/types';
import { ApiError } from '@/lib/api-client';
import { env } from '@/lib/env';
import { formatDate, formatNumber } from '@/lib/format';
import { useDebouncedValue } from '@/lib/hooks';
import { mediaSrc } from '@/lib/media-url';
import { describeApiError, useApiQuery } from '@/lib/use-api-query';

const PAGE_SIZE = 20;

function StatCard({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: number | undefined;
}) {
  return (
    <div className="flex items-center gap-4 rounded-xl border bg-background p-4 shadow-xs">
      <span className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary [&_svg]:size-5">
        {icon}
      </span>
      <div className="grid gap-0.5">
        <span className="text-xs text-muted-foreground">{label}</span>
        {value === undefined ? (
          <Skeleton className="h-6 w-10" />
        ) : (
          <span className="text-xl font-bold tabular-nums">{formatNumber(value)}</span>
        )}
      </div>
    </div>
  );
}

function useServiceStats() {
  return useApiQuery('service-stats', async () => {
    const count = (query: ServiceListQuery) =>
      servicesApi.list({ ...query, pageSize: 1 }).then((res) => res.meta.total);
    const [total, published, drafts] = await Promise.all([
      count({}),
      count({ status: 'PUBLISHED' }),
      count({ status: 'DRAFT' }),
    ]);
    return { total, published, drafts };
  });
}

export default function ServicesPage() {
  const toast = useToast();
  const [params, setParams] = useSearchParams();
  const page = Math.max(1, Number(params.get('page')) || 1);
  const statusParam = params.get('status');
  const status = PUBLISH_STATUSES.includes(statusParam as PublishStatus)
    ? (statusParam as PublishStatus)
    : undefined;
  const [search, setSearch] = useState(params.get('q') ?? '');
  const q = useDebouncedValue(search.trim());
  const [toDelete, setToDelete] = useState<Service | null>(null);
  const [deleting, setDeleting] = useState(false);

  const query: ServiceListQuery = { status, q: q || undefined, page, pageSize: PAGE_SIZE };
  const { data, error, loading, reload } = useApiQuery(`services|${JSON.stringify(query)}`, () =>
    servicesApi.list(query),
  );
  const stats = useServiceStats();

  const hasFilters = params.has('q') || params.has('status') || search !== '';

  function setParam(key: string, value: string | undefined) {
    setParams(
      (current) => {
        const copy = new URLSearchParams(current);
        if (key !== 'page') copy.delete('page');
        if (value) copy.set(key, value);
        else copy.delete(key);
        return copy;
      },
      { replace: true },
    );
  }

  async function confirmDelete() {
    if (!toDelete) return;
    setDeleting(true);
    try {
      await servicesApi.remove(toDelete.id);
      toast({ title: 'تم حذف الخدمة', description: toDelete.titleAr });
      setToDelete(null);
      reload();
      stats.reload();
    } catch (err) {
      toast({
        tone: 'error',
        title: 'تعذّر حذف الخدمة',
        description: err instanceof ApiError ? describeApiError(err) : undefined,
      });
    } finally {
      setDeleting(false);
    }
  }

  const items = data?.data ?? [];

  return (
    <div className="grid gap-6">
      <PageHeader
        title="الخدمات"
        description="إدارة خدمات الشركة كما تظهر في صفحة الخدمات والصفحة الرئيسية وقوائم الموقع."
        actions={
          <Button asChild>
            <Link to="/services/new">
              <Plus /> خدمة جديدة
            </Link>
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard icon={<BriefcaseBusiness />} label="إجمالي الخدمات" value={stats.data?.total} />
        <StatCard icon={<Eye />} label="منشورة في الموقع" value={stats.data?.published} />
        <StatCard icon={<FileClock />} label="مسودات" value={stats.data?.drafts} />
      </div>

      <div className="overflow-hidden rounded-xl border bg-background shadow-xs">
        <div className="flex flex-wrap items-center gap-3 border-b p-3">
          <SearchInput
            value={search}
            onChange={(value) => {
              setSearch(value);
              setParam('q', value.trim() || undefined);
            }}
            placeholder="ابحث بالاسم أو الرابط المختصر…"
            className="min-w-56 flex-1"
          />
          <Select
            aria-label="حالة النشر"
            className="w-auto min-w-32"
            value={status ?? ''}
            onChange={(e) => setParam('status', e.target.value || undefined)}
          >
            <option value="">كل حالات النشر</option>
            {PUBLISH_STATUSES.map((value) => (
              <option key={value} value={value}>
                {publishMeta[value].label}
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
              icon={<BriefcaseBusiness />}
              title={hasFilters ? 'لا توجد خدمات مطابقة' : 'لا توجد خدمات بعد'}
              description={
                hasFilters
                  ? 'غيّر الفلاتر أو كلمة البحث.'
                  : 'أنشئ أول خدمة لتظهر في الموقع بدل المحتوى الافتراضي.'
              }
              action={
                !hasFilters && (
                  <Button asChild>
                    <Link to="/services/new">
                      <Plus /> خدمة جديدة
                    </Link>
                  </Button>
                )
              }
            />
          </div>
        ) : (
          <div className="relative overflow-x-auto">
            <table className="w-full min-w-[820px] text-sm">
              <thead className="bg-muted/50 text-xs text-muted-foreground">
                <tr>
                  <th className="w-16 px-4 py-3 text-start font-medium">الترتيب</th>
                  <th className="px-4 py-3 text-start font-medium">الخدمة</th>
                  <th className="px-4 py-3 text-start font-medium">النبذة</th>
                  <th className="px-4 py-3 text-start font-medium">النشر</th>
                  <th className="px-4 py-3 text-start font-medium">آخر تحديث</th>
                  <th className="px-4 py-3">
                    <span className="sr-only">إجراءات</span>
                  </th>
                </tr>
              </thead>
              <tbody className={loading ? 'opacity-60 transition-opacity' : undefined}>
                {loading && items.length === 0
                  ? Array.from({ length: 5 }, (_, i) => (
                      <tr key={i} className="border-t">
                        <td className="px-4 py-3" colSpan={6}>
                          <Skeleton className="h-10 w-full" />
                        </td>
                      </tr>
                    ))
                  : items.map((service) => (
                      <tr key={service.id} className="border-t transition-colors hover:bg-muted/30">
                        <td className="px-4 py-3 text-muted-foreground tabular-nums">
                          {formatNumber(service.order)}
                        </td>
                        <td className="px-4 py-3">
                          <Link
                            to={`/services/${service.id}`}
                            className="flex items-center gap-3 hover:underline-offset-2"
                          >
                            <span className="flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-lg border bg-muted">
                              {service.image ? (
                                <img
                                  src={mediaSrc(service.image.url)}
                                  alt=""
                                  className="size-full object-cover"
                                />
                              ) : (
                                <ImageOff className="size-4 text-muted-foreground" />
                              )}
                            </span>
                            <span className="grid gap-0.5">
                              <span className="font-semibold">{service.titleAr}</span>
                              <span className="text-xs text-muted-foreground" dir="ltr">
                                /{service.slug}
                              </span>
                            </span>
                          </Link>
                        </td>
                        <td className="max-w-80 px-4 py-3 text-muted-foreground">
                          <span className="line-clamp-2">{service.summaryAr ?? '—'}</span>
                        </td>
                        <td className="px-4 py-3">
                          <PublishBadge status={service.status} />
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {formatDate(service.updatedAt)}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex justify-end gap-1">
                            <Button asChild variant="ghost" size="icon" className="size-8">
                              <Link to={`/services/${service.id}`} aria-label="تعديل">
                                <Pencil />
                              </Link>
                            </Button>
                            {service.status === 'PUBLISHED' && (
                              <Button asChild variant="ghost" size="icon" className="size-8">
                                <a
                                  href={`${env.siteUrl}/ar/services/${service.slug}`}
                                  target="_blank"
                                  rel="noreferrer"
                                  aria-label="عرض في الموقع"
                                >
                                  <ExternalLink />
                                </a>
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-8 text-destructive hover:bg-destructive/10 hover:text-destructive"
                              aria-label="حذف"
                              onClick={() => setToDelete(service)}
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

      <ConfirmDialog
        open={toDelete !== null}
        onOpenChange={(open) => !open && setToDelete(null)}
        busy={deleting}
        title="حذف الخدمة؟"
        description={`ستُحذف «${toDelete?.titleAr ?? ''}» وتختفي من الموقع. يمكن استعادتها من قاعدة البيانات فقط.`}
        onConfirm={() => void confirmDelete()}
      />
    </div>
  );
}
