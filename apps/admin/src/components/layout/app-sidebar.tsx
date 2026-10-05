import { Menu, X } from 'lucide-react';
import { Dialog } from 'radix-ui';
import { useState } from 'react';
import { Link, useLocation } from 'react-router';

import { Button } from '@/components/ui/button';
import { navigationGroups, navItemOf } from '@/config/navigation';
import { useCan } from '@/features/auth/auth-context';
import { cn } from '@/lib/utils';

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const active = navItemOf(useLocation().pathname)?.to;
  const can = useCan();
  const groups = navigationGroups
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => !item.resource || can(item.resource)),
    }))
    .filter((group) => group.items.length > 0);
  return (
    <>
      <div className="flex h-16 items-center gap-3 border-b border-sidebar-border px-5">
        <img src="/logo-seal-192.png" alt="" className="size-9 rounded-full bg-white/90 p-0.5" />
        <div className="grid leading-tight">
          <span className="font-bold text-white">محافظ</span>
          <span className="text-xs text-sidebar-foreground/70">لوحة إدارة المحتوى</span>
        </div>
      </div>
      <nav className="flex flex-1 flex-col gap-5 overflow-y-auto p-3">
        {groups.map((group) => (
          <div key={group.title} className="grid gap-1">
            <p className="px-3 pb-1 text-[11px] font-medium tracking-wide text-sidebar-foreground/50">
              {group.title}
            </p>
            {group.items.map(({ title, to, icon: Icon }) => (
              <Link
                key={to}
                to={to}
                onClick={onNavigate}
                aria-current={to === active ? 'page' : undefined}
                className={cn(
                  'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
                  to === active &&
                    'bg-sidebar-primary text-sidebar-primary-foreground shadow-sm hover:bg-sidebar-primary hover:text-sidebar-primary-foreground',
                )}
              >
                <Icon className="size-4" />
                {title}
              </Link>
            ))}
          </div>
        ))}
      </nav>
      <p className="border-t border-sidebar-border px-5 py-3 text-[11px] text-sidebar-foreground/50">
        محافظ للاستثمار العقاري
      </p>
    </>
  );
}

export function AppSidebar() {
  return (
    <aside className="sticky top-0 hidden h-svh w-64 shrink-0 flex-col bg-sidebar text-sidebar-foreground md:flex">
      <SidebarContent />
    </aside>
  );
}

/** The sidebar as a drawer on screens narrower than `md`, where the fixed sidebar is hidden. */
export function MobileSidebar() {
  const [open, setOpen] = useState(false);
  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden" aria-label="القائمة">
          <Menu />
        </Button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/50 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:animate-in data-[state=open]:fade-in-0 md:hidden" />
        <Dialog.Content
          aria-describedby={undefined}
          className="fixed inset-y-0 start-0 z-50 flex w-64 max-w-[85vw] flex-col bg-sidebar text-sidebar-foreground shadow-lg duration-200 data-[state=closed]:animate-out data-[state=closed]:slide-out-to-start data-[state=open]:animate-in data-[state=open]:slide-in-from-start md:hidden"
        >
          <Dialog.Title className="sr-only">القائمة</Dialog.Title>
          <SidebarContent onNavigate={() => setOpen(false)} />
          <Dialog.Close className="absolute end-3 top-5 rounded-sm text-sidebar-foreground/70 transition-opacity hover:text-white focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none">
            <X className="size-4" />
            <span className="sr-only">إغلاق</span>
          </Dialog.Close>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
