import { LoaderCircle } from 'lucide-react';
import type { ReactNode } from 'react';

/** Centered status screen for session checks and blocking errors. */
export function FullScreenStatus({
  title,
  description,
  loading = false,
  children,
}: {
  title: string;
  description?: string;
  loading?: boolean;
  children?: ReactNode;
}) {
  return (
    <div
      className="flex min-h-svh flex-col items-center justify-center gap-4 p-6 text-center"
      role={loading ? 'status' : 'alert'}
      aria-live="polite"
    >
      {loading && <LoaderCircle className="size-6 animate-spin text-muted-foreground" />}
      <div className="grid gap-1">
        <p className="font-medium">{title}</p>
        {description && <p className="max-w-sm text-sm text-muted-foreground">{description}</p>}
      </div>
      {children}
    </div>
  );
}

export function PageLoader() {
  return (
    <div className="flex items-center gap-2 p-6 text-sm text-muted-foreground" role="status">
      <LoaderCircle className="size-4 animate-spin" />
      جارٍ التحميل…
    </div>
  );
}
