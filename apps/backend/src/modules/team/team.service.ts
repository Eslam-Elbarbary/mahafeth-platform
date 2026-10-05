import type { Prisma } from '../../generated/prisma/client.js';
import { notDeleted, reorder as applyOrder } from '../../lib/db-helpers.js';
import { notFound } from '../../lib/http-error.js';
import { pageArgs, paginated } from '../../lib/pagination.js';
import { prisma } from '../../lib/prisma.js';
import type { ReorderInput } from '../../lib/schemas.js';
import { audit } from '../audit/audit.service.js';
import { mediaSummarySelect } from '../media/media.service.js';
import type { CreateTeamMemberInput, ListTeamQuery, UpdateTeamMemberInput } from './team.types.js';

const include = {
  photo: { select: mediaSummarySelect },
} as const satisfies Prisma.TeamMemberInclude;
const orderBy: Prisma.TeamMemberOrderByWithRelationInput[] = [
  { order: 'asc' },
  { createdAt: 'asc' },
];

export function listVisible() {
  return prisma.teamMember.findMany({ where: { visible: true, ...notDeleted }, include, orderBy });
}

export async function list(query: ListTeamQuery) {
  const where: Prisma.TeamMemberWhereInput = {
    ...notDeleted,
    ...(query.visible !== undefined && { visible: query.visible }),
    ...(query.q && {
      OR: [
        { nameAr: { contains: query.q } },
        { nameEn: { contains: query.q } },
        { positionAr: { contains: query.q } },
        { positionEn: { contains: query.q } },
      ],
    }),
  };
  const [items, total] = await prisma.$transaction([
    prisma.teamMember.findMany({ where, include, orderBy, ...pageArgs(query) }),
    prisma.teamMember.count({ where }),
  ]);
  return paginated(items, total, query);
}

export async function getById(id: string) {
  const member = await prisma.teamMember.findFirst({ where: { id, ...notDeleted }, include });
  if (!member) throw notFound('Team member');
  return member;
}

const auditTarget = (member: { id: string; nameAr: string }) => ({
  entity: 'team' as const,
  id: member.id,
  label: member.nameAr,
  omit: ['photo', 'deletedAt'],
});

export async function create(input: CreateTeamMemberInput) {
  const member = await prisma.teamMember.create({ data: input, include });
  await audit.created(auditTarget(member), member);
  return member;
}

export async function update(id: string, input: UpdateTeamMemberInput) {
  const before = await getById(id);
  const member = await prisma.teamMember.update({ where: { id }, data: input, include });
  await audit.updated(auditTarget(member), before, member);
  return member;
}

export async function remove(id: string) {
  const member = await getById(id);
  await prisma.teamMember.update({ where: { id }, data: { deletedAt: new Date() } });
  await audit.deleted(auditTarget(member), member);
}

export async function reorder(input: ReorderInput) {
  const before = await prisma.teamMember.findMany({
    where: { id: { in: input.items.map((item) => item.id) }, ...notDeleted },
    select: { id: true, nameAr: true, order: true },
  });
  await applyOrder(prisma.teamMember, input);
  await audit.reordered(
    'team',
    before.map((m) => ({ id: m.id, label: m.nameAr, order: m.order })),
    input.items,
  );
}
