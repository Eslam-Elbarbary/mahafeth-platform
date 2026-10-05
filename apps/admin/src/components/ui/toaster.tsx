import { CircleAlert, CircleCheck, Info, X } from 'lucide-react';
import { type ReactNode, useCallback, useRef, useState } from 'react';

import { cn } from '@/lib/utils';

import { ToastContext, type ToastInput } from './toast-context';

type Toast = ToastInput & { id: number };

const icons = { success: CircleCheck, error: CircleAlert, info: Info } as const;
const DURATION_MS = 4500;

export function Toaster({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const nextId = useRef(0);

  const dismiss = useCallback((id: number) => {
    setToasts((list) => list.filter((toast) => toast.id !== id));
  }, []);

  const toast = useCallback(
    (input: ToastInput) => {
      const id = ++nextId.current;
      setToasts((list) => [...list.slice(-3), { ...input, id }]);
      window.setTimeout(() => dismiss(id), DURATION_MS);
    },
    [dismiss],
  );

  return (
    <ToastContext value={toast}>
      {children}
      <div
        className="pointer-events-none fixed bottom-4 left-4 z-[60] flex w-[min(24rem,calc(100%-2rem))] flex-col gap-2"
        aria-live="polite"
      >
        {toasts.map(({ id, title, description, tone = 'success' }) => {
          const Icon = icons[tone];
          return (
            <div
              key={id}
              role={tone === 'error' ? 'alert' : 'status'}
              className="pointer-events-auto flex animate-in items-start gap-3 rounded-lg border bg-background p-4 shadow-lg fade-in-0 slide-in-from-bottom-2"
            >
              <Icon
                className={cn(
                  'mt-0.5 size-5 shrink-0',
                  tone === 'success' && 'text-success',
                  tone === 'error' && 'text-destructive',
                  tone === 'info' && 'text-info',
                )}
              />
              <div className="grid flex-1 gap-0.5 text-sm">
                <p className="font-medium">{title}</p>
                {description && <p className="text-muted-foreground">{description}</p>}
              </div>
              <button
                type="button"
                className="text-muted-foreground hover:text-foreground"
                onClick={() => dismiss(id)}
              >
                <X className="size-4" />
                <span className="sr-only">إغلاق</span>
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext>
  );
}
