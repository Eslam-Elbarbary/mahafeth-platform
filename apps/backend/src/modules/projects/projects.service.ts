import {
  AuditAction,
  type Prisma,
  ProjectImageCategory,
  PublishStatus,
} from '../../generated/prisma/client.js';
import {
  archivedSlug,
  notDeleted,
  reorder as applyOrder,
  shortId,
  toJson,
} from '../../lib/db-helpers.js';
import { badRequest, notFound } from '../../lib/http-error.js';
import { pageArgs, paginated } from '../../lib/pagination.js';
import { prisma } from '../../lib/prisma.js';
import type { ReorderInput } from '../../lib/schemas.js';
import { audit, diff, record } from '../audit/audit.service.js';
import type { AuditData } from '../audit/audit.types.js';
import { mediaSummarySelect } from '../media/media.service.js';
import type {
  AddProjectImageInput,
  AdminListProjectsQuery,
  CreateProjectInput,
  PublicListProjectsQuery,
  UpdateProjectImageInput,
  UpdateProjectInput,
} from './projects.types.js';

const listInclude = {
  coverImage: { select: mediaSummarySelect },
  // First COVER image, so cards have a cover even when `coverImageId` is not set.
  gallery: {
    where: { category: ProjectImageCategory.COVER },
    orderBy: { order: 'asc' },
    take: 1,
    include: { media: { select: mediaSummarySelect } },
  },
} as const satisfies Prisma.ProjectInclude;

const detailInclude = {
  coverImage: { select: mediaSummarySelect },
  // Enum order: COVER, GALLERY, FLOOR_PLAN — then the editor's order inside each category.
  gallery: {
    orderBy: [{ category: 'asc' }, { order: 'asc' }],
    include: { media: { select: mediaSummarySelect } },
  },
} as const satisfies Prisma.ProjectInclude;

const listOrder: Prisma.ProjectOrderByWithRelationInput[] = [
  { featured: 'desc' },
  { order: 'asc' },
  { createdAt: 'desc' },
];

type Geo = { latitude: Prisma.Decimal | null; longitude: Prisma.Decimal | null };

/** API shape: DECIMAL coordinates go out as JSON numbers instead of Prisma's decimal strings. */
function present<T extends Geo>(project: T) {
  return {
    ...project,
    latitude: project.latitude?.toNumber() ?? null,
    longitude: project.longitude?.toNumber() ?? null,
  };
}

/** Validated input → Prisma data (nullable JSON columns need `DbNull` to be cleared). */
function toData<T extends UpdateProjectInput>(input: T) {
  const { sizeRange, features, ...rest } = input;
  return { ...rest, sizeRange: toJson(sizeRange), features: toJson(features) };
}

// ─── Public ───────────────────────────────────────────────────────────────────

export async function listPublished(query: PublicListProjectsQuery) {
  const where: Prisma.ProjectWhereInput = {
    ...notDeleted,
    publishStatus: PublishStatus.PUBLISHED,
    ...(query.city && { city: query.city }),
    ...(query.status && { status: query.status }),
    ...(query.featured !== undefined && { featured: query.featured }),
  };
  const [items, total] = await prisma.$transaction([
    prisma.project.findMany({
      where,
      include: listInclude,
      orderBy: listOrder,
      ...pageArgs(query),
    }),
    prisma.project.count({ where }),
  ]);
  return paginated(items.map(present), total, query);
}

export async function getPublishedBySlug(slug: string) {
  const project = await prisma.project.findFirst({
    where: { slug, publishStatus: PublishStatus.PUBLISHED, ...notDeleted },
    include: detailInclude,
  });
  if (!project) throw notFound('Project');
  return present(project);
}

// ─── Admin ────────────────────────────────────────────────────────────────────

export async function list(query: AdminListProjectsQuery) {
  const where: Prisma.ProjectWhereInput = {
    ...notDeleted,
    ...(query.city && { city: query.city }),
    ...(query.status && { status: query.status }),
    ...(query.publishStatus && { publishStatus: query.publishStatus }),
    ...(query.featured !== undefined && { featured: query.featured }),
    ...(query.q && {
      OR: [
        { slug: { contains: query.q } },
        { titleAr: { contains: query.q } },
        { titleEn: { contains: query.q } },
      ],
    }),
  };
  const [items, total] = await prisma.$transaction([
    prisma.project.findMany({
      where,
      include: { ...listInclude, _count: { select: { gallery: true, leads: true } } },
      orderBy: listOrder,
      ...pageArgs(query),
    }),
    prisma.project.count({ where }),
  ]);
  return paginated(items.map(present), total, query);
}

async function findById(id: string) {
  const project = await prisma.project.findFirst({
    where: { id, ...notDeleted },
    include: detailInclude,
  });
  if (!project) throw notFound('Project');
  return project;
}

export async function getById(id: string) {
  return present(await findById(id));
}

