import { X } from 'lucide-react';
import { Dialog as SheetPrimitive } from 'radix-ui';
import type * as React from 'react';

import { cn } from '@/lib/utils';

const Sheet = SheetPrimitive.Root;
const SheetClose = SheetPrimitive.Close;

/** Side drawer anchored to the inline end (left in RTL). */
function SheetContent({
  className,
  children,
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Content>) {
  return (
    <SheetPrimitive.Portal>
      <SheetPrimitive.Overlay className="fixed inset-0 z-50 bg-black/50 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:animate-in data-[state=open]:fade-in-0" />
      <SheetPrimitive.Content
        className={cn(
          'fixed inset-y-0 end-0 z-50 flex w-full max-w-lg flex-col border-s bg-background shadow-lg duration-200 data-[state=closed]:animate-out data-[state=closed]:slide-out-to-end data-[state=open]:animate-in data-[state=open]:slide-in-from-end',
          className,
        )}
        {...props}
      >
        {children}
        <SheetPrimitive.Close className="absolute end-4 top-4 rounded-sm opacity-70 transition-opacity hover:opacity-100 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none">
          <X className="size-4" />
          <span className="sr-only">إغلاق</span>
        </SheetPrimitive.Close>
      </SheetPrimitive.Content>
    </SheetPrimitive.Portal>
  );
}

function SheetHeader({ className, ...props }: React.ComponentProps<'div'>) {
  return <div className={cn('grid gap-1.5 border-b p-5 pe-12 text-start', className)} {...props} />;
}

function SheetBody({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      className={cn('grid flex-1 content-start gap-5 overflow-y-auto p-5', className)}
      {...props}
    />
  );
}

function SheetFooter({ className, ...props }: React.ComponentProps<'div'>) {
  return <div className={cn('flex items-center gap-2 border-t p-4', className)} {...props} />;
}

function SheetTitle({ className, ...props }: React.ComponentProps<typeof SheetPrimitive.Title>) {
  return <SheetPrimitive.Title className={cn('text-lg font-semibold', className)} {...props} />;
}

function SheetDescription({
  className,
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Description>) {
  return (
    <SheetPrimitive.Description
      className={cn('text-sm text-muted-foreground', className)}
      {...props}
    />
  );
}

export {
  Sheet,
  SheetBody,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
};
