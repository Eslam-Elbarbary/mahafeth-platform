import { ImageIcon, ImagePlus, RefreshCw, X } from 'lucide-react';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Section } from '@/components/ui/form-controls';
import { mediaSrc } from '@/lib/media-url';
import { cn } from '@/lib/utils';

import { MediaPickerDialog } from './media-picker-dialog';
import type { MediaSummary } from './types';

/** One image chosen from the media library, with preview, replace and remove. */
export function MediaSetting({
  title,
  description,
  value,
  onChange,
  error,
  emptyHint,
  previewClassName,
  bare = false,
}: {
  title: string;
  description: string;
  value: MediaSummary | null;
  onChange: (media: MediaSummary | null) => void;
  error?: string;
  emptyHint: string;
  previewClassName?: string;
  /** Without the card frame, for use inside another section. */
  bare?: boolean;
}) {
  const [picking, setPicking] = useState(false);

  const body = (
    <>
      <div className="flex flex-wrap items-center gap-4">
        <span
          className={cn(
            'flex shrink-0 items-center justify-center overflow-hidden rounded-lg border bg-muted/60',
            previewClassName ?? 'size-28',
          )}
        >
          {value ? (
            <img src={mediaSrc(value.url)} alt="" className="size-full object-contain p-2" />
          ) : (
            <ImageIcon className="size-1/3 text-muted-foreground/60" />
          )}
        </span>
        <div className="grid gap-2">
          {bare && <p className="text-sm font-medium">{title}</p>}
          <p className="text-xs text-muted-foreground">
            {value ? (
              value.width && value.height ? (
                <>
                  الأبعاد:{' '}
                  <bdi dir="ltr">
                    {value.width} × {value.height}
                  </bdi>
                </>
              ) : null
            ) : (
              emptyHint
            )}
          </p>
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" size="sm" onClick={() => setPicking(true)}>
              {value ? <RefreshCw /> : <ImagePlus />}
              {value ? 'استبدال' : 'اختيار صورة'}
            </Button>
            {value && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                onClick={() => onChange(null)}
              >
                <X /> إزالة
              </Button>
            )}
          </div>
        </div>
      </div>
      {error && <p className="text-xs text-destructive">{error}</p>}

      <MediaPickerDialog
        open={picking}
        onOpenChange={setPicking}
        title={title}
        confirmLabel="اعتماد الصورة"
        onSelect={([item]) => item && onChange(item)}
      />
    </>
  );

  if (bare) return <div className="grid gap-2">{body}</div>;
  return (
    <Section title={title} description={description}>
      {body}
    </Section>
  );
}
