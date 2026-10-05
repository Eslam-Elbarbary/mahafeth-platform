import {
  Building2,
  ExternalLink,
  FileClock,
  FilterX,
  ImageOff,
  Pencil,
  Plus,
  Star,
  Trash2,
  Eye,
} from 'lucide-react';
import { useState } from 'react';
import { Link, useSearchParams } from 'react-router';

import { EmptyState, PageHeader, Skeleton } from '@/components/layout/page-header';
import { StatCard } from '@/components/layout/stat-card';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Select } from '@/components/ui/form-controls';
import { Pagination } from '@/components/ui/pagination';
import { SearchInput } from '@/components/ui/search-input';
import { useToast } from '@/components/ui/toast-context';
import { projectsApi, type ProjectListQuery } from '@/features/projects/api';
import {
  FeaturedBadge,
  ProjectStatusBadge,
  PublishBadge,
} from '@/features/projects/project-badges';
import {
  cityLabel,
  KNOWN_CITIES,
  PROJECT_STATUSES,
  PUBLISH_STATUSES,
  publishMeta,
  statusMeta,
  type ProjectListItem,
  type ProjectStatus,
  type PublishStatus,
} from '@/features/projects/types';
import { ApiError } from '@/lib/api-client';
import { env } from '@/lib/env';
import { formatDate, formatNumber } from '@/lib/format';
import { useDebouncedValue } from '@/lib/hooks';
import { mediaSrc } from '@/lib/media-url';
import { describeApiError, useApiQuery } from '@/lib/use-api-query';

const PAGE_SIZE = 20;
const FILTER_KEYS = ['q', 'city', 'status', 'publish', 'featured'] as const;

function readFilters(params: URLSearchParams): ProjectListQuery {
  const status = params.get('status');
  const publish = params.get('publish');
  const featured = params.get('featured');
  return {
    city: params.get('city') ?? undefined,
    status: PROJECT_STATUSES.includes(status as ProjectStatus)
      ? (status as ProjectStatus)
      : undefined,
    publishStatus: PUBLISH_STATUSES.includes(publish as PublishStatus)
      ? (publish as PublishStatus)
      : undefined,
    featured: featured === 'true' ? true : featured === 'false' ? false : undefined,
  };
}

function cover(project: ProjectListItem) {
  return project.coverImage ?? project.gallery?.[0]?.media ?? null;
}

function useProjectStats() {
  return useApiQuery('project-stats', async () => {
    const count = (query: ProjectListQuery) =>
      projectsApi.list({ ...query, pageSize: 1 }).then((res) => res.meta.total);
    const [total, published, drafts, featured] = await Promise.all([
      count({}),
      count({ publishStatus: 'PUBLISHED' }),
      count({ publishStatus: 'DRAFT' }),
      count({ featured: true }),
    ]);
    return { total, published, drafts, featured };
  });
}

