import type { Prisma } from '../../generated/prisma/client.js';
import { notDeleted } from '../../lib/db-helpers.js';
import { notFound } from '../../lib/http-error.js';
import { pageArgs, paginated } from '../../lib/pagination.js';
import { prisma } from '../../lib/prisma.js';
import { publicUrlFor } from '../../lib/upload.js';
import { audit } from '../audit/audit.service.js';
import type {
  ListMediaQuery,
  MediaMetaInput,
  UpdateMediaInput,
  UploadedFile,
} from './media.types.js';

/** Fields embedded wherever another model references a media item. */
export const mediaSummarySelect = {
  id: true,
  url: true,
  mimeType: true,
  width: true,
  height: true,
  altAr: true,
  altEn: true,
} as const satisfies Prisma.MediaSelect;

/** Where an item is referenced, so the admin can warn before deleting it. */
const usageCount = {
  _count: {
    select: {
      projectCovers: true,
      projectImages: true,
      sections: true,
      pageOgImages: true,
      services: true,
      teamMemberPhotos: true,
      partnerLogos: true,
    },
  },
} as const satisfies Prisma.MediaInclude;

export async function list(query: ListMediaQuery) {
  const where: Prisma.MediaWhereInput = {
    ...notDeleted,
    ...(query.type && { mimeType: { startsWith: query.type } }),
    ...(query.q && {
      OR: [
        { originalName: { contains: query.q } },
        { altAr: { contains: query.q } },
        { altEn: { contains: query.q } },
      ],
    }),
  };
  const [items, total] = await prisma.$transaction([
    prisma.media.findMany({
      where,
      include: usageCount,
      orderBy: { createdAt: 'desc' },
      ...pageArgs(query),
    }),
    prisma.media.count({ where }),
  ]);
  return paginated(items, total, query);
}

export async function getById(id: string) {
  const media = await prisma.media.findFirst({ where: { id, ...notDeleted }, include: usageCount });
  if (!media) throw notFound('Media');
  return media;
}

/** The client's file name, for display only: no directories or control characters. */
const displayName = (name: string) =>
  (name.split(/[\\/]/).pop() ?? '')
    .replace(/\p{Cc}/gu, '')
    .trim()
    .slice(0, 255) || 'file';

const auditTarget = (media: { id: string; originalName: string }) => ({
  entity: 'media' as const,
  id: media.id,
  label: media.originalName,
  omit: ['_count', 'deletedAt', 'uploadedById'],
});

export async function create(file: UploadedFile, meta: MediaMetaInput, uploadedById: string) {
  const media = await prisma.media.create({
    data: {
      filename: file.filename,
      originalName: displayName(file.originalname),
      url: publicUrlFor(file.filename),
      mimeType: file.mimetype,
      size: file.size,
      width: meta.width ?? null,
      height: meta.height ?? null,
      altAr: meta.altAr ?? null,
      altEn: meta.altEn ?? null,
      uploadedById,
    },
  });
  await audit.created(auditTarget(media), media);
  return media;
}

export async function update(id: string, input: UpdateMediaInput) {
  const before = await getById(id);
  const media = await prisma.media.update({ where: { id }, data: input });
  await audit.updated(auditTarget(media), before, media);
  return media;
}

/** Soft delete: the file stays on disk so published references keep resolving. */
export async function remove(id: string) {
  const media = await getById(id);
  await prisma.media.update({ where: { id }, data: { deletedAt: new Date() } });
  await audit.deleted(auditTarget(media), media);
}
