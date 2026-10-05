import type { Prisma } from '../../generated/prisma/client.js';
import { notDeleted, reorder as applyOrder } from '../../lib/db-helpers.js';
import { notFound } from '../../lib/http-error.js';
import { pageArgs, paginated } from '../../lib/pagination.js';
import { prisma } from '../../lib/prisma.js';
import type { ReorderInput } from '../../lib/schemas.js';
import { audit } from '../audit/audit.service.js';
import { mediaSummarySelect } from '../media/media.service.js';
import type {
  CreatePartnerInput,
  ListPartnersQuery,
  UpdatePartnerInput,
} from './partners.types.js';

const include = { logo: { select: mediaSummarySelect } } as const satisfies Prisma.PartnerInclude;
const orderBy: Prisma.PartnerOrderByWithRelationInput[] = [{ order: 'asc' }, { createdAt: 'asc' }];

export function listVisible() {
  return prisma.partner.findMany({ where: { visible: true, ...notDeleted }, include, orderBy });
}

export async function list(query: ListPartnersQuery) {
  const where: Prisma.PartnerWhereInput = {
    ...notDeleted,
    ...(query.visible !== undefined && { visible: query.visible }),
    ...(query.q && {
      OR: [{ nameAr: { contains: query.q } }, { nameEn: { contains: query.q } }],
    }),
  };
  const [items, total] = await prisma.$transaction([
    prisma.partner.findMany({ where, include, orderBy, ...pageArgs(query) }),
    prisma.partner.count({ where }),
  ]);
  return paginated(items, total, query);
}

export async function getById(id: string) {
  const partner = await prisma.partner.findFirst({ where: { id, ...notDeleted }, include });
  if (!partner) throw notFound('Partner');
  return partner;
}

const auditTarget = (partner: { id: string; nameAr: string }) => ({
  entity: 'partners' as const,
  id: partner.id,
  label: partner.nameAr,
  omit: ['logo', 'deletedAt'],
});

export async function create(input: CreatePartnerInput) {
  const partner = await prisma.partner.create({ data: input, include });
  await audit.created(auditTarget(partner), partner);
  return partner;
}

export async function update(id: string, input: UpdatePartnerInput) {
  const before = await getById(id);
  const partner = await prisma.partner.update({ where: { id }, data: input, include });
  await audit.updated(auditTarget(partner), before, partner);
  return partner;
}

export async function remove(id: string) {
  const partner = await getById(id);
  await prisma.partner.update({ where: { id }, data: { deletedAt: new Date() } });
  await audit.deleted(auditTarget(partner), partner);
}

export async function reorder(input: ReorderInput) {
  const before = await prisma.partner.findMany({
    where: { id: { in: input.items.map((item) => item.id) }, ...notDeleted },
    select: { id: true, nameAr: true, order: true },
  });
  await applyOrder(prisma.partner, input);
  await audit.reordered(
    'partners',
    before.map((p) => ({ id: p.id, label: p.nameAr, order: p.order })),
    input.items,
  );
}
