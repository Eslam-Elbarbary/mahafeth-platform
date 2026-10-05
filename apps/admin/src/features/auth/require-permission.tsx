import { ShieldAlert } from 'lucide-react';
import type { ReactNode } from 'react';
import { Link } from 'react-router';

import { EmptyState } from '@/components/layout/page-header';
import { Button } from '@/components/ui/button';

import { useCan } from './auth-context';
import type { Action, Resource } from './types';

/** Renders `children` only for roles allowed to `action` the resource; others get a notice. */
export function RequirePermission({
  resource,
  action = 'read',
  children,
}: {
  resource: Resource;
  action?: Action;
  children: ReactNode;
}) {
  const can = useCan();
  if (can(resource, action)) return children;
  return (
    <EmptyState
      icon={<ShieldAlert />}
      title="لا تملك صلاحية الوصول إلى هذه الصفحة"
      description="صلاحيات دورك لا تشمل هذا القسم. تواصل مع المدير العام إذا كنت تحتاج إليه."
      action={
        <Button asChild variant="outline">
          <Link to="/">العودة إلى لوحة المعلومات</Link>
        </Button>
      }
    />
  );
}
