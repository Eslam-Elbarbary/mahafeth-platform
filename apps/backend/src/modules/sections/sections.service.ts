import { AuditAction, type Prisma, type SectionType } from '../../generated/prisma/client.js';
import { notDeleted, reorder as applyOrder, shortId, toJson } from '../../lib/db-helpers.js';
import { badRequest, conflict, HttpError, notFound } from '../../lib/http-error.js';
import { prisma } from '../../lib/prisma.js';
import { diff, record, snapshot } from '../audit/audit.service.js';
import { mediaSummarySelect } from '../media/media.service.js';
import { requiredSectionTypes, sectionTypesFor } from '../pages/pages.catalog.js';
import { mediaIdsIn, sectionContentSchemas } from './sections.schema.js';
import type {
  CreateSectionInput,
  ListSectionsQuery,
  ReorderSectionsInput,
  UpdateSectionInput,
} from './sections.types.js';

export const sectionInclude = {
  image: { select: mediaSummarySelect },
} as const satisfies Prisma.SectionInclude;

type SectionRow = Prisma.SectionGetPayload<{ include: typeof sectionInclude }>;
type MediaSummary = NonNullable<SectionRow['image']>;

/**
 * Adds `media`: the library items referenced inside `content` (by id), so clients render
 * timeline images, about images, the hero logo… without extra requests. Deleted items are left out.
 */
export async function withContentMedia<T extends { content: Prisma.JsonValue }>(sections: T[]) {
  const ids = new Set<string>();
  for (const section of sections) mediaIdsIn(section.content, ids);
  const media = ids.size
    ? await prisma.media.findMany({
        where: { id: { in: [...ids] }, ...notDeleted },
        select: mediaSummarySelect,
      })
    : [];
  const byId = new Map(media.map((item) => [item.id, item]));
  return sections.map((section) => {
    const own: Record<string, MediaSummary> = {};
    for (const id of mediaIdsIn(section.content)) {
      const item = byId.get(id);
      if (item) own[id] = item;
    }
    return { ...section, media: own };
  });
}

/** Validates `content` for the section type; issues are reported as `content.<path>` fields. */
function parseContent(type: SectionType, content: unknown) {
  const result = sectionContentSchemas[type].safeParse(content);
  if (result.success) return result.data;
  const fieldErrors: Record<string, string[]> = {};
  for (const issue of result.error.issues) {
    const key = ['content', ...issue.path.map(String)].join('.');
    (fieldErrors[key] ??= []).push(issue.message);
  }
  throw new HttpError(400, 'Validation failed', 'VALIDATION_ERROR', {
    formErrors: [],
    fieldErrors,
  });
}

async function assertMedia(ids: Iterable<string | null | undefined>) {
  const wanted = [...new Set([...ids].filter((id): id is string => Boolean(id)))];
  if (wanted.length === 0) return;
  const found = await prisma.media.count({ where: { id: { in: wanted }, ...notDeleted } });
  if (found !== wanted.length) throw badRequest('One or more images no longer exist');
}

async function findPage(pageId: string) {
  const page = await prisma.page.findFirst({
    where: { id: pageId, ...notDeleted },
    select: { id: true, slug: true, titleAr: true },
  });
  if (!page) throw notFound('Page');
  return page;
}

type AuditedSection = Pick<
  SectionRow,
  | 'id'
  | 'type'
  | 'titleAr'
  | 'titleEn'
  | 'content'
  | 'contentAr'
  | 'contentEn'
  | 'imageId'
  | 'visible'
>;

/**
 * Section changes are logged as updates of their page, under `section:<TYPE>` (rich text blocks,
 * which may repeat, add a short id). Only changed fields are kept; order changes are not logged.
 */
