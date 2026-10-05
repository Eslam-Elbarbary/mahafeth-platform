import { Construction } from 'lucide-react';

import { EmptyState, PageHeader } from '@/components/layout/page-header';

/* Scaffold-only screen body; each page replaces it when its module is built. */
export function PagePlaceholder({ title, description }: { title: string; description: string }) {
  return (
    <div className="grid gap-6">
      <PageHeader title={title} description={description} />
      <EmptyState
        icon={<Construction />}
        title="هذه الوحدة قيد الإعداد"
        description="ستتوفر إدارة هذا القسم في مرحلة قادمة."
      />
    </div>
  );
}
