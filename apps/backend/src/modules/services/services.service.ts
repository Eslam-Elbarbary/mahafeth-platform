import { type Prisma, PublishStatus } from '../../generated/prisma/client.js';
import { archivedSlug, notDeleted, reorder as applyOrder } from '../../lib/db-helpers.js';
import { badRequest, notFound } from '../../lib/http-error.js';
import { pageArgs, paginated } from '../../lib/pagination.js';
import { prisma } from '../../lib/prisma.js';
import type { ReorderInput } from '../../lib/schemas.js';
import { audit } from '../audit/audit.service.js';
import { mediaSummarySelect } from '../media/media.service.js';
import type {
  CreateServiceInput,
  ListServicesQuery,
  UpdateServiceInput,
} from './services.types.js';

const include = { image: { select: mediaSummarySelect } } as const satisfies Prisma.ServiceInclude;
const orderBy: Prisma.ServiceOrderByWithRelationInput[] = [{ order: 'asc' }, { createdAt: 'asc' }];

export function listPublished() {
  return prisma.service.findMany({
    where: { status: PublishStatus.PUBLISHED, ...notDeleted },
    include,
    orderBy,
  });
}

export async function getPublishedBySlug(slug: string) {
  const service = await prisma.service.findFirst({
    where: { slug, status: PublishStatus.PUBLISHED, ...notDeleted },
    include,
  });
  if (!service) throw notFound('Service');
  return service;
}

export async function list(query: ListServicesQuery) {
  const where: Prisma.ServiceWhereInput = {
    ...notDeleted,
    ...(query.status && { status: query.status }),
    ...(query.q && {
      OR: [
        { slug: { contains: query.q } },
        { titleAr: { contains: query.q } },
        { titleEn: { contains: query.q } },
      ],
    }),
  };
  const [items, total] = await prisma.$transaction([
    prisma.service.findMany({ where, include, orderBy, ...pageArgs(query) }),
    prisma.service.count({ where }),
  ]);
  return paginated(items, total, query);
}

export async function getById(id: string) {
  const service = await prisma.service.findFirst({ where: { id, ...notDeleted }, include });
  if (!service) throw notFound('Service');
  return service;
}

const auditTarget = (service: { id: string; titleAr: string }) => ({
  entity: 'services' as const,
  id: service.id,
  label: service.titleAr,
  omit: ['image', 'deletedAt'],
});

export async function create(input: CreateServiceInput) {
  const service = await prisma.service.create({ data: input, include });
  await audit.created(auditTarget(service), service);
  return service;
}

export async function update(id: string, input: UpdateServiceInput) {
  const before = await getById(id);
  const service = await prisma.service.update({ where: { id }, data: input, include });
  await audit.updated(auditTarget(service), before, service);
  return service;
}

export async function remove(id: string) {
  const service = await getById(id);
  await prisma.service.update({
    where: { id },
    data: { deletedAt: new Date(), slug: archivedSlug(service.slug, id) },
  });
  await audit.deleted(auditTarget(service), service);
}

export async function reorder(input: ReorderInput) {
  const ids = input.items.map((item) => item.id);
  const before = await prisma.service.findMany({
    where: { id: { in: ids }, ...notDeleted },
    select: { id: true, titleAr: true, order: true },
  });
  if (before.length !== ids.length) throw badRequest('Unknown service in reorder list');
  await applyOrder(prisma.service, input);
  await audit.reordered(
    'services',
    before.map((s) => ({ id: s.id, label: s.titleAr, order: s.order })),
    input.items,
  );
}
