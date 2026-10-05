import { ImageOff, RefreshCw, UploadCloud } from 'lucide-react';
import { useState } from 'react';
import { useSearchParams } from 'react-router';

import { EmptyState, PageHeader } from '@/components/layout/page-header';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Pagination } from '@/components/ui/pagination';
import { SearchInput } from '@/components/ui/search-input';
import { mediaApi } from '@/features/media/api';
import { MediaDetailsDialog } from '@/features/media/media-details-dialog';
import { MediaGrid } from '@/features/media/media-grid';
import { MediaUploader } from '@/features/media/media-uploader';
import type { MediaItem } from '@/features/media/types';
import { formatNumber } from '@/lib/format';
import { useDebouncedValue } from '@/lib/hooks';
import { describeApiError, useApiQuery } from '@/lib/use-api-query';

const PAGE_SIZE = 30;

export default function MediaLibraryPage() {
  const [params, setParams] = useSearchParams();
  const page = Math.max(1, Number(params.get('page')) || 1);
  const [search, setSearch] = useState(params.get('q') ?? '');
  const q = useDebouncedValue(search.trim());
  const [uploadOpen, setUploadOpen] = useState(false);
  const [active, setActive] = useState<MediaItem | null>(null);

  const { data, error, loading, reload, mutate } = useApiQuery(`media|${q}|${page}`, () =>
    mediaApi.list({ q: q || undefined, page, pageSize: PAGE_SIZE }),
  );

  const setPage = (next: number) =>
    setParams(
      (current) => {
        const copy = new URLSearchParams(current);
        if (next > 1) copy.set('page', String(next));
        else copy.delete('page');
        return copy;
      },
      { replace: true },
    );

  function onSearch(value: string) {
    setSearch(value);
    setParams(
      (current) => {
        const copy = new URLSearchParams(current);
        copy.delete('page');
        if (value.trim()) copy.set('q', value.trim());
        else copy.delete('q');
        return copy;
      },
      { replace: true },
    );
  }

  const items = data?.data ?? [];

  return (
    <div className="grid gap-6">
      <PageHeader
        title="مكتبة الوسائط"
        description={
          data
            ? `${formatNumber(data.meta.total)} صورة متاحة للاستخدام في المشاريع وأقسام الموقع.`
            : 'جميع الصور المرفوعة والمتاحة للاستخدام في الموقع.'
        }
        actions={
          <Button onClick={() => setUploadOpen(true)}>
            <UploadCloud /> رفع صور
          </Button>
        }
      />

      <div className="flex flex-wrap items-center gap-3 rounded-xl border bg-background p-3 shadow-xs">
        <SearchInput
          value={search}
          onChange={onSearch}
          placeholder="ابحث باسم الملف أو النص البديل…"
          className="min-w-64 flex-1"
        />
        <Button variant="outline" size="icon" onClick={reload} aria-label="تحديث">
          <RefreshCw className={loading ? 'animate-spin' : undefined} />
        </Button>
      </div>

      {error && (
        <p className="rounded-md border border-destructive/40 bg-destructive/5 p-3 text-sm text-destructive">
          {describeApiError(error)}
        </p>
      )}

      {!loading && items.length === 0 && !error ? (
        <EmptyState
          icon={<ImageOff />}
          title={q ? 'لا توجد نتائج مطابقة' : 'لا توجد صور بعد'}
          description={
            q ? 'جرّب كلمة بحث أخرى.' : 'ابدأ برفع صور المشاريع لتتمكن من استخدامها في الموقع.'
          }
          action={
            !q && (
              <Button onClick={() => setUploadOpen(true)}>
                <UploadCloud /> رفع صور
              </Button>
            )
          }
        />
      ) : (
        <MediaGrid items={items} loading={loading} onItemClick={setActive} />
      )}

      {data && data.meta.total > 0 && (
        <Pagination
          page={page}
          pageSize={PAGE_SIZE}
          total={data.meta.total}
          onPageChange={setPage}
        />
      )}

      <Dialog open={uploadOpen} onOpenChange={setUploadOpen}>
        <DialogContent size="lg">
          <DialogHeader>
            <DialogTitle>رفع صور جديدة</DialogTitle>
            <DialogDescription>تُضاف الصور إلى المكتبة فور اكتمال رفعها.</DialogDescription>
          </DialogHeader>
          <MediaUploader
            onUploaded={() => {
              if (page !== 1) setPage(1);
              reload();
            }}
          />
        </DialogContent>
      </Dialog>

      <MediaDetailsDialog
        item={active}
        onOpenChange={(open) => !open && setActive(null)}
        onUpdated={(updated) => {
          setActive(updated);
          mutate((list) => ({
            ...list,
            data: list.data.map((item) => (item.id === updated.id ? updated : item)),
          }));
        }}
        onDeleted={() => {
          setActive(null);
          reload();
        }}
      />
    </div>
  );
}
