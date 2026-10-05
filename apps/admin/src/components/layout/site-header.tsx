import { LogOut } from 'lucide-react';
import { useLocation } from 'react-router';

import { MobileSidebar } from '@/components/layout/app-sidebar';
import { Button } from '@/components/ui/button';
import { navItemOf } from '@/config/navigation';
import { useAuth } from '@/features/auth/auth-context';
import { roleMeta } from '@/features/users/types';
import { UserAvatar } from '@/features/users/user-badges';

export function SiteHeader() {
  const { pathname } = useLocation();
  const { user, logout } = useAuth();
  const current = navItemOf(pathname);

  return (
    <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center gap-4 border-b bg-background/90 px-6 backdrop-blur">
      <MobileSidebar />
      <p className="flex-1 text-sm text-muted-foreground">
        لوحة التحكم
        {current && (
          <>
            <span className="mx-2 text-border">/</span>
            <span className="font-medium text-foreground">{current.title}</span>
          </>
        )}
      </p>
      {user && (
        <div className="flex items-center gap-3">
          <UserAvatar name={user.name} />
          <div className="hidden text-sm leading-tight sm:grid">
            <span className="font-medium">{user.name}</span>
            <span className="text-xs text-muted-foreground">
              {roleMeta[user.role].label} · <span dir="ltr">{user.email}</span>
            </span>
          </div>
          <Button variant="ghost" size="sm" onClick={logout}>
            <LogOut className="rtl:rotate-180" /> تسجيل الخروج
          </Button>
        </div>
      )}
    </header>
  );
}
