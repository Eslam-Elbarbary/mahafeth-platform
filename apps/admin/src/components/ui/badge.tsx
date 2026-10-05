import { cva, type VariantProps } from 'class-variance-authority';
import type * as React from 'react';

import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium whitespace-nowrap [&_svg]:size-3',
  {
    variants: {
      tone: {
        neutral: 'border-border bg-muted text-muted-foreground',
        success: 'border-success/25 bg-success/10 text-success',
        warning: 'border-warning/30 bg-warning/15 text-[oklch(0.45_0.1_70)]',
        info: 'border-info/25 bg-info/10 text-info',
        danger: 'border-destructive/25 bg-destructive/10 text-destructive',
        dark: 'border-transparent bg-foreground text-background',
      },
    },
    defaultVariants: { tone: 'neutral' },
  },
);

export type BadgeTone = NonNullable<VariantProps<typeof badgeVariants>['tone']>;

function Badge({
  className,
  tone,
  dot = false,
  children,
  ...props
}: React.ComponentProps<'span'> & VariantProps<typeof badgeVariants> & { dot?: boolean }) {
  return (
    <span className={cn(badgeVariants({ tone }), className)} {...props}>
      {dot && <span aria-hidden className="size-1.5 rounded-full bg-current" />}
      {children}
    </span>
  );
}

export { Badge };
