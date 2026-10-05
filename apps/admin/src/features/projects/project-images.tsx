import { ArrowLeft, ArrowRight, ImageOff, ImagePlus, Loader2, RefreshCw, X } from 'lucide-react';
import { useState } from 'react';

import { EmptyState } from '@/components/layout/page-header';
import { Button } from '@/components/ui/button';
import { Section, Select, TextInput } from '@/components/ui/form-controls';
import { useToast } from '@/components/ui/toast-context';
import { MediaPickerDialog } from '@/features/media/media-picker-dialog';
import type { MediaItem } from '@/features/media/types';
import { ApiError } from '@/lib/api-client';
import { formatNumber } from '@/lib/format';
import { mediaSrc } from '@/lib/media-url';
import { describeApiError } from '@/lib/use-api-query';

import { projectsApi } from './api';
import {
  categoryMeta,
  PROJECT_IMAGE_CATEGORIES,
  type ProjectImage,
  type ProjectImageCategory,
} from './types';

const byOrder = (a: ProjectImage, b: ProjectImage) => a.order - b.order;

type Props = {
  projectId: string;
  images: ProjectImage[];
  onChange: (images: ProjectImage[]) => void;
};

/**
 * Cover, gallery and floor plans. Changes are saved immediately (independent of the form's save
 * button) because each one is its own API call.
 */
