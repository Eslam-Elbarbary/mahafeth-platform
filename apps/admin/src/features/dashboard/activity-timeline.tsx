import {
  BriefcaseBusiness,
  Building2,
  FileText,
  Handshake,
  History,
  Images,
  Inbox,
  Settings,
  Users,
  type LucideIcon,
} from 'lucide-react';
import { Link } from 'react-router';

import { EmptyState, Skeleton } from '@/components/layout/page-header';
import { Button } from '@/components/ui/button';
import { Section } from '@/components/ui/form-controls';
import { useCan } from '@/features/auth/auth-context';
import { LeadStatusBadge } from '@/features/leads/lead-badges';
import { LEAD_STATUSES, type LeadStatus } from '@/features/leads/types';
import { PublishBadge } from '@/features/projects/project-badges';
import type { PublishStatus } from '@/features/projects/types';
import { formatDateTime, formatRelative } from '@/lib/format';
import { describeApiError, useApiQuery } from '@/lib/use-api-query';

import { dashboardApi } from './api';
import type { ActivityItem, ActivityType } from './types';

const LIMIT = 12;

const typeMeta: Record<ActivityType, { icon: LucideIcon; created: string; updated: string }> = {
  lead: { icon: Inbox, created: 'طلب اهتمام جديد', updated: 'تحديث طلب اهتمام' },
  project: { icon: Building2, created: 'إضافة مشروع', updated: 'تحديث مشروع' },
  service: { icon: BriefcaseBusiness, created: 'إضافة خدمة', updated: 'تحديث خدمة' },
  page: { icon: FileText, created: 'إضافة صفحة', updated: 'تحديث صفحة' },
  partner: { icon: Handshake, created: 'إضافة شريك', updated: 'تحديث شريك' },
  team: { icon: Users, created: 'إضافة عضو للفريق', updated: 'تحديث عضو الفريق' },
  media: { icon: Images, created: 'رفع ملف وسائط', updated: 'تحديث ملف وسائط' },
  settings: { icon: Settings, created: 'تحديث الإعدادات', updated: 'تحديث الإعدادات' },
};

function StatusBadge({ item }: { item: ActivityItem }) {
  if (!item.status) return null;
  if (item.type === 'lead' && LEAD_STATUSES.includes(item.status as LeadStatus)) {
    return <LeadStatusBadge status={item.status as LeadStatus} />;
  }
  return <PublishBadge status={item.status as PublishStatus} />;
}

function detailOf(item: ActivityItem) {
  if (item.type === 'settings') return item.href === '/settings/content' ? 'المحتوى العام' : null;
  if (item.type === 'media' && item.detail) return `بواسطة ${item.detail}`;
  return item.detail;
}

/**
 * Latest CMS changes derived from record timestamps (available to every role); super admins get a
 * link to the full audit log.
 */
export function ActivityTimeline({ className }: { className?: string }) {
  const { data, error } = useApiQuery('dashboard-activity', () => dashboardApi.activity(LIMIT));
  const canSeeLog = useCan()('auditLogs');

  return (
    <Section
      title="آخر النشاطات"
      description="أحدث الإضافات والتعديلات على المحتوى والطلبات."
      className={className}
      actions={
        canSeeLog && (
          <Button asChild variant="ghost" size="sm">
            <Link to="/audit-logs">
              <History /> السجل الكامل
            </Link>
          </Button>
        )
      }
    >
      {error && !data ? (
        <p className="text-sm text-destructive">{describeApiError(error)}</p>
      ) : !data ? (
        <div className="grid gap-4">
          {Array.from({ length: 5 }, (_, i) => (
            <Skeleton key={i} className="h-11 w-full" />
          ))}
        </div>
      ) : data.length === 0 ? (
        <EmptyState icon={<History />} title="لا توجد نشاطات بعد" />
      ) : (
        <ol className="relative grid gap-1">
          <span aria-hidden className="absolute inset-y-4 start-5 w-px bg-border" />
          {data.map((item) => {
            const meta = typeMeta[item.type];
            const Icon = meta.icon;
            const detail = detailOf(item);
            return (
              <li key={item.id} data-activity={item.type}>
                <Link
                  to={item.href}
                  className="relative flex items-start gap-3 rounded-lg p-1.5 transition-colors hover:bg-muted/50"
                >
                  <span className="relative z-10 flex size-7 shrink-0 items-center justify-center rounded-full border bg-background text-primary [&_svg]:size-3.5">
                    <Icon />
                  </span>
                  <span className="grid min-w-0 flex-1 gap-0.5">
                    <span className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
                      <span className="text-muted-foreground">{meta[item.action]}</span>
                      <span className="truncate font-medium">{item.title}</span>
                      <StatusBadge item={item} />
                    </span>
                    {detail && (
                      <span className="truncate text-xs text-muted-foreground">{detail}</span>
                    )}
                  </span>
                  <time
                    dateTime={item.at}
                    title={formatDateTime(item.at)}
                    className="shrink-0 pt-0.5 text-xs whitespace-nowrap text-muted-foreground"
                  >
                    {formatRelative(item.at)}
                  </time>
                </Link>
              </li>
            );
          })}
        </ol>
      )}
    </Section>
  );
}