async function auditSection(
  page: { id: string; titleAr: string },
  before: AuditedSection | null,
  after: AuditedSection | null,
) {
  const section = (after ?? before)!;
  const key = `section:${section.type}${section.type === 'RICH_TEXT' ? `:${shortId(section.id)}` : ''}`;
  const fields = (s: AuditedSection | null) =>
    s &&
    snapshot({
      titleAr: s.titleAr,
      titleEn: s.titleEn,
      content: s.content,
      contentAr: s.contentAr,
      contentEn: s.contentEn,
      imageId: s.imageId,
      visible: s.visible,
    });
  let oldData = fields(before);
  let newData = fields(after);
  if (oldData && newData) {
    const changes = diff(oldData, newData);
    if (!changes) return;
    ({ oldData, newData } = changes);
  }
  await record({
    action: AuditAction.UPDATE,
    entity: 'pages',
    entityId: page.id,
    entityLabel: page.titleAr,
    oldData: { [key]: oldData },
    newData: { [key]: newData },
  });
}

export async function list({ pageId }: ListSectionsQuery) {
  await findPage(pageId);
  const sections = await prisma.section.findMany({
    where: { pageId },
    orderBy: { order: 'asc' },
    include: sectionInclude,
  });
  return withContentMedia(sections);
}

async function findSection(id: string) {
  const section = await prisma.section.findUnique({
    where: { id },
    include: { ...sectionInclude, page: { select: { id: true, slug: true, titleAr: true } } },
  });
  if (!section) throw notFound('Section');
  return section;
}

export async function getById(id: string) {
  const { page: _page, ...section } = await findSection(id);
  const [withMedia] = await withContentMedia([section]);
  return withMedia!;
}

export async function create(input: CreateSectionInput) {
  const page = await findPage(input.pageId);
  if (!sectionTypesFor(page.slug).includes(input.type)) {
    throw badRequest(`Page "${page.slug}" does not accept ${input.type} sections`);
  }
  if (input.type !== 'RICH_TEXT') {
    const existing = await prisma.section.count({ where: { pageId: page.id, type: input.type } });
    if (existing) throw conflict(`Page "${page.slug}" already has a ${input.type} section`);
  }
  const content = input.content == null ? input.content : parseContent(input.type, input.content);
  await assertMedia([input.imageId, ...mediaIdsIn(content)]);

  const order =
    input.order ??
    ((await prisma.section.aggregate({ where: { pageId: page.id }, _max: { order: true } }))._max
      .order ?? -1) + 1;

  const section = await prisma.section.create({
    data: {
      pageId: page.id,
      type: input.type,
      titleAr: input.titleAr ?? null,
      titleEn: input.titleEn ?? null,
      content: toJson(content),
      contentAr: toJson(input.contentAr),
      contentEn: toJson(input.contentEn),
      imageId: input.imageId ?? null,
      order,
      visible: input.visible ?? true,
    },
    include: sectionInclude,
  });
  await auditSection(page, null, section);
  return (await withContentMedia([section]))[0]!;
}

export async function update(id: string, input: UpdateSectionInput) {
  const current = await findSection(id);
  if (input.visible === false && requiredSectionTypes.includes(current.type)) {
    throw badRequest(`${current.type} sections are always shown`);
  }
  const content = input.content == null ? input.content : parseContent(current.type, input.content);
  await assertMedia([input.imageId, ...mediaIdsIn(content)]);

  const section = await prisma.section.update({
    where: { id },
    data: {
      ...input,
      content: toJson(content),
      contentAr: toJson(input.contentAr),
      contentEn: toJson(input.contentEn),
    },
    include: sectionInclude,
  });
  await auditSection(current.page, current, section);
  return (await withContentMedia([section]))[0]!;
}

export async function remove(id: string) {
  const section = await findSection(id);
  if (requiredSectionTypes.includes(section.type)) {
    throw badRequest(`${section.type} sections cannot be deleted`);
  }
  await prisma.section.delete({ where: { id } });
  await auditSection(section.page, section, null);
}

export async function reorder({ pageId, items }: ReorderSectionsInput) {
  const owned = await prisma.section.count({
    where: { pageId, id: { in: items.map((item) => item.id) } },
  });
  if (owned !== items.length) throw badRequest('All sections must belong to the given page');

  await applyOrder(prisma.section, { items });
  return list({ pageId });
}
