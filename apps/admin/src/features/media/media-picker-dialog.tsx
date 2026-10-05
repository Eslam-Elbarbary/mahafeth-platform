import { ImageOff, Images, UploadCloud } from 'lucide-react';
import { useState } from 'react';

import { EmptyState } from '@/components/layout/page-header';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Pagination } from '@/components/ui/pagination';
import { SearchInput } from '@/components/ui/search-input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { formatNumber } from '@/lib/format';
import { useDebouncedValue } from '@/lib/hooks';
import { describeApiError, useApiQuery } from '@/lib/use-api-query';

import { mediaApi } from './api';
import { MediaGrid } from './media-grid';
import { MediaUploader } from './media-uploader';
import type { MediaItem } from './types';

const PAGE_SIZE = 20;

type PickerProps = {
  multiple: boolean;
  confirmLabel: string;
  excludeIds?: ReadonlySet<string>;
  onConfirm: (items: MediaItem[]) => void;
  onCancel: () => void;
};

function PickerBody({ multiple, confirmLabel, excludeIds, onConfirm, onCancel }: PickerProps) {
  const [tab, setTab] = useState('library');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<Map<string, MediaItem>>(new Map());
  const q = useDebouncedValue(search.trim());

  const { data, error, loading, reload } = useApiQuery(`media|${q}|${page}`, () =>
    mediaApi.list({ q: q || undefined, page, pageSize: PAGE_SIZE }),
  );
  const items = (data?.data ?? []).filter((item) => !excludeIds?.has(item.id));

  function toggle(item: MediaItem) {
    setSelected((current) => {
      const next = new Map(multiple ? current : []);
      if (current.has(item.id)) next.delete(item.id);
      else next.set(item.id, item);
      return next;
    });
  }

  function onUploaded(uploaded: MediaItem[]) {
    setSelected((current) => {
      const next = new Map(multiple ? current : []);
      for (const item of multiple ? uploaded : uploaded.slice(-1)) next.set(item.id, item);
      return next;
    });
    setSearch('');
    setPage(1);
    reload();
    setTab('library');
  }

  return (
    <>
      <Tabs value={tab} onValueChange={setTab} className="grid gap-4">
        <TabsList>
          <TabsTrigger value="library">
            <Images /> مكتبة الوسائط
          </TabsTrigger>
          <TabsTrigger value="upload">
            <UploadCloud /> رفع صور جديدة
          </TabsTrigger>
        </TabsList>

        <TabsContent value="library" className="grid gap-4">
          <SearchInput
            value={search}
            onChange={(value) => {
              setSearch(value);
              setPage(1);
            }}
            placeholder="ابحث باسم الملف أو النص البديل…"
          />
          {error && <p className="text-sm text-destructive">{describeApiError(error)}</p>}
          <div className="min-h-64">
            {!loading && items.length === 0 ? (
              <EmptyState
                icon={<ImageOff />}
                title={q ? 'لا توجد نتائج مطابقة' : 'المكتبة فارغة'}
                description={q ? 'جرّب كلمة بحث أخرى.' : 'ارفع صورًا من تبويب «رفع صور جديدة».'}
              />
            ) : (
              <MediaGrid
                items={items}
                loading={loading}
                selectedIds={new Set(selected.keys())}
                onItemClick={toggle}
                columns="compact"
              />
            )}
          </div>
          {data && (
            <Pagination
              page={page}
              pageSize={PAGE_SIZE}
              total={data.meta.total}
              onPageChange={setPage}
            />
          )}
        </TabsContent>

        <TabsContent value="upload">
          <MediaUploader onUploaded={onUploaded} />
        </TabsContent>
      </Tabs>

      <DialogFooter className="items-center border-t pt-4 sm:justify-between">
        <p className="text-sm text-muted-foreground">
          {selected.size > 0
            ? `تم تحديد ${formatNumber(selected.size)} ${selected.size === 1 ? 'صورة' : 'صور'}`
            : multiple
              ? 'اختر صورة أو أكثر'
              : 'اختر صورة واحدة'}
        </p>
        <div className="flex gap-2">
          <Button variant="outline" onClick={onCancel}>
            إلغاء
          </Button>
          <Button disabled={selected.size === 0} onClick={() => onConfirm([...selected.values()])}>
            {confirmLabel}
          </Button>
        </div>
      </DialogFooter>
    </>
  );
}

/** Choose (or upload, then choose) images from the media library — used by every CMS module. */
export function MediaPickerDialog({
  open,
  onOpenChange,
  title = 'اختيار من مكتبة الوسائط',
  description,
  multiple = false,
  confirmLabel = 'إضافة',
  excludeIds,
  onSelect,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  description?: string;
  multiple?: boolean;
  confirmLabel?: string;
  excludeIds?: ReadonlySet<string>;
  onSelect: (items: MediaItem[]) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="xl">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>
        {open && (
          <PickerBody
            multiple={multiple}
            confirmLabel={confirmLabel}
            excludeIds={excludeIds}
            onCancel={() => onOpenChange(false)}
            onConfirm={(items) => {
              onSelect(items);
              onOpenChange(false);
            }}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
