import { Check, Link2 } from 'lucide-react';

import { Skeleton } from '@/components/layout/page-header';
import { formatBytes } from '@/lib/format';
import { mediaSrc } from '@/lib/media-url';
import { cn } from '@/lib/utils';

import { type MediaItem, usageTotal } from './types';

export function MediaGrid({
  items,
  loading = false,
  selectedIds,
  onItemClick,
  columns = 'default',
}: {
  items: MediaItem[];
  loading?: boolean;
  selectedIds?: ReadonlySet<string>;
  onItemClick: (item: MediaItem) => void;
  columns?: 'default' | 'compact';
}) {
  const grid =
    columns === 'compact'
      ? 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5'
      : 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6';

  if (loading && items.length === 0) {
    return (
      <div className={cn('grid gap-4', grid)}>
        {Array.from({ length: 10 }, (_, i) => (
          <Skeleton key={i} className="aspect-square rounded-xl" />
        ))}
      </div>
    );
  }

  return (
    <ul className={cn('grid gap-4 transition-opacity', grid, loading && 'opacity-60')}>
      {items.map((item) => {
        const selected = selectedIds?.has(item.id) ?? false;
        const uses = usageTotal(item);
        return (
          <li key={item.id}>
            <button
              type="button"
              onClick={() => onItemClick(item)}
              aria-pressed={selectedIds ? selected : undefined}
              className={cn(
                'group relative block w-full overflow-hidden rounded-xl border bg-background text-start shadow-xs transition hover:shadow-md focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none',
                selected && 'border-primary ring-2 ring-primary',
              )}
            >
              <div className="aspect-square overflow-hidden bg-muted">
                <img
                  src={mediaSrc(item.url)}
                  alt={item.altAr ?? item.altEn ?? ''}
                  loading="lazy"
                  className="size-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
              </div>
              <div className="grid gap-0.5 p-2.5">
                <span className="truncate text-xs font-medium" dir="ltr" title={item.originalName}>
                  {item.originalName}
                </span>
                <span className="flex items-center justify-between gap-2 text-[11px] text-muted-foreground">
                  <span dir="ltr">
                    {item.width && item.height ? `${item.width}×${item.height}` : '—'}
                  </span>
                  <span>{formatBytes(item.size)}</span>
                </span>
              </div>
              {uses > 0 && (
                <span className="absolute start-2 top-2 inline-flex items-center gap-1 rounded-full bg-background/90 px-2 py-0.5 text-[11px] font-medium shadow-sm">
                  <Link2 className="size-3" /> مستخدمة
                </span>
              )}
              {selected && (
                <span className="absolute end-2 top-2 flex size-6 items-center justify-center rounded-full bg-primary text-primary-foreground shadow">
                  <Check className="size-4" />
                </span>
              )}
            </button>
          </li>
        );
      })}
    </ul>
  );
}