export function ProjectImages({ projectId, images, onChange }: Props) {
  const toast = useToast();
  const [busy, setBusy] = useState<string | null>(null);
  const [picker, setPicker] = useState<ProjectImageCategory | null>(null);

  const listOf = (category: ProjectImageCategory) =>
    images.filter((image) => image.category === category).sort(byOrder);

  async function run(key: string, task: () => Promise<void>, success?: string) {
    setBusy(key);
    try {
      await task();
      if (success) toast({ title: success });
    } catch (err) {
      toast({
        tone: 'error',
        title: 'تعذّر حفظ التغيير',
        description: err instanceof ApiError ? describeApiError(err) : undefined,
      });
    } finally {
      setBusy(null);
    }
  }

  const replace = (image: ProjectImage) =>
    onChange(images.map((item) => (item.id === image.id ? { ...item, ...image } : item)));

  const add = (category: ProjectImageCategory, media: MediaItem[]) =>
    run(
      `add:${category}`,
      async () => {
        const previous = category === 'COVER' ? listOf('COVER') : [];
        const added: ProjectImage[] = [];
        for (const item of media) {
          added.push(await projectsApi.addImage(projectId, { mediaId: item.id, category }));
        }
        for (const old of previous) await projectsApi.removeImage(projectId, old.id);
        const removed = new Set(previous.map((p) => p.id));
        onChange([...images.filter((i) => !removed.has(i.id)), ...added]);
      },
      category === 'COVER'
        ? 'تم تحديث صورة الغلاف'
        : `تمت إضافة ${formatNumber(media.length)} ${media.length === 1 ? 'صورة' : 'صور'}`,
    );

  const move = (list: ProjectImage[], index: number, step: -1 | 1) =>
    run(`move:${list[index]!.id}`, async () => {
      const next = [...list];
      const [item] = next.splice(index, 1);
      next.splice(index + step, 0, item!);
      const updated = await projectsApi.reorderImages(
        projectId,
        next.map((image, order) => ({ id: image.id, order })),
      );
      const byId = new Map(updated.map((image) => [image.id, image]));
      onChange(images.map((image) => byId.get(image.id) ?? image));
    });

  const recategorize = (image: ProjectImage, category: ProjectImageCategory) =>
    run(
      `cat:${image.id}`,
      async () => {
        const order = listOf(category).length;
        replace(await projectsApi.updateImage(projectId, image.id, { category, order }));
      },
      `نُقلت إلى «${categoryMeta[category].label}»`,
    );

  const saveCaption = (image: ProjectImage, key: 'captionAr' | 'captionEn', value: string) => {
    const next = value.trim() || null;
    if (next === image[key]) return;
    void run(`caption:${image.id}`, async () => {
      replace(await projectsApi.updateImage(projectId, image.id, { [key]: next }));
    });
  };

  const remove = (image: ProjectImage) =>
    run(
      `remove:${image.id}`,
      async () => {
        await projectsApi.removeImage(projectId, image.id);
        onChange(images.filter((item) => item.id !== image.id));
      },
      'أُزيلت الصورة من المشروع (تبقى في مكتبة الوسائط)',
    );

  const cover = listOf('COVER')[0];
  const disabled = busy !== null;

  return (
    <div className="grid gap-6">
      <Section
        title={categoryMeta.COVER.label}
        description={categoryMeta.COVER.hint}
        actions={
          cover && (
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={disabled}
                onClick={() => setPicker('COVER')}
              >
                <RefreshCw /> تغيير
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                disabled={disabled}
                onClick={() => void remove(cover)}
              >
                <X /> إزالة
              </Button>
            </div>
          )
        }
      >
        {cover ? (
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_18rem]">
            <div className="relative overflow-hidden rounded-lg border bg-muted">
              <img
                src={mediaSrc(cover.media.url)}
                alt={cover.media.altAr ?? ''}
                className="aspect-[16/9] w-full object-cover"
              />
              {busy?.endsWith(cover.id) && <BusyOverlay />}
            </div>
            <CaptionFields image={cover} disabled={disabled} onSave={saveCaption} />
          </div>
        ) : (
          <button
            type="button"
            disabled={disabled}
            onClick={() => setPicker('COVER')}
            className="flex aspect-[21/9] flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed text-muted-foreground transition-colors hover:border-primary/50 hover:bg-primary/5 hover:text-primary"
          >
            {busy === 'add:COVER' ? (
              <Loader2 className="size-6 animate-spin" />
            ) : (
              <ImagePlus className="size-6" />
            )}
            <span className="text-sm font-medium">اختر صورة الغلاف من المكتبة</span>
          </button>
        )}
      </Section>

      {(['GALLERY', 'FLOOR_PLAN'] as const).map((category) => {
        const list = listOf(category);
        return (
          <Section
            key={category}
            title={`${categoryMeta[category].label} (${formatNumber(list.length)})`}
            description={categoryMeta[category].hint}
            actions={
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={disabled}
                onClick={() => setPicker(category)}
              >
                {busy === `add:${category}` ? <Loader2 className="animate-spin" /> : <ImagePlus />}
                إضافة صور
              </Button>
            }
          >
            {list.length === 0 ? (
              <EmptyState
                icon={<ImageOff />}
                title="لا توجد صور"
                description="اختر صورًا من مكتبة الوسائط أو ارفع صورًا جديدة."
              />
            ) : (
              <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
                {list.map((image, index) => (
                  <li
                    key={image.id}
                    className="grid content-start overflow-hidden rounded-lg border bg-background"
                  >
                    <div className="relative bg-muted">
                      <img
                        src={mediaSrc(image.media.url)}
                        alt={image.media.altAr ?? ''}
                        className="aspect-[4/3] w-full object-cover"
                        loading="lazy"
                      />
                      <span className="absolute start-2 top-2 flex size-6 items-center justify-center rounded-full bg-black/60 text-xs font-semibold text-white tabular-nums">
                        {index + 1}
                      </span>
                      {busy?.endsWith(image.id) && <BusyOverlay />}
                    </div>
                    <div className="grid gap-2 p-3">
                      <CaptionFields
                        image={image}
                        disabled={disabled}
                        onSave={saveCaption}
                        compact
                      />
                      <div className="flex items-center gap-1 pt-1">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="size-8"
                          aria-label="تقديم"
                          title="تقديم"
                          disabled={index === 0 || disabled}
                          onClick={() => void move(list, index, -1)}
                        >
                          <ArrowRight className="ltr:rotate-180" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="size-8"
                          aria-label="تأخير"
                          title="تأخير"
                          disabled={index === list.length - 1 || disabled}
                          onClick={() => void move(list, index, 1)}
                        >
                          <ArrowLeft className="ltr:rotate-180" />
                        </Button>
                        <Select
                          aria-label="التصنيف"
                          className="h-8 flex-1 text-xs"
                          value={image.category}
                          disabled={disabled}
                          onChange={(e) =>
                            void recategorize(image, e.target.value as ProjectImageCategory)
                          }
                        >
                          {PROJECT_IMAGE_CATEGORIES.filter((c) => c !== 'COVER').map((c) => (
                            <option key={c} value={c}>
                              {categoryMeta[c].label}
                            </option>
                          ))}
                        </Select>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="size-8 text-destructive hover:bg-destructive/10 hover:text-destructive"
                          aria-label="إزالة من المشروع"
                          title="إزالة من المشروع"
                          disabled={disabled}
                          onClick={() => void remove(image)}
                        >
                          <X />
                        </Button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Section>
        );
      })}

      <MediaPickerDialog
        open={picker !== null}
        onOpenChange={(open) => !open && setPicker(null)}
        title={
          picker ? `${picker === 'COVER' ? 'اختيار' : 'إضافة'} ${categoryMeta[picker].label}` : ''
        }
        description={picker ? categoryMeta[picker].hint : undefined}
        multiple={picker !== 'COVER'}
        confirmLabel={picker === 'COVER' ? 'تعيين كغلاف' : 'إضافة للمشروع'}
        excludeIds={picker ? new Set(listOf(picker).map((image) => image.mediaId)) : undefined}
        onSelect={(media) => picker && void add(picker, media)}
      />
    </div>
  );
}

function BusyOverlay() {
  return (
    <div className="absolute inset-0 flex items-center justify-center bg-background/60">
      <Loader2 className="size-5 animate-spin text-primary" />
    </div>
  );
}

function CaptionFields({
  image,
  disabled,
  compact = false,
  onSave,
}: {
  image: ProjectImage;
  disabled: boolean;
  compact?: boolean;
  onSave: (image: ProjectImage, key: 'captionAr' | 'captionEn', value: string) => void;
}) {
  const size = compact ? 'h-8 text-xs' : undefined;
  return (
    <div className="grid content-start gap-2">
      {!compact && <span className="text-sm font-medium">التعليق على الصورة</span>}
      <TextInput
        className={size}
        placeholder="تعليق (عربي)"
        aria-label="تعليق (عربي)"
        defaultValue={image.captionAr ?? ''}
        disabled={disabled}
        onBlur={(e) => onSave(image, 'captionAr', e.target.value)}
      />
      <TextInput
        className={size}
        dir="ltr"
        placeholder="Caption (English)"
        aria-label="Caption (English)"
        defaultValue={image.captionEn ?? ''}
        disabled={disabled}
        onBlur={(e) => onSave(image, 'captionEn', e.target.value)}
      />
      {!compact && (
        <p className="text-xs text-muted-foreground">
          يُحفظ التعليق تلقائيًا عند مغادرة الحقل. النص البديل يُعدَّل من مكتبة الوسائط.
        </p>
      )}
    </div>
  );
}
