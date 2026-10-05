import { Copy, ExternalLink, LoaderCircle, Trash2 } from 'lucide-react';
import { type FormEvent, useState } from 'react';

import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Field, TextInput } from '@/components/ui/form-controls';
import { useToast } from '@/components/ui/toast-context';
import { ApiError } from '@/lib/api-client';
import { formatBytes, formatDate } from '@/lib/format';
import { mediaSrc } from '@/lib/media-url';
import { describeApiError } from '@/lib/use-api-query';

import { mediaApi } from './api';
import { type MediaItem, usageTotal } from './types';

function usageText(item: MediaItem) {
  const c = item._count;
  if (!c) return null;
  const parts = [
    c.projectCovers + c.projectImages > 0 && `${c.projectCovers + c.projectImages} في المشاريع`,
    c.sections > 0 && `${c.sections} في أقسام الصفحات`,
    c.pageOgImages > 0 && `${c.pageOgImages} صورة مشاركة لصفحة`,
    c.services > 0 && `${c.services} في الخدمات`,
    c.teamMemberPhotos > 0 && `${c.teamMemberPhotos} في فريق العمل`,
    c.partnerLogos > 0 && `${c.partnerLogos} في الشركاء`,
  ].filter(Boolean);
  return parts.length ? parts.join('، ') : null;
}

function DetailsBody({
  item,
  onUpdated,
  onDeleted,
}: {
  item: MediaItem;
  onUpdated: (item: MediaItem) => void;
  onDeleted: (id: string) => void;
}) {
  const toast = useToast();
  const [altAr, setAltAr] = useState(item.altAr ?? '');
  const [altEn, setAltEn] = useState(item.altEn ?? '');
  const [saving, setSaving] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const dirty = altAr !== (item.altAr ?? '') || altEn !== (item.altEn ?? '');
  const usage = usageText(item);
  const src = mediaSrc(item.url);

  async function save(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    try {
      const updated = await mediaApi.update(item.id, {
        altAr: altAr.trim() || null,
        altEn: altEn.trim() || null,
      });
      onUpdated({ ...item, ...updated });
      toast({ title: 'تم حفظ النص البديل' });
    } catch (error) {
      toast({
        tone: 'error',
        title: 'تعذّر الحفظ',
        description: error instanceof ApiError ? describeApiError(error) : undefined,
      });
    } finally {
      setSaving(false);
    }
  }

  async function remove() {
    setDeleting(true);
    try {
      await mediaApi.remove(item.id);
      setConfirmOpen(false);
      onDeleted(item.id);
      toast({ title: 'تم حذف الصورة' });
    } catch (error) {
      toast({
        tone: 'error',
        title: 'تعذّر حذف الصورة',
        description: error instanceof ApiError ? describeApiError(error) : undefined,
      });
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="grid gap-6 md:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
      <div className="flex items-center justify-center overflow-hidden rounded-lg border bg-[repeating-conic-gradient(var(--muted)_0_25%,transparent_0_50%)] bg-[length:20px_20px]">
        <img src={src} alt={item.altAr ?? ''} className="max-h-[60svh] w-auto object-contain" />
      </div>

      <div className="grid content-start gap-5">
        <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
          <dt className="text-muted-foreground">اسم الملف</dt>
          <dd className="truncate" dir="ltr" title={item.originalName}>
            {item.originalName}
          </dd>
          <dt className="text-muted-foreground">الأبعاد</dt>
          <dd dir="ltr" className="text-end">
            {item.width && item.height ? `${item.width} × ${item.height} px` : 'غير معروفة'}
          </dd>
          <dt className="text-muted-foreground">الحجم</dt>
          <dd>{formatBytes(item.size)}</dd>
          <dt className="text-muted-foreground">النوع</dt>
          <dd dir="ltr" className="text-end">
            {item.mimeType}
          </dd>
          <dt className="text-muted-foreground">تاريخ الرفع</dt>
          <dd>{formatDate(item.createdAt)}</dd>
          <dt className="text-muted-foreground">الاستخدام</dt>
          <dd>{usage ?? 'غير مستخدمة'}</dd>
        </dl>

        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              void navigator.clipboard.writeText(src);
              toast({ tone: 'info', title: 'تم نسخ الرابط' });
            }}
          >
            <Copy /> نسخ الرابط
          </Button>
          <Button asChild variant="outline" size="sm">
            <a href={src} target="_blank" rel="noreferrer">
              <ExternalLink /> فتح الأصل
            </a>
          </Button>
        </div>

        <form className="grid gap-4 border-t pt-5" onSubmit={save}>
          <Field label="النص البديل (عربي)" hint="يصف الصورة لقارئات الشاشة ومحركات البحث.">
            <TextInput value={altAr} onChange={(e) => setAltAr(e.target.value)} maxLength={255} />
          </Field>
          <Field label="النص البديل (إنجليزي)">
            <TextInput
              dir="ltr"
              value={altEn}
              onChange={(e) => setAltEn(e.target.value)}
              maxLength={255}
            />
          </Field>
          <div className="flex items-center justify-between gap-2">
            <Button
              type="button"
              variant="ghost"
              className="text-destructive hover:bg-destructive/10 hover:text-destructive"
              onClick={() => setConfirmOpen(true)}
            >
              <Trash2 /> حذف
            </Button>
            <Button type="submit" disabled={!dirty || saving}>
              {saving && <LoaderCircle className="animate-spin" />}
              حفظ التغييرات
            </Button>
          </div>
        </form>
      </div>

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        busy={deleting}
        title="حذف الصورة؟"
        description={
          usageTotal(item) > 0
            ? `هذه الصورة مستخدمة (${usage}). ستختفي من المكتبة لكنها ستبقى ظاهرة حيث استُخدمت حتى تستبدلها.`
            : 'ستُزال الصورة من مكتبة الوسائط. لا يمكن التراجع عن هذا الإجراء من لوحة التحكم.'
        }
        onConfirm={() => void remove()}
      />
    </div>
  );
}

export function MediaDetailsDialog({
  item,
  onOpenChange,
  onUpdated,
  onDeleted,
}: {
  item: MediaItem | null;
  onOpenChange: (open: boolean) => void;
  onUpdated: (item: MediaItem) => void;
  onDeleted: (id: string) => void;
}) {
  return (
    <Dialog open={item !== null} onOpenChange={onOpenChange}>
      <DialogContent size="xl">
        <DialogHeader>
          <DialogTitle>تفاصيل الصورة</DialogTitle>
          <DialogDescription>راجع بيانات الصورة وعدّل نصها البديل.</DialogDescription>
        </DialogHeader>
        {item && (
          <DetailsBody key={item.id} item={item} onUpdated={onUpdated} onDeleted={onDeleted} />
        )}
      </DialogContent>
    </Dialog>
  );
}
