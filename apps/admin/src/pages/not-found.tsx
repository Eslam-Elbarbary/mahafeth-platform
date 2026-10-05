import { Link, useLocation } from 'react-router';

import { Button } from '@/components/ui/button';

export default function NotFoundPage() {
  const { pathname } = useLocation();
  return (
    <div className="flex min-h-[60svh] flex-col items-center justify-center gap-4 text-center">
      <p className="text-5xl font-bold">404</p>
      <p className="text-muted-foreground">الصفحة المطلوبة غير موجودة.</p>
      <code className="rounded-md bg-muted px-2 py-1 text-xs" dir="ltr">
        {pathname}
      </code>
      <Button asChild variant="outline">
        <Link to="/">العودة إلى لوحة التحكم</Link>
      </Button>
    </div>
  );
}
