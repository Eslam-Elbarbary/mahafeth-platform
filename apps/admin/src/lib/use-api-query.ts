import { useCallback, useEffect, useRef, useState } from 'react';

import { ApiError } from '@/lib/api-client';

type Result<T> = { key: string; data?: T; error?: ApiError };

/**
 * Loads `fetcher()` whenever `key` changes and keeps the previous data while the next request is
 * in flight (tables and grids don't flash empty between pages or searches).
 */
export function useApiQuery<T>(key: string, fetcher: () => Promise<T>) {
  const [reloads, setReloads] = useState(0);
  const [result, setResult] = useState<Result<T> | null>(null);
  const fetcherRef = useRef(fetcher);

  useEffect(() => {
    fetcherRef.current = fetcher;
  });

  const requestKey = `${key}#${reloads}`;

  useEffect(() => {
    let active = true;
    fetcherRef
      .current()
      .then((data) => active && setResult({ key: requestKey, data }))
      .catch((error: unknown) => {
        if (!active) return;
        const apiError =
          error instanceof ApiError ? error : new ApiError(0, 'حدث خطأ غير متوقع', 'UNKNOWN');
        setResult((previous) => ({ key: requestKey, data: previous?.data, error: apiError }));
      });
    return () => {
      active = false;
    };
  }, [requestKey]);

  const reload = useCallback(() => setReloads((n) => n + 1), []);

  /** Optimistic local edit of the loaded data. */
  const mutate = useCallback((update: (data: T) => T) => {
    setResult((previous) =>
      previous?.data === undefined ? previous : { ...previous, data: update(previous.data) },
    );
  }, []);

  return {
    data: result?.data,
    error: result?.key === requestKey ? result.error : undefined,
    loading: result?.key !== requestKey,
    /** First load (nothing to show yet). */
    initialLoading: result === null,
    reload,
    mutate,
  };
}

/** Arabic message for an API failure shown in lists and forms. */
export function describeApiError(error: ApiError | undefined) {
  if (!error) return '';
  if (error.isUnavailable) return 'تعذّر الاتصال بالخادم. تحقق من تشغيل الواجهة البرمجية.';
  if (error.status === 403) return 'ليست لديك صلاحية لتنفيذ هذا الإجراء.';
  if (error.status === 404) return 'العنصر المطلوب غير موجود أو تم حذفه.';
  if (error.status === 409) return 'تعارض في البيانات: قد تكون القيمة مستخدمة مسبقًا.';
  if (error.status === 413) return 'حجم الملف أكبر من المسموح.';
  return error.message;
}
