import { LeadStatus, PublishStatus } from '../../generated/prisma/client.js';
import { notDeleted } from '../../lib/db-helpers.js';
import { prisma } from '../../lib/prisma.js';
import type {
  ActivityItem,
  ActivityQuery,
  DashboardSummary,
  LeadsChart,
  LeadsChartQuery,
  TopProject,
  TopProjectsQuery,
} from './dashboard.types.js';

const DAY_MS = 24 * 60 * 60 * 1000;
/** Reports are bucketed by Saudi calendar days (UTC+3, no DST). */
const TIME_ZONE = 'Asia/Riyadh';
const TZ_OFFSET_MS = 3 * 60 * 60 * 1000;
/** Setting groups edited on the admin "Global content" page. */
const CONTENT_SETTING_GROUPS = new Set(['navigation', 'forms', 'global', 'headers']);
/** `updatedAt` within this of `createdAt` counts as the creation itself. */
const CREATED_TOLERANCE_MS = 2000;

const daysAgo = (days: number) => new Date(Date.now() - days * DAY_MS);

/** `YYYY-MM-DD` of `date` in the reporting time zone. */
const localDay = (date: Date) => new Date(date.getTime() + TZ_OFFSET_MS).toISOString().slice(0, 10);

/** UTC instant of local midnight `offsetDays` from today (0 = today). */
function localMidnight(offsetDays: number) {
  const today = localDay(new Date());
  return new Date(Date.parse(`${today}T00:00:00Z`) - TZ_OFFSET_MS + offsetDays * DAY_MS);
}

async function publishCounts(
  model: 'service' | 'page',
): Promise<{ total: number; published: number }> {
  const delegate = prisma[model] as unknown as {
    count: (args: { where: object }) => Promise<number>;
  };
  const [total, published] = await Promise.all([
    delegate.count({ where: notDeleted }),
    delegate.count({ where: { ...notDeleted, status: PublishStatus.PUBLISHED } }),
  ]);
  return { total, published };
}

export async function summary({
  includeLeads,
}: {
  includeLeads: boolean;
}): Promise<DashboardSummary> {
  const [projectTotal, projectPublished, projectFeatured, services, pages, leadGroups, recent] =
    await Promise.all([
      prisma.project.count({ where: notDeleted }),
      prisma.project.count({ where: { ...notDeleted, publishStatus: PublishStatus.PUBLISHED } }),
      prisma.project.count({ where: { ...notDeleted, featured: true } }),
      publishCounts('service'),
      publishCounts('page'),
      includeLeads
        ? prisma.lead.groupBy({
            by: ['status'],
            where: notDeleted,
            orderBy: { status: 'asc' },
            _count: { _all: true },
          })
        : null,
      includeLeads
        ? prisma.lead.count({ where: { ...notDeleted, createdAt: { gte: daysAgo(7) } } })
        : 0,
    ]);

  let leads: DashboardSummary['leads'] = null;
  if (leadGroups) {
    const count = (status: LeadStatus) => {
      const group = leadGroups.find((g) => g.status === status);
      return typeof group?._count === 'object' ? (group._count._all ?? 0) : 0;
    };
    leads = {
      new: count(LeadStatus.NEW),
      contacted: count(LeadStatus.CONTACTED),
      qualified: count(LeadStatus.QUALIFIED),
      converted: count(LeadStatus.CONVERTED),
      lost: count(LeadStatus.LOST),
      total: 0,
      recent,
    };
    leads.total = leads.new + leads.contacted + leads.qualified + leads.converted + leads.lost;
  }

  return {
    projects: { total: projectTotal, published: projectPublished, featured: projectFeatured },
    services,
    pages,
    leads,
  };
}

export async function leadsChart({ days }: LeadsChartQuery): Promise<LeadsChart> {
  const start = localMidnight(-(days - 1));
  const previousStart = new Date(start.getTime() - days * DAY_MS);

  const [rows, previousTotal] = await Promise.all([
    prisma.lead.findMany({
      where: { ...notDeleted, createdAt: { gte: start } },
      select: { createdAt: true, status: true },
    }),
    prisma.lead.count({ where: { ...notDeleted, createdAt: { gte: previousStart, lt: start } } }),
  ]);

  const series = Array.from({ length: days }, (_, i) => ({
    date: localDay(new Date(start.getTime() + i * DAY_MS)),
    total: 0,
    converted: 0,
  }));
  const byDate = new Map(series.map((point) => [point.date, point]));
  for (const row of rows) {
    const point = byDate.get(localDay(row.createdAt));
    if (!point) continue;
    point.total += 1;
    if (row.status === LeadStatus.CONVERTED) point.converted += 1;
  }

  return {
    days,
    timeZone: TIME_ZONE,
    series,
    total: rows.length,
    converted: series.reduce((sum, point) => sum + point.converted, 0),
    previousTotal,
  };
}

export async function topProjects({ limit, days }: TopProjectsQuery): Promise<TopProject[]> {
  const where = {
    ...notDeleted,
    projectId: { not: null },
    project: { deletedAt: null },
    ...(days && { createdAt: { gte: daysAgo(days) } }),
  };
  const ranked = await prisma.lead.groupBy({
    by: ['projectId'],
    where,
    orderBy: { _count: { projectId: 'desc' } },
    take: limit,
    _count: { projectId: true },
  });
  const ids = ranked.map((r) => r.projectId).filter((id): id is string => id !== null);
  if (ids.length === 0) return [];

  const [projects, converted] = await Promise.all([
    prisma.project.findMany({
      where: { id: { in: ids } },
      select: { id: true, slug: true, titleAr: true, titleEn: true, publishStatus: true },
    }),
    prisma.lead.groupBy({
      by: ['projectId'],
      where: { ...where, projectId: { in: ids }, status: LeadStatus.CONVERTED },
      orderBy: { projectId: 'asc' },
      _count: { projectId: true },
    }),
  ]);

  const countOf = (group: { _count?: unknown } | undefined) => {
    const c = group?._count;
    return typeof c === 'object' && c !== null ? ((c as { projectId?: number }).projectId ?? 0) : 0;
  };

  return ranked.flatMap((row) => {
    const project = projects.find((p) => p.id === row.projectId);
    if (!project) return [];
    return [
      {
        ...project,
        leads: countOf(row),
        converted: countOf(converted.find((c) => c.projectId === row.projectId)),
      },
    ];
  });
}

