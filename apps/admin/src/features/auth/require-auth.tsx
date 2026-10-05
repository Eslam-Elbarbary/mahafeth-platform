import { Navigate, Outlet, useLocation } from 'react-router';

import { FullScreenStatus } from '@/components/layout/full-screen-status';
import { Button } from '@/components/ui/button';

import { useAuth } from './auth-context';

export type LoginLocationState = { from?: string };

/** Layout route guarding everything nested under it; signed-out visitors go to `/login`. */
export function RequireAuth() {
  const { status, retry, logout } = useAuth();
  const location = useLocation();

  if (status === 'loading') {
    return <FullScreenStatus loading title="جارٍ التحقق من الجلسة…" />;
  }

  if (status === 'unavailable') {
    return (
      <FullScreenStatus
        title="الخادم غير متاح حاليًا"
        description="تعذّر التحقق من جلستك لأن الخادم لم يستجب. تأكد من تشغيل الواجهة البرمجية ثم أعد المحاولة."
      >
        <div className="flex gap-2">
          <Button onClick={retry}>إعادة المحاولة</Button>
          <Button variant="outline" onClick={logout}>
            تسجيل الخروج
          </Button>
        </div>
      </FullScreenStatus>
    );
  }

  if (status === 'unauthenticated') {
    const from = `${location.pathname}${location.search}${location.hash}`;
    return <Navigate to="/login" replace state={{ from } satisfies LoginLocationState} />;
  }

  return <Outlet />;
}
