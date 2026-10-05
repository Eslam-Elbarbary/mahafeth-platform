import { LoaderCircle } from 'lucide-react';
import { AlertDialog } from 'radix-ui';
import type { ReactNode } from 'react';

import { Button } from '@/components/ui/button';

/** Controlled confirmation for destructive actions. */
export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = 'حذف',
  busy = false,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: ReactNode;
  confirmLabel?: string;
  busy?: boolean;
  onConfirm: () => void;
}) {
  return (
    <AlertDialog.Root open={open} onOpenChange={(next) => !busy && onOpenChange(next)}>
      <AlertDialog.Portal>
        <AlertDialog.Overlay className="fixed inset-0 z-50 bg-black/50 data-[state=open]:animate-in data-[state=open]:fade-in-0" />
        <AlertDialog.Content className="fixed top-1/2 left-1/2 z-50 grid w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 gap-4 rounded-xl border bg-background p-6 shadow-lg data-[state=open]:animate-in data-[state=open]:zoom-in-95">
          <AlertDialog.Title className="text-lg font-semibold">{title}</AlertDialog.Title>
          {description && (
            <AlertDialog.Description className="text-sm leading-relaxed text-muted-foreground">
              {description}
            </AlertDialog.Description>
          )}
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <AlertDialog.Cancel asChild>
              <Button variant="outline" disabled={busy}>
                إلغاء
              </Button>
            </AlertDialog.Cancel>
            <Button
              variant="destructive"
              disabled={busy}
              onClick={(event) => {
                event.preventDefault();
                onConfirm();
              }}
            >
              {busy && <LoaderCircle className="animate-spin" />}
              {confirmLabel}
            </Button>
          </div>
        </AlertDialog.Content>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  );
}
