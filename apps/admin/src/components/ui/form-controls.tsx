import type * as React from 'react';

import { cn } from '@/lib/utils';

const control =
  'w-full rounded-md border bg-background px-3 py-2 text-sm shadow-xs outline-none placeholder:text-muted-foreground/70 focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:opacity-60 aria-invalid:border-destructive aria-invalid:ring-destructive/20';

export function Field({
  label,
  hint,
  error,
  required = false,
  counter,
  className,
  children,
}: {
  label: string;
  hint?: React.ReactNode;
  error?: string;
  required?: boolean;
  /** Character counter: `[current, recommended max]`. */
  counter?: [number, number];
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <label className={cn('grid content-start gap-1.5 text-sm', className)}>
      <span className="flex items-center justify-between gap-2">
        <span className="font-medium">
          {label}
          {required && <span className="ms-0.5 text-destructive">*</span>}
        </span>
        {counter && (
          <span
            className={cn(
              'text-xs tabular-nums',
              counter[0] > counter[1] ? 'text-destructive' : 'text-muted-foreground',
            )}
            dir="ltr"
          >
            {counter[0]} / {counter[1]}
          </span>
        )}
      </span>
      {children}
      {error ? (
        <span className="text-xs text-destructive">{error}</span>
      ) : (
        hint && <span className="text-xs text-muted-foreground">{hint}</span>
      )}
    </label>
  );
}

export function TextInput({ className, ...props }: React.ComponentProps<'input'>) {
  return <input className={cn(control, 'h-9', className)} {...props} />;
}

export function TextArea({ className, ...props }: React.ComponentProps<'textarea'>) {
  return <textarea className={cn(control, 'min-h-24 leading-relaxed', className)} {...props} />;
}

export function Select({ className, ...props }: React.ComponentProps<'select'>) {
  return <select className={cn(control, 'h-9 py-0', className)} {...props} />;
}

/** Card-style group of fields with a heading. */
export function Section({
  title,
  description,
  actions,
  className,
  children,
}: {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <section className={cn('rounded-xl border bg-card shadow-xs', className)}>
      <header className="flex flex-wrap items-start justify-between gap-3 border-b px-5 py-4">
        <div className="grid gap-0.5">
          <h3 className="text-sm font-semibold">{title}</h3>
          {description && <p className="text-xs text-muted-foreground">{description}</p>}
        </div>
        {actions}
      </header>
      <div className="grid gap-4 p-5">{children}</div>
    </section>
  );
}
