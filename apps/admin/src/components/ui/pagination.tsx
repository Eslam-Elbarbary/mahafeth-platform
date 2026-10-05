import { ChevronLeft, ChevronRight } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { formatNumber } from '@/lib/format';

/** Page numbers around the current page, with gaps (`null`) collapsed. */
function pageWindow(page: number, totalPages: number): Array<number | null> {
  const pages = new Set([1, totalPages, page - 1, page, page + 1]);
  const sorted = [...pages].filter((p) => p >= 1 && p <= totalPages).sort((a, b) => a - b);
  return sorted.flatMap((p, i) => (i > 0 && p - sorted[i - 1]! > 1 ? [null, p] : [p]));
}

export function Pagination({
  page,
  pageSize,
  total,
  onPageChange,
}: {
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
}) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);

  return (
    <nav
      aria-label="التنقل بين الصفحات"
      className="flex flex-wrap items-center justify-between gap-3 text-sm"
    >
      <p className="text-muted-foreground">
        عرض {formatNumber(from)}–{formatNumber(to)} من {formatNumber(total)}
      </p>
      {totalPages > 1 && (
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="icon"
            className="size-8"
            disabled={page <= 1}
            onClick={() => onPageChange(page - 1)}
            aria-label="الصفحة السابقة"
          >
            <ChevronRight className="ltr:rotate-180" />
          </Button>
          {pageWindow(page, totalPages).map((p, i) =>
            p === null ? (
              <span key={`gap-${i}`} className="px-1 text-muted-foreground">
                …
              </span>
            ) : (
              <Button
                key={p}
                variant={p === page ? 'default' : 'ghost'}
                size="icon"
                className="size-8"
                aria-current={p === page ? 'page' : undefined}
                onClick={() => onPageChange(p)}
              >
                {formatNumber(p)}
              </Button>
            ),
          )}
          <Button
            variant="outline"
            size="icon"
            className="size-8"
            disabled={page >= totalPages}
            onClick={() => onPageChange(page + 1)}
            aria-label="الصفحة التالية"
          >
            <ChevronLeft className="ltr:rotate-180" />
          </Button>
        </div>
      )}
    </nav>
  );
}
