import { CircleAlert, CircleCheck, LoaderCircle, UploadCloud } from 'lucide-react';
import { type DragEvent, useId, useState } from 'react';

import { mediaSrc, readImageSize } from '@/lib/media-url';
import { describeApiError } from '@/lib/use-api-query';
import { ApiError } from '@/lib/api-client';
import { cn } from '@/lib/utils';

import { mediaApi } from './api';
import { ACCEPTED_IMAGE_TYPES, MAX_UPLOAD_MB, type MediaItem } from './types';

type UploadRow = {
  key: string;
  name: string;
  preview: string;
  state: 'uploading' | 'done' | 'error';
  message?: string;
};

function rejectReason(file: File) {
  if (!ACCEPTED_IMAGE_TYPES.includes(file.type))
    return 'نوع الملف غير مدعوم (JPG أو PNG أو WEBP أو AVIF أو GIF).';
  if (file.size > MAX_UPLOAD_MB * 1024 * 1024)
    return `الحد الأقصى لحجم الصورة ${MAX_UPLOAD_MB} م.ب.`;
  return null;
}

/** Drag-and-drop / browse uploader; every image is measured so the site can size it correctly. */
export function MediaUploader({
  onUploaded,
  compact = false,
}: {
  onUploaded: (items: MediaItem[]) => void;
  compact?: boolean;
}) {
  const inputId = useId();
  const [rows, setRows] = useState<UploadRow[]>([]);
  const [dragging, setDragging] = useState(false);
  const busy = rows.some((row) => row.state === 'uploading');

  const patch = (key: string, next: Partial<UploadRow>) =>
    setRows((list) => list.map((row) => (row.key === key ? { ...row, ...next } : row)));

  async function handleFiles(files: File[]) {
    if (files.length === 0) return;
    const batch = files.map((file, i) => ({
      file,
      row: {
        key: `${Date.now()}-${i}-${file.name}`,
        name: file.name,
        preview: URL.createObjectURL(file),
        state: 'uploading' as const,
      },
    }));
    setRows((list) => [...batch.map((b) => b.row), ...list].slice(0, 12));

    const uploaded: MediaItem[] = [];
    for (const { file, row } of batch) {
      const reason = rejectReason(file);
      if (reason) {
        patch(row.key, { state: 'error', message: reason });
        continue;
      }
      try {
        const size = await readImageSize(file);
        const item = await mediaApi.upload(file, size ?? {});
        uploaded.push(item);
        URL.revokeObjectURL(row.preview);
        patch(row.key, { state: 'done', preview: mediaSrc(item.url) });
      } catch (error) {
        patch(row.key, {
          state: 'error',
          message: error instanceof ApiError ? describeApiError(error) : 'فشل رفع الملف.',
        });
      }
    }
    if (uploaded.length > 0) onUploaded(uploaded);
  }

  function onDrop(event: DragEvent) {
    event.preventDefault();
    setDragging(false);
    void handleFiles(Array.from(event.dataTransfer.files));
  }

  return (
    <div className="grid gap-3">
      <label
        htmlFor={inputId}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        className={cn(
          'flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed bg-muted/30 text-center transition-colors hover:border-primary/60 hover:bg-primary/5',
          compact ? 'px-4 py-6' : 'px-6 py-10',
          dragging && 'border-primary bg-primary/5',
        )}
      >
        <span className="flex size-11 items-center justify-center rounded-full bg-primary/10 text-primary">
          {busy ? (
            <LoaderCircle className="size-5 animate-spin" />
          ) : (
            <UploadCloud className="size-5" />
          )}
        </span>
        <span className="text-sm font-medium">اسحب الصور وأفلتها هنا أو انقر للاختيار</span>
        <span className="text-xs text-muted-foreground">
          JPG · PNG · WEBP · AVIF · GIF — حتى {MAX_UPLOAD_MB} م.ب للصورة
        </span>
        <input
          id={inputId}
          type="file"
          accept={ACCEPTED_IMAGE_TYPES.join(',')}
          multiple
          className="sr-only"
          onChange={(e) => {
            void handleFiles(Array.from(e.target.files ?? []));
            e.target.value = '';
          }}
        />
      </label>

      {rows.length > 0 && (
        <ul className="grid gap-2">
          {rows.map((row) => (
            <li
              key={row.key}
              className="flex items-center gap-3 rounded-lg border bg-background p-2 text-sm"
            >
              <img src={row.preview} alt="" className="size-10 rounded-md object-cover" />
              <div className="grid min-w-0 flex-1">
                <span className="truncate" dir="ltr">
                  {row.name}
                </span>
                {row.message && <span className="text-xs text-destructive">{row.message}</span>}
              </div>
              {row.state === 'uploading' && (
                <LoaderCircle className="size-4 animate-spin text-muted-foreground" />
              )}
              {row.state === 'done' && <CircleCheck className="size-4 text-success" />}
              {row.state === 'error' && <CircleAlert className="size-4 text-destructive" />}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
