import { Suspense } from 'react';
import { Outlet } from 'react-router';

import { AppSidebar } from '@/components/layout/app-sidebar';
import { PageLoader } from '@/components/layout/full-screen-status';
import { SiteHeader } from '@/components/layout/site-header';

export function DashboardLayout() {
  return (
    <div className="flex min-h-svh bg-canvas">
      <AppSidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <SiteHeader />
        <main className="mx-auto w-full max-w-[1400px] flex-1 p-6 lg:p-8">
          <Suspense fallback={<PageLoader />}>
            <Outlet />
          </Suspense>
        </main>
      </div>
    </div>
  );
}