const actionOf = (createdAt: Date, updatedAt: Date): ActivityItem['action'] =>
  updatedAt.getTime() - createdAt.getTime() <= CREATED_TOLERANCE_MS ? 'created' : 'updated';

/**
 * Recent changes across the CMS, newest first, derived from each record's `createdAt`/`updatedAt`
 * (the latest change per record) so every role gets it; the full history is the audit log.
 * Without `includeSettings`, only Global Content settings are listed.
 */
export async function activity(
  { limit }: ActivityQuery,
  { includeLeads, includeSettings }: { includeLeads: boolean; includeSettings: boolean },
): Promise<ActivityItem[]> {
  const recent = { where: notDeleted, orderBy: { updatedAt: 'desc' as const }, take: limit };
  const stamps = { createdAt: true, updatedAt: true } as const;

  const [leads, projects, services, pages, partners, team, media, setting] = await Promise.all([
    includeLeads
      ? prisma.lead.findMany({
          ...recent,
          select: {
            ...stamps,
            id: true,
            name: true,
            status: true,
            project: { select: { titleAr: true } },
          },
        })
      : [],
    prisma.project.findMany({
      ...recent,
      select: { ...stamps, id: true, titleAr: true, publishStatus: true },
    }),
    prisma.service.findMany({
      ...recent,
      select: { ...stamps, id: true, titleAr: true, status: true },
    }),
    prisma.page.findMany({
      ...recent,
      select: { ...stamps, id: true, slug: true, titleAr: true, status: true },
    }),
    prisma.partner.findMany({ ...recent, select: { ...stamps, id: true, nameAr: true } }),
    prisma.teamMember.findMany({ ...recent, select: { ...stamps, id: true, nameAr: true } }),
    prisma.media.findMany({
      where: notDeleted,
      orderBy: { createdAt: 'desc' },
      take: limit,
      select: {
        id: true,
        createdAt: true,
        originalName: true,
        uploadedBy: { select: { name: true } },
      },
    }),
    prisma.setting.findFirst({
      where: {
        updatedAt: { gt: prisma.setting.fields.createdAt },
        ...(!includeSettings && { group: { in: [...CONTENT_SETTING_GROUPS] } }),
      },
      orderBy: { updatedAt: 'desc' },
      select: { id: true, key: true, group: true, updatedAt: true },
    }),
  ]);

  const items: ActivityItem[] = [
    ...leads.map((l) => ({
      id: `lead:${l.id}`,
      type: 'lead' as const,
      action: actionOf(l.createdAt, l.updatedAt),
      title: l.name,
      detail: l.project?.titleAr ?? null,
      status: l.status,
      href: `/leads?lead=${l.id}`,
      at: l.updatedAt,
    })),
    ...projects.map((p) => ({
      id: `project:${p.id}`,
      type: 'project' as const,
      action: actionOf(p.createdAt, p.updatedAt),
      title: p.titleAr,
      detail: null,
      status: p.publishStatus,
      href: `/projects/${p.id}`,
      at: p.updatedAt,
    })),
    ...services.map((s) => ({
      id: `service:${s.id}`,
      type: 'service' as const,
      action: actionOf(s.createdAt, s.updatedAt),
      title: s.titleAr,
      detail: null,
      status: s.status,
      href: `/services/${s.id}`,
      at: s.updatedAt,
    })),
    ...pages.map((p) => ({
      id: `page:${p.id}`,
      type: 'page' as const,
      action: actionOf(p.createdAt, p.updatedAt),
      title: p.titleAr,
      detail: null,
      status: p.status,
      href: `/pages/${p.slug}`,
      at: p.updatedAt,
    })),
    ...partners.map((p) => ({
      id: `partner:${p.id}`,
      type: 'partner' as const,
      action: actionOf(p.createdAt, p.updatedAt),
      title: p.nameAr,
      detail: null,
      status: null,
      href: `/partners/${p.id}`,
      at: p.updatedAt,
    })),
    ...team.map((m) => ({
      id: `team:${m.id}`,
      type: 'team' as const,
      action: actionOf(m.createdAt, m.updatedAt),
      title: m.nameAr,
      detail: null,
      status: null,
      href: `/team/${m.id}`,
      at: m.updatedAt,
    })),
    ...media.map((m) => ({
      id: `media:${m.id}`,
      type: 'media' as const,
      action: 'created' as const,
      title: m.originalName,
      detail: m.uploadedBy?.name ?? null,
      status: null,
      href: '/media',
      at: m.createdAt,
    })),
    ...(setting
      ? [
          {
            id: `settings:${setting.id}`,
            type: 'settings' as const,
            action: 'updated' as const,
            title: setting.key,
            detail: setting.group,
            status: null,
            href: CONTENT_SETTING_GROUPS.has(setting.group) ? '/settings/content' : '/settings',
            at: setting.updatedAt,
          },
        ]
      : []),
  ];

  return items.sort((a, b) => b.at.getTime() - a.at.getTime()).slice(0, limit);
}