const auditTarget = (project: { id: string; titleAr: string }) => ({
  entity: 'projects' as const,
  id: project.id,
  label: project.titleAr,
  omit: ['gallery', 'coverImage', 'deletedAt'],
});

export async function create(input: CreateProjectInput) {
  const project = await prisma.project.create({ data: toData(input), include: detailInclude });
  await audit.created(auditTarget(project), project);
  return present(project);
}

export async function update(id: string, input: UpdateProjectInput) {
  const before = await findById(id);
  const project = await prisma.project.update({
    where: { id },
    data: toData(input),
    include: detailInclude,
  });
  await audit.updated(auditTarget(project), before, project);
  return present(project);
}

export async function remove(id: string) {
  const project = await findById(id);
  await prisma.project.update({
    where: { id },
    data: { deletedAt: new Date(), slug: archivedSlug(project.slug, id) },
  });
  await audit.deleted(auditTarget(project), project);
}

export async function reorder(input: ReorderInput) {
  const ids = input.items.map((item) => item.id);
  const before = await prisma.project.findMany({
    where: { id: { in: ids }, ...notDeleted },
    select: { id: true, titleAr: true, order: true },
  });
  if (before.length !== ids.length) throw badRequest('Unknown project in reorder list');
  await applyOrder(prisma.project, input);
  await audit.reordered(
    'projects',
    before.map((p) => ({ id: p.id, label: p.titleAr, order: p.order })),
    input.items,
  );
}

// ─── Gallery ──────────────────────────────────────────────────────────────────

const imageInclude = { media: { select: mediaSummarySelect } } as const;

type GalleryImage = Prisma.ProjectImageGetPayload<{ include: typeof imageInclude }>;

/** Gallery changes are logged as updates of their project, under `gallery:<image short id>`. */
const imageKey = (image: { id: string }) => `gallery:${shortId(image.id)}`;

const imageSnapshot = (image: GalleryImage) => ({
  category: image.category,
  mediaId: image.mediaId,
  url: image.media.url,
  captionAr: image.captionAr,
  captionEn: image.captionEn,
  order: image.order,
});

function auditGallery(
  project: { id: string; titleAr: string },
  oldData: AuditData | null,
  newData: AuditData | null,
) {
  return record({
    action: AuditAction.UPDATE,
    entity: 'projects',
    entityId: project.id,
    entityLabel: project.titleAr,
    oldData,
    newData,
  });
}

async function getImage(projectId: string, imageId: string) {
  const image = await prisma.projectImage.findFirst({
    where: { id: imageId, projectId, project: notDeleted },
    include: { ...imageInclude, project: { select: { id: true, titleAr: true } } },
  });
  if (!image) throw notFound('Project image');
  return image;
}

export async function addImage(projectId: string, input: AddProjectImageInput) {
  const project = await findById(projectId);
  const { category } = input;
  const order =
    input.order ??
    ((
      await prisma.projectImage.aggregate({
        where: { projectId, category },
        _max: { order: true },
      })
    )._max.order ?? -1) + 1;

  const image = await prisma.projectImage.create({
    data: {
      projectId,
      mediaId: input.mediaId,
      category,
      captionAr: input.captionAr ?? null,
      captionEn: input.captionEn ?? null,
      order,
    },
    include: imageInclude,
  });
  await auditGallery(
    project,
    { [imageKey(image)]: null },
    { [imageKey(image)]: imageSnapshot(image) },
  );
  return image;
}

export async function updateImage(
  projectId: string,
  imageId: string,
  input: UpdateProjectImageInput,
) {
  const { project, ...before } = await getImage(projectId, imageId);
  const image = await prisma.projectImage.update({
    where: { id: imageId },
    data: input,
    include: imageInclude,
  });
  const changes = diff(imageSnapshot(before), imageSnapshot(image));
  if (changes) {
    const key = imageKey(image);
    await auditGallery(project, { [key]: changes.oldData }, { [key]: changes.newData });
  }
  return image;
}

export async function removeImage(projectId: string, imageId: string) {
  const { project, ...image } = await getImage(projectId, imageId);
  await prisma.projectImage.delete({ where: { id: imageId } });
  await auditGallery(
    project,
    { [imageKey(image)]: imageSnapshot(image) },
    { [imageKey(image)]: null },
  );
}

export async function reorderImages(projectId: string, input: ReorderInput) {
  const project = await findById(projectId);
  const next = new Map(input.items.map((item) => [item.id, item.order]));
  const owned = project.gallery.filter((image) => next.has(image.id));
  if (owned.length !== input.items.length)
    throw badRequest('All images must belong to the project');
  await applyOrder(prisma.projectImage, input);

  const oldData: AuditData = {};
  const newData: AuditData = {};
  for (const image of owned) {
    const order = next.get(image.id)!;
    if (order === image.order) continue;
    oldData[imageKey(image)] = { order: image.order };
    newData[imageKey(image)] = { order };
  }
  if (Object.keys(newData).length > 0) await auditGallery(project, oldData, newData);
  return (await findById(projectId)).gallery;
}
