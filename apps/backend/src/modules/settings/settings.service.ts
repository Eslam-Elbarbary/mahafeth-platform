import type { Prisma, Setting } from '../../generated/prisma/client.js';
import { notDeleted } from '../../lib/db-helpers.js';
import { HttpError, notFound } from '../../lib/http-error.js';
import { prisma } from '../../lib/prisma.js';
import { audit } from '../audit/audit.service.js';
import { mediaSummarySelect } from '../media/media.service.js';
import {
  groupOf,
  isCatalogKey,
  isMediaRef,
  retiredKeys,
  settingsCatalog,
} from './settings.catalog.js';
import type {
  BulkUpsertSettingsInput,
  ListSettingsQuery,
  PublicSettings,
  UpsertSettingInput,
} from './settings.types.js';

const notRetired = { key: { notIn: [...retiredKeys] } } satisfies Prisma.SettingWhereInput;

function publicRows() {
  return prisma.setting.findMany({
    where: { isPublic: true, ...notRetired },
    select: { key: true, value: true },
    orderBy: { key: 'asc' },
  });
}

/** Legacy shape: `{ "contact.phone": "…" }`, media left as `{ mediaId }`. */
export async function getPublicFlat(): Promise<PublicSettings> {
  return Object.fromEntries((await publicRows()).map((row) => [row.key, row.value]));
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

/** `imageId` of a content object (page headers), if any. */
const imageIdOf = (value: unknown) =>
  isRecord(value) && typeof value.imageId === 'string' ? value.imageId : null;

/**
 * Public settings nested by key segment (`{ contact: { phone } }`). Media references resolve to
 * their URL, or `""` when unset or deleted, so the website never gets a broken image. Content
 * objects with an `imageId` get `image` (the media summary, or `null` when unset or deleted).
 */
export async function getPublic(): Promise<Record<string, unknown>> {
  const rows = await publicRows();
  const mediaIds = rows.flatMap((row) => {
    if (isMediaRef(row.value)) return row.value.mediaId ? [row.value.mediaId] : [];
    const imageId = imageIdOf(row.value);
    return imageId ? [imageId] : [];
  });
  const media = mediaIds.length
    ? await prisma.media.findMany({
        where: { id: { in: mediaIds }, ...notDeleted },
        select: mediaSummarySelect,
      })
    : [];
  const byId = new Map(media.map((m) => [m.id, m]));

  const tree: Record<string, unknown> = {};
  for (const { key, value } of rows) {
    const imageId = imageIdOf(value);
    const resolved = isMediaRef(value)
      ? (value.mediaId && byId.get(value.mediaId)?.url) || ''
      : isRecord(value) && 'imageId' in value
        ? { ...value, image: (imageId && byId.get(imageId)) || null }
        : value;
    const path = key.split('.');
    const leaf = path.pop()!;
    let node = tree;
    let blocked = false;
    for (const segment of path) {
      const next = node[segment];
      if (next === undefined) node[segment] = {};
      else if (typeof next !== 'object' || next === null || Array.isArray(next)) {
        blocked = true;
        break;
      }
      node = node[segment] as Record<string, unknown>;
    }
    if (!blocked) node[leaf] = resolved;
  }
  return tree;
}

export function list({ group }: ListSettingsQuery) {
  return prisma.setting.findMany({
    where: { ...notRetired, ...(group && { group }) },
    orderBy: [{ group: 'asc' }, { key: 'asc' }],
  });
}

export async function getByKey(key: string) {
  const setting = retiredKeys.has(key) ? null : await prisma.setting.findUnique({ where: { key } });
  if (!setting) throw notFound('Setting');
  return setting;
}

/**
 * Known keys must match their catalog shape and retired keys cannot be written; issues are
 * reported per setting key.
 */
function validated<T extends { key: string; value: unknown }>(items: T[]): T[] {
  const fieldErrors: Record<string, string[]> = {};
  const parsed = items.map((item) => {
    if (retiredKeys.has(item.key)) {
      fieldErrors[item.key] = ['This setting is no longer managed in the CMS'];
      return item;
    }
    if (!isCatalogKey(item.key)) return item;
    const result = settingsCatalog[item.key].schema.safeParse(item.value);
    if (result.success) return { ...item, value: result.data };
    fieldErrors[item.key] = result.error.issues.map((issue) =>
      issue.path.length ? `${issue.path.join('.')}: ${issue.message}` : issue.message,
    );
    return item;
  });
  if (Object.keys(fieldErrors).length > 0) {
    throw new HttpError(400, 'Validation failed', 'VALIDATION_ERROR', {
      formErrors: [],
      fieldErrors,
    });
  }
  return parsed;
}

function upsertArgs(key: string, input: UpsertSettingInput): Prisma.SettingUpsertArgs {
  const value = input.value as Prisma.InputJsonValue;
  const catalog = isCatalogKey(key) ? settingsCatalog[key] : undefined;
  const group = input.group ?? groupOf(key);
  return {
    where: { key },
    create: {
      key,
      value,
      group,
      isPublic: input.isPublic ?? true,
      description: input.description ?? catalog?.description ?? null,
    },
    update: {
      value,
      ...(input.group && { group: input.group }),
      ...(input.isPublic !== undefined && { isPublic: input.isPublic }),
      ...(input.description !== undefined && { description: input.description }),
    },
  };
}

const auditTarget = (key: string) => ({
  entity: 'settings' as const,
  id: key,
  label: key,
  omit: ['id', 'createdAt'],
});

/** One audit entry per created or changed setting (unchanged values are not logged). */
async function auditUpserts(before: Setting[], after: Setting[]) {
  const previous = new Map(before.map((row) => [row.key, row]));
  for (const row of after) {
    const old = previous.get(row.key);
    if (old) await audit.updated(auditTarget(row.key), old, row);
    else await audit.created(auditTarget(row.key), row);
  }
}

export async function upsert(key: string, input: UpsertSettingInput) {
  const [item] = validated([{ ...input, key }]);
  const before = await prisma.setting.findMany({ where: { key } });
  const setting = await prisma.setting.upsert(upsertArgs(key, item!));
  await auditUpserts(before, [setting]);
  return setting;
}

export async function bulkUpsert({ items }: BulkUpsertSettingsInput) {
  const valid = validated(items);
  const before = await prisma.setting.findMany({
    where: { key: { in: valid.map((item) => item.key) } },
  });
  const settings = await prisma.$transaction(
    valid.map(({ key, ...input }) => prisma.setting.upsert(upsertArgs(key, input))),
  );
  await auditUpserts(before, settings);
  return settings;
}

/** Retired rows can still be deleted, to clean up older databases. */
export async function remove(key: string) {
  const setting = await prisma.setting.findUnique({ where: { key } });
  if (!setting) throw notFound('Setting');
  await prisma.setting.delete({ where: { key } });
  await audit.deleted(auditTarget(key), setting);
}
