import {
  ArrowDown,
  ArrowUp,
  EyeOff,
  Eye,
  ExternalLink,
  FilterX,
  Handshake,
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
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/components/ui/toast-context';
import { partnersApi, type PartnerListQuery } from '@/features/partners/api';
import { LogoTile } from '@/features/partners/logo-tile';
import type { Partner } from '@/features/partners/types';
import { ApiError } from '@/lib/api-client';
import { formatDate, formatNumber } from '@/lib/format';
import { useDebouncedValue } from '@/lib/hooks';
import { describeApiError, useApiQuery } from '@/lib/use-api-query';

const PAGE_SIZE = 50;

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

function usePartnerStats() {
  return useApiQuery('partner-stats', async () => {
    const count = (query: PartnerListQuery) =>
      partnersApi.list({ ...query, pageSize: 1 }).then((res) => res.meta.total);
    const [total, visible, hidden] = await Promise.all([
      count({}),
      count({ visible: true }),
      count({ visible: false }),
    ]);
    return { total, visible, hidden };
  });
}

const hostOf = (url: string) => {
  try {
    return new URL(url).host.replace(/^www\./, '');
  } catch {
    return url;
  }
};

export default function PartnersPage() {
  const toast = useToast();
  const [params, setParams] = useSearchParams();
  const page = Math.max(1, Number(params.get('page')) || 1);
  const visibleParam = params.get('visible');
  const visible = visibleParam === 'true' ? true : visibleParam === 'false' ? false : undefined;
  const [search, setSearch] = useState(params.get('q') ?? '');
  const q = useDebouncedValue(search.trim());
  const [toDelete, setToDelete] = useState<Partner | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  const query: PartnerListQuery = { visible, q: q || undefined, page, pageSize: PAGE_SIZE };
  const { data, error, loading, reload } = useApiQuery(`partners|${JSON.stringify(query)}`, () =>
    partnersApi.list(query),
  );
  const stats = usePartnerStats();

  const hasFilters = params.has('q') || params.has('visible') || search !== '';
  /* Moving rows renumbers the page; with a filter the neighbours on screen are not the real ones. */
  const canReorder = !hasFilters;
  const items = data?.data ?? [];

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

  function failed(title: string, err: unknown) {
    toast({
      tone: 'error',
      title,
      description: err instanceof ApiError ? describeApiError(err) : undefined,
    });
  }

  async function move(index: number, step: -1 | 1) {
    const next = [...items];
    const [item] = next.splice(index, 1);
    next.splice(index + step, 0, item!);
    const offset = (page - 1) * PAGE_SIZE;
    setBusyId(item!.id);
    try {
      await partnersApi.reorder(next.map((p, i) => ({ id: p.id, order: offset + i })));
      reload();
    } catch (err) {
      failed('تعذّر تغيير الترتيب', err);
    } finally {
      setBusyId(null);
    }
  }

  async function toggleVisible(partner: Partner, value: boolean) {
    setBusyId(partner.id);
    try {
      await partnersApi.update(partner.id, { visible: value });
      toast({ title: value ? 'أصبح الشريك ظاهرًا في الموقع' : 'تم إخفاء الشريك من الموقع' });
      reload();
      stats.reload();
    } catch (err) {
      failed('تعذّر تحديث الظهور', err);
    } finally {
      setBusyId(null);
    }
  }

  async function confirmDelete() {
    if (!toDelete) return;
    setDeleting(true);
    try {
      await partnersApi.remove(toDelete.id);
      toast({ title: 'تم حذف الشريك', description: toDelete.nameAr });
      setToDelete(null);
      reload();
      stats.reload();
    } catch (err) {
      failed('تعذّر حذف الشريك', err);
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="grid gap-6">
      <PageHeader
        title="الشركاء"
        description="شعارات الشركاء المعروضة في شريط «شركاء النجاح» بالصفحة الرئيسية وصفحة الشركاء، بهذا الترتيب."
        actions={
          <Button asChild>
            <Link to="/partners/new">
              <Plus /> شريك جديد
            </Link>
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard icon={<Handshake />} label="إجمالي الشركاء" value={stats.data?.total} />
        <StatCard icon={<Eye />} label="ظاهرون في الموقع" value={stats.data?.visible} />
        <StatCard icon={<EyeOff />} label="مخفيون" value={stats.data?.hidden} />
      </div>

      <div className="overflow-hidden rounded-xl border bg-background shadow-xs">
        <div className="flex flex-wrap items-center gap-3 border-b p-3">
          <SearchInput
            value={search}
            onChange={(value) => {
              setSearch(value);
              setParam('q', value.trim() || undefined);
            }}
            placeholder="ابحث باسم الشريك…"
            className="min-w-56 flex-1"
          />
          <Select
            aria-label="الظهور"
            className="w-auto min-w-32"
            value={visible === undefined ? '' : String(visible)}
            onChange={(e) => setParam('visible', e.target.value || undefined)}
          >
            <option value="">الكل</option>
            <option value="true">الظاهرون فقط</option>
            <option value="false">المخفيون فقط</option>
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

        {hasFilters && items.length > 1 && (
          <p className="border-b bg-muted/40 px-4 py-2 text-xs text-muted-foreground">
            تغيير الترتيب متاح عند عرض كل الشركاء دون بحث أو فلترة.
          </p>
        )}
        {error && (
          <p className="border-b bg-destructive/5 p-3 text-sm text-destructive">
            {describeApiError(error)}
          </p>
        )}

        {!loading && items.length === 0 ? (
          <div className="p-6">
            <EmptyState
              icon={<Handshake />}
              title={hasFilters ? 'لا يوجد شركاء مطابقون' : 'لا يوجد شركاء بعد'}
              description={
                hasFilters
                  ? 'غيّر الفلاتر أو كلمة البحث.'
                  : 'أضف أول شريك ليظهر في الموقع بدل الشعارات الافتراضية.'
              }
              action={
                !hasFilters && (
                  <Button asChild>
                    <Link to="/partners/new">
                      <Plus /> شريك جديد
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
                  <th className="w-28 px-4 py-3 text-start font-medium">الترتيب</th>
                  <th className="px-4 py-3 text-start font-medium">الشريك</th>
                  <th className="px-4 py-3 text-start font-medium">الموقع الإلكتروني</th>
                  <th className="px-4 py-3 text-start font-medium">ظاهر في الموقع</th>
                  <th className="px-4 py-3 text-start font-medium">آخر تحديث</th>
                  <th className="px-4 py-3">
                    <span className="sr-only">إجراءات</span>
                  </th>
                </tr>
              </thead>
              <tbody className={loading ? 'opacity-60 transition-opacity' : undefined}>
                {loading && items.length === 0
                  ? Array.from({ length: 6 }, (_, i) => (
                      <tr key={i} className="border-t">
                        <td className="px-4 py-3" colSpan={6}>
                          <Skeleton className="h-10 w-full" />
                        </td>
                      </tr>
                    ))
                  : items.map((partner, index) => (
                      <tr
                        key={partner.id}
                        className="border-t transition-colors hover:bg-muted/30"
                        data-partner={partner.id}
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1">
                            <span className="w-8 text-muted-foreground tabular-nums">
                              {formatNumber(partner.order)}
                            </span>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-7"
                              aria-label="نقل لأعلى"
                              disabled={!canReorder || index === 0 || busyId !== null}
                              onClick={() => void move(index, -1)}
                            >
                              <ArrowUp />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-7"
                              aria-label="نقل لأسفل"
                              disabled={
                                !canReorder || index === items.length - 1 || busyId !== null
                              }
                              onClick={() => void move(index, 1)}
                            >
                              <ArrowDown />
                            </Button>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <Link
                            to={`/partners/${partner.id}`}
                            className="flex items-center gap-3 hover:underline-offset-2"
                          >
                            <LogoTile logo={partner.logo} className="h-11 w-20" />
                            <span className="grid gap-0.5">
                              <span className="font-semibold">{partner.nameAr}</span>
                              <span className="text-xs text-muted-foreground" dir="ltr">
                                {partner.nameEn}
                              </span>
                            </span>
                          </Link>
                        </td>
                        <td className="px-4 py-3">
                          {partner.websiteUrl ? (
                            <a
                              href={partner.websiteUrl}
                              target="_blank"
                              rel="noreferrer"
                              dir="ltr"
                              className="inline-flex items-center gap-1 text-primary hover:underline"
                            >
                              {hostOf(partner.websiteUrl)}
                              <ExternalLink className="size-3" />
                            </a>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <Switch
                            checked={partner.visible}
                            disabled={busyId !== null}
                            aria-label={`إظهار ${partner.nameAr} في الموقع`}
                            onCheckedChange={(value) => void toggleVisible(partner, value)}
                          />
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {formatDate(partner.updatedAt)}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex justify-end gap-1">
                            <Button asChild variant="ghost" size="icon" className="size-8">
                              <Link to={`/partners/${partner.id}`} aria-label="تعديل">
                                <Pencil />
                              </Link>
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-8 text-destructive hover:bg-destructive/10 hover:text-destructive"
                              aria-label="حذف"
                              onClick={() => setToDelete(partner)}
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

        {data && data.meta.total > PAGE_SIZE && (
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
        title="حذف الشريك؟"
        description={`سيُحذف «${toDelete?.nameAr ?? ''}» ويختفي شعاره من الموقع. يمكن استعادته من قاعدة البيانات فقط.`}
        onConfirm={() => void confirmDelete()}
      />
    </div>
  );
}
