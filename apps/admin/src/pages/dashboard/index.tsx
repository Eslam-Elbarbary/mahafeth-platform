import {
  BriefcaseBusiness,
  Building2,
  CircleCheck,
  ExternalLink,
  Eye,
  FileText,
  ImageUp,
  Inbox,
  Languages,
  PhoneCall,
  Plus,
  RefreshCw,
  Sparkles,
  Star,
  UserCog,
} from 'lucide-react';
import { type ReactNode, useState } from 'react';
import { Link } from 'react-router';

import { PageHeader } from '@/components/layout/page-header';
import { StatCard } from '@/components/layout/stat-card';
import { Button } from '@/components/ui/button';
import { Section } from '@/components/ui/form-controls';
import { useAuth, useCan } from '@/features/auth/auth-context';
import { ActivityTimeline } from '@/features/dashboard/activity-timeline';
import { dashboardApi } from '@/features/dashboard/api';
import { type ChartPeriod, LeadsChart } from '@/features/dashboard/leads-chart';
import { TopProjectsChart } from '@/features/dashboard/top-projects-chart';
import { env } from '@/lib/env';
import { formatNumber } from '@/lib/format';
import { describeApiError, useApiQuery } from '@/lib/use-api-query';

function QuickActions({ newLeads }: { newLeads?: number }) {
  const can = useCan();
  const actions: Array<{ to: string; icon: ReactNode; label: string; allowed: boolean }> = [
    {
      to: '/projects/new',
      icon: <Plus />,
      label: 'مشروع جديد',
      allowed: can('projects', 'create'),
    },
    {
      to: '/services/new',
      icon: <BriefcaseBusiness />,
      label: 'خدمة جديدة',
      allowed: can('services', 'create'),
    },
    { to: '/media', icon: <ImageUp />, label: 'رفع وسائط', allowed: can('media', 'create') },
    { to: '/pages', icon: <FileText />, label: 'صفحات الموقع', allowed: can('pages') },
    {
      to: '/settings/content',
      icon: <Languages />,
      label: 'المحتوى العام',
      allowed: can('pages', 'update'),
    },
    {
      to: '/leads?status=NEW',
      icon: <Inbox />,
      label:
        newLeads !== undefined && newLeads > 0
          ? `الطلبات الجديدة (${formatNumber(newLeads)})`
          : 'الطلبات الجديدة',
      allowed: can('leads'),
    },
    { to: '/users', icon: <UserCog />, label: 'إدارة المستخدمين', allowed: can('users') },
  ].filter((action) => action.allowed);
  return (
    <Section title="إجراءات سريعة" description="اختصارات لأكثر المهام استخدامًا.">
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
        {actions.map((action) => (
          <Button key={action.to} asChild variant="outline" className="justify-start">
            <Link to={action.to}>
              {action.icon}
              {action.label}
            </Link>
          </Button>
        ))}
        <Button asChild variant="outline" className="justify-start">
          <a href={`${env.siteUrl}/ar`} target="_blank" rel="noreferrer">
            <ExternalLink /> عرض الموقع
          </a>
        </Button>
      </div>
    </Section>
  );
}

export default function DashboardPage() {
  const { user } = useAuth();
  const canSeeLeads = useCan()('leads');
  const [refreshKey, setRefreshKey] = useState(0);
  const [days, setDays] = useState<ChartPeriod>(30);
  const { data: summary, error } = useApiQuery(`dashboard-summary|${refreshKey}`, () =>
    dashboardApi.summary(),
  );
  const leads = summary?.leads;
  const leadValue = (pick: (l: NonNullable<typeof leads>) => number) =>
    leads ? pick(leads) : undefined;

  return (
    <div className="grid gap-6">
      <PageHeader
        title="لوحة المعلومات"
        description={user ? `مرحبًا ${user.name}، هذه نظرة عامة على المحتوى والطلبات.` : undefined}
        actions={
          <Button variant="outline" size="sm" onClick={() => setRefreshKey((k) => k + 1)}>
            <RefreshCw /> تحديث
          </Button>
        }
      />

      {error && (
        <p className="rounded-lg bg-destructive/5 p-3 text-sm text-destructive">
          {describeApiError(error)}
        </p>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        <StatCard
          icon={<Building2 />}
          label="إجمالي المشاريع"
          value={summary?.projects.total}
          to="/projects"
        />
        <StatCard
          icon={<Eye />}
          label="مشاريع منشورة"
          value={summary?.projects.published}
          to="/projects?publish=PUBLISHED"
        />
        <StatCard
          icon={<Star />}
          label="مشاريع مميزة"
          value={summary?.projects.featured}
          to="/projects?featured=true"
        />
        <StatCard
          icon={<BriefcaseBusiness />}
          label="الخدمات"
          value={summary?.services.total}
          hint={summary && `${formatNumber(summary.services.published)} منشورة`}
          to="/services"
        />
        <StatCard
          icon={<FileText />}
          label="صفحات الموقع"
          value={summary?.pages.total}
          hint={summary && `${formatNumber(summary.pages.published)} منشورة`}
          to="/pages"
        />
      </div>

      {canSeeLeads && (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            icon={<Inbox />}
            label="إجمالي الطلبات"
            value={leadValue((l) => l.total)}
            hint={leads && `${formatNumber(leads.recent)} خلال آخر 7 أيام`}
            to="/leads"
          />
          <StatCard
            icon={<Sparkles />}
            label="طلبات جديدة"
            value={leadValue((l) => l.new)}
            hint="بانتظار التواصل"
            to="/leads?status=NEW"
          />
          <StatCard
            icon={<PhoneCall />}
            label="تم التواصل"
            value={leadValue((l) => l.contacted)}
            hint={leads && `${formatNumber(leads.qualified)} مؤهل`}
            to="/leads?status=CONTACTED"
          />
          <StatCard
            icon={<CircleCheck />}
            label="تم تحويلها"
            value={leadValue((l) => l.converted)}
            hint={
              leads && leads.total > 0
                ? `نسبة التحويل ${formatNumber(Math.round((leads.converted / leads.total) * 100))}%`
                : undefined
            }
            to="/leads?status=CONVERTED"
          />
        </div>
      )}

      <div key={refreshKey} className="grid gap-6 lg:grid-cols-3">
        {canSeeLeads && (
          <>
            <LeadsChart days={days} onDaysChange={setDays} className="lg:col-span-2" />
            <TopProjectsChart days={days} />
          </>
        )}
        <ActivityTimeline className="lg:col-span-2" />
        <QuickActions newLeads={leads?.new} />
      </div>
    </div>
  );
}
