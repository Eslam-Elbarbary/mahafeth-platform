import { type Prisma, PublishStatus } from '../../generated/prisma/client.js';
import { archivedSlug, notDeleted } from '../../lib/db-helpers.js';
import { badRequest, notFound } from '../../lib/http-error.js';
import { pageArgs, paginated } from '../../lib/pagination.js';
import { prisma } from '../../lib/prisma.js';
import { audit } from '../audit/audit.service.js';
import { mediaSummarySelect } from '../media/media.service.js';
import { sectionInclude, withContentMedia } from '../sections/sections.service.js';
import { catalogPage, requiredSectionTypes, sectionTypesFor } from './pages.catalog.js';
import {
  CORE_PAGE_SLUGS,
  type CreatePageInput,
  type ListPagesQuery,
  type UpdatePageInput,
} from './pages.types.js';

const ogImageInclude = { ogImage: { select: mediaSummarySelect } } as const;

const publishedAt = (status: PublishStatus | undefined, current?: Date | null) =>
  status === PublishStatus.PUBLISHED ? (current ?? new Date()) : status ? null : undefined;

/** Public page: visible sections only, each with the media its `content` references. */
export async function getPublishedBySlug(slug: string) {
  const page = await prisma.page.findFirst({
    where: { slug, status: PublishStatus.PUBLISHED, ...notDeleted },
    include: {
      ...ogImageInclude,
      sections: { where: { visible: true }, orderBy: { order: 'asc' }, include: sectionInclude },
    },
  });
  if (!page) throw notFound('Page');
  return { ...page, sections: await withContentMedia(page.sections) };
}

export async function list(query: ListPagesQuery) {
  const where: Prisma.PageWhereInput = {
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
    prisma.page.findMany({
      where,
      orderBy: { createdAt: 'asc' },
      include: {
        _count: { select: { sections: true } },
        sections: { select: { updatedAt: true }, orderBy: { updatedAt: 'desc' }, take: 1 },
      },
      ...pageArgs(query),
    }),
    prisma.page.count({ where }),
  ]);
  /* A section edit is a page edit for the list's "last update" column. */
  const withActivity = items.map(({ sections, ...page }) => {
    const sectionAt = sections[0]?.updatedAt;
    return {
      ...page,
      path: catalogPage(page.slug)?.path ?? `/${page.slug}`,
      lastEditedAt: sectionAt && sectionAt > page.updatedAt ? sectionAt : page.updatedAt,
    };
  });
  return paginated(withActivity, total, query);
}

/** Admin page with every section (hidden included) and what the editor may add or toggle. */
async function withSections(where: Prisma.PageWhereInput) {
  const page = await prisma.page.findFirst({
    where: { ...where, ...notDeleted },
    include: {
      ...ogImageInclude,
      sections: { orderBy: { order: 'asc' }, include: sectionInclude },
    },
  });
  if (!page) throw notFound('Page');
  return {
    ...page,
    sections: await withContentMedia(page.sections),
    path: catalogPage(page.slug)?.path ?? `/${page.slug}`,
    sectionTypes: sectionTypesFor(page.slug),
    requiredSectionTypes,
  };
}

export const getById = (id: string) => withSections({ id });
export const getBySlug = (slug: string) => withSections({ slug });

async function assertOgImage(id: string | null | undefined) {
  if (!id) return;
  const found = await prisma.media.count({ where: { id, ...notDeleted } });
  if (!found) throw badRequest('The selected image no longer exists');
}

const pageAuditTarget = (page: { id: string; titleAr: string }) => ({
  entity: 'pages' as const,
  id: page.id,
  label: page.titleAr,
  omit: ['deletedAt'],
});

export async function create(input: CreatePageInput) {
  await assertOgImage(input.ogImageId);
  const page = await prisma.page.create({
    data: { ...input, publishedAt: publishedAt(input.status) ?? null },
  });
  await audit.created(pageAuditTarget(page), page);
  return page;
}

export async function update(id: string, input: UpdatePageInput) {
  const page = await prisma.page.findFirst({ where: { id, ...notDeleted } });
  if (!page) throw notFound('Page');
  if (input.slug && input.slug !== page.slug && isCorePage(page.slug)) {
    throw badRequest(`The slug of core page "${page.slug}" cannot be changed`);
  }
  await assertOgImage(input.ogImageId);
  const updated = await prisma.page.update({
    where: { id },
    data: { ...input, publishedAt: publishedAt(input.status, page.publishedAt) },
  });
  await audit.updated(pageAuditTarget(updated), page, updated);
  return getById(id);
}

export async function remove(id: string) {
  const page = await prisma.page.findFirst({ where: { id, ...notDeleted } });
  if (!page) throw notFound('Page');
  if (isCorePage(page.slug)) throw badRequest(`Core page "${page.slug}" cannot be deleted`);
  await prisma.page.update({
    where: { id },
    data: { deletedAt: new Date(), slug: archivedSlug(page.slug, id) },
  });
  await audit.deleted(pageAuditTarget(page), page);
}

const isCorePage = (slug: string) => (CORE_PAGE_SLUGS as readonly string[]).includes(slug);
