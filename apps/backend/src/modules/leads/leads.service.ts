import { randomUUID } from 'node:crypto';

import { LeadStatus, type Prisma } from '../../generated/prisma/client.js';
import { notDeleted } from '../../lib/db-helpers.js';
import { badRequest, notFound } from '../../lib/http-error.js';
import { pageArgs, paginated } from '../../lib/pagination.js';
import { prisma } from '../../lib/prisma.js';
import { audit } from '../audit/audit.service.js';
import type {
  LeadRequestMeta,
  LeadStats,
  ListLeadsQuery,
  SubmitLeadInput,
  UpdateLeadInput,
} from './leads.types.js';

const include = {
  project: { select: { id: true, slug: true, titleAr: true, titleEn: true } },
  assignedTo: { select: { id: true, name: true, email: true } },
} as const satisfies Prisma.LeadInclude;

const RECENT_DAYS = 7;

const activeUserWhere = { isActive: true, ...notDeleted } satisfies Prisma.UserWhereInput;

/** Related names are kept (readable history); their ids and request metadata are left out. */
const auditTarget = (lead: { id: string; name: string }) => ({
  entity: 'leads' as const,
  id: lead.id,
  label: lead.name,
  omit: ['projectId', 'assignedToId', 'ipAddress', 'userAgent', 'deletedAt'],
});

export async function submit(input: SubmitLeadInput, meta: LeadRequestMeta) {
  const { website, projectSlug, ...fields } = input;

  // Bots get a normal-looking response so they cannot tell they were filtered.
  if (website) return { id: randomUUID(), createdAt: new Date() };

  let projectId: string | null = null;
  if (fields.projectId) {
    const project = await prisma.project.findFirst({
      where: { id: fields.projectId, ...notDeleted },
      select: { id: true },
    });
    if (!project) throw badRequest('Unknown project');
    projectId = project.id;
  } else if (projectSlug) {
    const project = await prisma.project.findFirst({
      where: { slug: projectSlug, ...notDeleted },
      select: { id: true },
    });
    projectId = project?.id ?? null;
  }

  const lead = await prisma.lead.create({
    data: {
      ...fields,
      projectId,
      status: LeadStatus.NEW,
      ipAddress: meta.ipAddress,
      userAgent: meta.userAgent?.slice(0, 500) ?? null,
    },
    include,
  });
  await audit.created(auditTarget(lead), lead);
  return { id: lead.id, createdAt: lead.createdAt };
}

export async function list(query: ListLeadsQuery) {
  const where: Prisma.LeadWhereInput = {
    ...notDeleted,
    ...(query.status && { status: query.status }),
    ...(query.source && { source: query.source }),
    ...(query.interestType && { interestType: query.interestType }),
    ...(query.city && { city: query.city }),
    ...(query.projectId && { projectId: query.projectId }),
    ...(query.assignedToId && { assignedToId: query.assignedToId }),
    ...((query.from || query.to) && {
      createdAt: { ...(query.from && { gte: query.from }), ...(query.to && { lte: query.to }) },
    }),
    ...(query.q && {
      OR: [
        { name: { contains: query.q } },
        { phone: { contains: query.q } },
        { email: { contains: query.q } },
        { city: { contains: query.q } },
      ],
    }),
  };
  const [items, total] = await prisma.$transaction([
    prisma.lead.findMany({ where, include, orderBy: { createdAt: 'desc' }, ...pageArgs(query) }),
    prisma.lead.count({ where }),
  ]);
  return paginated(items, total, query);
}

export async function stats(): Promise<LeadStats> {
  const since = new Date(Date.now() - RECENT_DAYS * 24 * 60 * 60 * 1000);
  const [groups, recent] = await prisma.$transaction([
    prisma.lead.groupBy({
      by: ['status'],
      where: notDeleted,
      orderBy: { status: 'asc' },
      _count: { _all: true },
    }),
    prisma.lead.count({ where: { ...notDeleted, createdAt: { gte: since } } }),
  ]);

  const byStatus = Object.fromEntries(Object.values(LeadStatus).map((s) => [s, 0])) as Record<
    LeadStatus,
    number
  >;
  for (const group of groups) {
    byStatus[group.status] = typeof group._count === 'object' ? (group._count._all ?? 0) : 0;
  }
  const total = Object.values(byStatus).reduce((sum, n) => sum + n, 0);
  return { total, recent, byStatus };
}

/** Users a lead can be assigned to. */
export function assignees() {
  return prisma.user.findMany({
    where: activeUserWhere,
    select: { id: true, name: true, email: true },
    orderBy: { name: 'asc' },
  });
}

export async function getById(id: string) {
  const lead = await prisma.lead.findFirst({ where: { id, ...notDeleted }, include });
  if (!lead) throw notFound('Lead');
  return lead;
}

export async function update(id: string, input: UpdateLeadInput) {
  const before = await getById(id);
  if (input.assignedToId) {
    const user = await prisma.user.findFirst({
      where: { id: input.assignedToId, ...activeUserWhere },
      select: { id: true },
    });
    if (!user) throw badRequest('Unknown user');
  }
  const lead = await prisma.lead.update({ where: { id }, data: input, include });
  await audit.updated(auditTarget(lead), before, lead);
  return lead;
}

export async function remove(id: string) {
  const lead = await getById(id);
  await prisma.lead.update({ where: { id }, data: { deletedAt: new Date() } });
  await audit.deleted(auditTarget(lead), lead);
}