export default function ProjectsPage() {
  const toast = useToast();
  const [params, setParams] = useSearchParams();
  const page = Math.max(1, Number(params.get('page')) || 1);
  const filters = readFilters(params);
  const [search, setSearch] = useState(params.get('q') ?? '');
  const q = useDebouncedValue(search.trim());
  const [toDelete, setToDelete] = useState<ProjectListItem | null>(null);
  const [deleting, setDeleting] = useState(false);

  const query: ProjectListQuery = { ...filters, q: q || undefined, page, pageSize: PAGE_SIZE };
  const { data, error, loading, reload } = useApiQuery(`projects|${JSON.stringify(query)}`, () =>
    projectsApi.list(query),
  );
  const stats = useProjectStats();

  const hasFilters = FILTER_KEYS.some((key) => params.has(key)) || search !== '';

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
      await projectsApi.remove(toDelete.id);
      toast({ title: 'تم حذف المشروع', description: toDelete.titleAr });
      setToDelete(null);
      reload();
      stats.reload();
    } catch (err) {
      toast({
        tone: 'error',
        title: 'تعذّر حذف المشروع',
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
        title="المشاريع"
        description="إدارة سجل المشاريع وتفاصيلها وصورها كما تظهر في الموقع."
        actions={
          <Button asChild>
            <Link to="/projects/new">
              <Plus /> مشروع جديد
            </Link>
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={<Building2 />} label="إجمالي المشاريع" value={stats.data?.total} />
        <StatCard icon={<Eye />} label="منشورة في الموقع" value={stats.data?.published} />
        <StatCard icon={<FileClock />} label="مسودات" value={stats.data?.drafts} />
        <StatCard icon={<Star />} label="مشاريع مميزة" value={stats.data?.featured} />
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
            aria-label="المدينة"
            className="w-auto min-w-32"
            value={filters.city ?? ''}
            onChange={(e) => setParam('city', e.target.value || undefined)}
          >
            <option value="">كل المدن</option>
            {KNOWN_CITIES.map((city) => (
              <option key={city.key} value={city.key}>
                {city.label}
              </option>
            ))}
          </Select>
          <Select
            aria-label="حالة المشروع"
            className="w-auto min-w-36"
            value={filters.status ?? ''}
            onChange={(e) => setParam('status', e.target.value || undefined)}
          >
            <option value="">كل الحالات</option>
            {PROJECT_STATUSES.map((status) => (
              <option key={status} value={status}>
                {statusMeta[status].label}
              </option>
            ))}
          </Select>
          <Select
            aria-label="حالة النشر"
            className="w-auto min-w-32"
            value={filters.publishStatus ?? ''}
            onChange={(e) => setParam('publish', e.target.value || undefined)}
          >
            <option value="">كل حالات النشر</option>
            {PUBLISH_STATUSES.map((status) => (
              <option key={status} value={status}>
                {publishMeta[status].label}
              </option>
            ))}
          </Select>
          <Select
            aria-label="التمييز"
            className="w-auto min-w-32"
            value={filters.featured === undefined ? '' : String(filters.featured)}
            onChange={(e) => setParam('featured', e.target.value || undefined)}
          >
            <option value="">المميزة وغيرها</option>
            <option value="true">المميزة فقط</option>
            <option value="false">غير المميزة</option>
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
              icon={<Building2 />}
              title={hasFilters ? 'لا توجد مشاريع مطابقة' : 'لا توجد مشاريع بعد'}
              description={
                hasFilters ? 'غيّر الفلاتر أو كلمة البحث.' : 'أنشئ أول مشروع ليظهر في الموقع.'
              }
              action={
                !hasFilters && (
                  <Button asChild>
                    <Link to="/projects/new">
                      <Plus /> مشروع جديد
                    </Link>
                  </Button>
                )
              }
            />
          </div>
        ) : (
          <div className="relative overflow-x-auto">
            <table className="w-full min-w-[960px] text-sm">
              <thead className="bg-muted/50 text-xs text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 text-start font-medium">المشروع</th>
                  <th className="px-4 py-3 text-start font-medium">المدينة</th>
                  <th className="px-4 py-3 text-start font-medium">حالة المشروع</th>
                  <th className="px-4 py-3 text-start font-medium">النشر</th>
                  <th className="px-4 py-3 text-start font-medium">الوحدات</th>
                  <th className="px-4 py-3 text-start font-medium">التسليم</th>
                  <th className="px-4 py-3 text-start font-medium">الصور</th>
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
                        <td className="px-4 py-3" colSpan={9}>
                          <Skeleton className="h-10 w-full" />
                        </td>
                      </tr>
                    ))
                  : items.map((project) => {
                      const image = cover(project);
                      return (
                        <tr
                          key={project.id}
                          className="border-t transition-colors hover:bg-muted/30"
                        >
                          <td className="px-4 py-3">
                            <Link
                              to={`/projects/${project.id}`}
                              className="flex items-center gap-3 hover:underline-offset-2"
                            >
                              <span className="flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-lg border bg-muted">
                                {image ? (
                                  <img
                                    src={mediaSrc(image.url)}
                                    alt=""
                                    className="size-full object-cover"
                                  />
                                ) : (
                                  <ImageOff className="size-4 text-muted-foreground" />
                                )}
                              </span>
                              <span className="grid gap-0.5">
                                <span className="flex items-center gap-2 font-semibold">
                                  {project.titleAr}
                                  {project.featured && <FeaturedBadge />}
                                </span>
                                <span className="text-xs text-muted-foreground" dir="ltr">
                                  /{project.slug}
                                </span>
                              </span>
                            </Link>
                          </td>
                          <td className="px-4 py-3">{cityLabel(project.city)}</td>
                          <td className="px-4 py-3">
                            <ProjectStatusBadge status={project.status} />
                          </td>
                          <td className="px-4 py-3">
                            <PublishBadge status={project.publishStatus} />
                          </td>
                          <td className="px-4 py-3 tabular-nums">
                            {project.unitsCount === null ? '—' : formatNumber(project.unitsCount)}
                          </td>
                          <td className="px-4 py-3 tabular-nums">
                            {project.completionYear ?? '—'}
                          </td>
                          <td className="px-4 py-3 tabular-nums">
                            {formatNumber(project._count.gallery)}
                          </td>
                          <td className="px-4 py-3 text-muted-foreground">
                            {formatDate(project.updatedAt)}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex justify-end gap-1">
                              <Button asChild variant="ghost" size="icon" className="size-8">
                                <Link to={`/projects/${project.id}`} aria-label="تعديل">
                                  <Pencil />
                                </Link>
                              </Button>
                              {project.publishStatus === 'PUBLISHED' && (
                                <Button asChild variant="ghost" size="icon" className="size-8">
                                  <a
                                    href={`${env.siteUrl}/ar/projects/${project.slug}`}
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
                                onClick={() => setToDelete(project)}
                              >
                                <Trash2 />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
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
        title="حذف المشروع؟"
        description={`سيُحذف «${toDelete?.titleAr ?? ''}» ويختفي من الموقع. يمكن استعادته من قاعدة البيانات فقط.`}
        onConfirm={() => void confirmDelete()}
      />
    </div>
  );
}
