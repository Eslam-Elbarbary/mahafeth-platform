import { ExternalLink, FileText, Pencil } from 'lucide-react';
import { Link } from 'react-router';

import { EmptyState, PageHeader, Skeleton } from '@/components/layout/page-header';
import { Button } from '@/components/ui/button';
import { pagesApi } from '@/features/pages/api';
import { PublishBadge } from '@/features/projects/project-badges';
import { env } from '@/lib/env';
import { formatDate, formatNumber } from '@/lib/format';
import { describeApiError, useApiQuery } from '@/lib/use-api-query';

/** The pages whose content is managed here, in website order. */
const MANAGED = ['home', 'about', 'leadership', 'contact'];

export default function PagesPage() {
  const { data, error, loading, reload } = useApiQuery('pages', pagesApi.list);

  const items = (data?.data ?? [])
    .filter((page) => MANAGED.includes(page.slug))
    .sort((a, b) => MANAGED.indexOf(a.slug) - MANAGED.indexOf(b.slug));

  return (
    <div className="grid gap-6">
      <PageHeader
        title="صفحات الموقع"
        description="نصوص وصور وأقسام الصفحة الرئيسية وصفحات من نحن والقيادة وتواصل معنا."
      />

      <div className="overflow-hidden rounded-xl border bg-background shadow-xs">
        {error && (
          <div className="flex items-center justify-between gap-3 border-b bg-destructive/5 p-3 text-sm text-destructive">
            {describeApiError(error)}
            <Button variant="outline" size="sm" onClick={reload}>
              إعادة المحاولة
            </Button>
          </div>
        )}

        {!loading && !error && items.length === 0 ? (
          <div className="p-6">
            <EmptyState
              icon={<FileText />}
              title="لا توجد صفحات"
              description="شغّل أمر تهيئة قاعدة البيانات (seed) لإنشاء صفحات الموقع."
            />
          </div>
        ) : (
          <div className="relative overflow-x-auto">
            <table className="w-full min-w-[720px] text-sm">
              <thead className="bg-muted/50 text-xs text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 text-start font-medium">الصفحة</th>
                  <th className="px-4 py-3 text-start font-medium">الحالة</th>
                  <th className="px-4 py-3 text-start font-medium">الأقسام</th>
                  <th className="px-4 py-3 text-start font-medium">آخر تحديث</th>
                  <th className="px-4 py-3">
                    <span className="sr-only">إجراءات</span>
                  </th>
                </tr>
              </thead>
              <tbody className={loading ? 'opacity-60 transition-opacity' : undefined}>
                {loading && items.length === 0
                  ? Array.from({ length: 4 }, (_, i) => (
                      <tr key={i} className="border-t">
                        <td className="px-4 py-3" colSpan={5}>
                          <Skeleton className="h-10 w-full" />
                        </td>
                      </tr>
                    ))
                  : items.map((page) => (
                      <tr key={page.id} className="border-t transition-colors hover:bg-muted/30">
                        <td className="px-4 py-3">
                          <Link to={`/pages/${page.slug}`} className="grid gap-0.5">
                            <span className="font-semibold">{page.titleAr}</span>
                            <span className="text-xs text-muted-foreground" dir="ltr">
                              {page.slug} · /{page.path.replace(/^\//, '')}
                            </span>
                          </Link>
                        </td>
                        <td className="px-4 py-3">
                          <PublishBadge status={page.status} />
                        </td>
                        <td className="px-4 py-3 text-muted-foreground tabular-nums">
                          {formatNumber(page._count.sections)}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {formatDate(page.lastEditedAt)}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex justify-end gap-1">
                            <Button asChild variant="ghost" size="icon" className="size-8">
                              <Link to={`/pages/${page.slug}`} aria-label="تعديل">
                                <Pencil />
                              </Link>
                            </Button>
                            {page.status === 'PUBLISHED' && (
                              <Button asChild variant="ghost" size="icon" className="size-8">
                                <a
                                  href={`${env.siteUrl}/ar${page.path}`}
                                  target="_blank"
                                  rel="noreferrer"
                                  aria-label="عرض في الموقع"
                                >
                                  <ExternalLink />
                                </a>
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
