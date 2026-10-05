import { AuditAction, type AuditLog, type Prisma } from '../../generated/prisma/client.js';
import { notDeleted, shortId, toJson } from '../../lib/db-helpers.js';
import { logger } from '../../lib/logger.js';
import { pageArgs, paginated } from '../../lib/pagination.js';
import { prisma } from '../../lib/prisma.js';
import { requestContext } from '../../lib/request-context.js';
import { contentKeys } from '../settings/settings.catalog.js';
import type { AuditData, AuditEntity, AuditEntry, ListAuditLogsQuery } from './audit.types.js';

/** Never written to the log, at any depth. */
const SECRET_KEYS = new Set(['passwordHash', 'password']);
/** Bookkeeping columns that change on every write. */
const IGNORED_KEYS = new Set(['updatedAt']);

/**
 * Plain JSON copy of a record (dates → ISO strings, decimals → strings) without secrets and
 * without the `omit` keys (relations the log does not need).
 */
export function snapshot(value: object | null | undefined, omit: readonly string[] = []) {
  if (value == null) return null;
  const skip = new Set(omit);
  return JSON.parse(
    JSON.stringify(value, function (key, v: unknown) {
      if (SECRET_KEYS.has(key)) return undefined;
      return this === value && skip.has(key) ? undefined : v;
    }),
  ) as AuditData;
}

/** JSON with sorted object keys, so equal values compare equal regardless of key order. */
function stable(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stable).join(',')}]`;
  if (value && typeof value === 'object') {
    const entries = Object.entries(value).sort(([a], [b]) => a.localeCompare(b));
    return `{${entries.map(([k, v]) => `${JSON.stringify(k)}:${stable(v)}`).join(',')}}`;
  }
  return JSON.stringify(value ?? null);
}

/** Fields present in both snapshots whose values differ; `null` when nothing changed. */
export function diff(before: AuditData | null, after: AuditData | null) {
  if (!before || !after) return null;
  const oldData: AuditData = {};
  const newData: AuditData = {};
  for (const key of Object.keys(after)) {
    if (IGNORED_KEYS.has(key) || !(key in before)) continue;
    if (stable(before[key]) !== stable(after[key])) {
      oldData[key] = before[key] ?? null;
      newData[key] = after[key] ?? null;
    }
  }
  return Object.keys(newData).length > 0 ? { oldData, newData } : null;
}

/**
 * Writes one audit entry for the current request's user (none for website submissions). A failed
 * write is logged and never fails the change it describes.
 */
export async function record(entry: AuditEntry) {
  const context = requestContext();
  const user = context?.user ?? null;
  try {
    await prisma.auditLog.create({
      data: {
        userId: user?.id ?? null,
        userName: user?.name ?? null,
        userEmail: user?.email ?? null,
        userRole: user?.role ?? null,
        action: entry.action,
        entity: entry.entity,
        entityId: entry.entityId,
        entityLabel: entry.entityLabel?.slice(0, 255) ?? null,
        oldData: toJson(entry.oldData ?? null),
        newData: toJson(entry.newData ?? null),
        ipAddress: context?.ipAddress?.slice(0, 45) ?? null,
      },
    });
  } catch (error) {
    logger.error(
      { err: error, entity: entry.entity, entityId: entry.entityId },
      'audit write failed',
    );
  }
}

type Target = { entity: AuditEntity; id: string; label?: string | null; omit?: readonly string[] };

/** `entityId` of list reorder entries, which describe a whole collection rather than one row. */
export const REORDER_ENTITY_ID = 'order';

/** Shorthands for the tracked actions. */
export const audit = {
  created: ({ entity, id, label, omit }: Target, after: object) =>
    record({
      action: AuditAction.CREATE,
      entity,
      entityId: id,
      entityLabel: label,
      newData: snapshot(after, omit),
    }),

  /** Skipped when no tracked field changed. */
  updated: async ({ entity, id, label, omit }: Target, before: object, after: object) => {
    const changes = diff(snapshot(before, omit), snapshot(after, omit));
    if (changes) {
      await record({
        action: AuditAction.UPDATE,
        entity,
        entityId: id,
        entityLabel: label,
        ...changes,
      });
    }
  },

  deleted: ({ entity, id, label, omit }: Target, before: object) =>
    record({
      action: AuditAction.DELETE,
      entity,
      entityId: id,
      entityLabel: label,
      oldData: snapshot(before, omit),
    }),

  /**
   * One UPDATE for a drag-and-drop reorder: `order:<label>` → position, for the rows whose position
   * changed. `before` must hold the rows' positions read before the reorder was applied.
   */
  reordered: async (
    entity: AuditEntity,
    before: ReadonlyArray<{ id: string; label: string; order: number }>,
    items: ReadonlyArray<{ id: string; order: number }>,
  ) => {
    const next = new Map(items.map((item) => [item.id, item.order]));
    const oldData: AuditData = {};
    const newData: AuditData = {};
    for (const row of before) {
      const order = next.get(row.id);
      if (order === undefined || order === row.order) continue;
      let key = `order:${row.label}`;
      if (key in newData) key = `${key} (${shortId(row.id)})`;
      oldData[key] = row.order;
      newData[key] = order;
    }
    if (Object.keys(newData).length === 0) return;
    await record({
      action: AuditAction.UPDATE,
      entity,
      entityId: REORDER_ENTITY_ID,
      oldData,
      newData,
    });
  },
};

// ─── Admin list ───────────────────────────────────────────────────────────────

type LogRow = Prisma.AuditLogGetPayload<object>;

/** Where reorder entries link to. */
const LIST_PAGES: Partial<Record<string, string>> = {
  projects: '/projects',
  team: '/team',
  partners: '/partners',
};

/** Admin URL of each entry's record, when it still exists. */
async function hrefs(rows: LogRow[]) {
  const idsOf = (entity: AuditEntity) => [
    ...new Set(rows.filter((row) => row.entity === entity).map((row) => row.entityId)),
  ];
  const alive = async <T extends { id: string }>(
    ids: string[],
    find: (ids: string[]) => Promise<T[]>,
  ) => (ids.length ? new Map((await find(ids)).map((row) => [row.id, row])) : new Map<string, T>());

  const [projects, services, pages, leads, users, media, team, partners] = await Promise.all([
    alive(idsOf('projects'), (ids) =>
      prisma.project.findMany({ where: { id: { in: ids }, ...notDeleted }, select: { id: true } }),
    ),
    alive(idsOf('services'), (ids) =>
      prisma.service.findMany({ where: { id: { in: ids }, ...notDeleted }, select: { id: true } }),
    ),
    alive(idsOf('pages'), (ids) =>
      prisma.page.findMany({
        where: { id: { in: ids }, ...notDeleted },
        select: { id: true, slug: true },
      }),
    ),
    alive(idsOf('leads'), (ids) =>
      prisma.lead.findMany({ where: { id: { in: ids }, ...notDeleted }, select: { id: true } }),
    ),
    alive(idsOf('users'), (ids) =>
      prisma.user.findMany({ where: { id: { in: ids }, ...notDeleted }, select: { id: true } }),
    ),
    alive(idsOf('media'), (ids) =>
      prisma.media.findMany({ where: { id: { in: ids }, ...notDeleted }, select: { id: true } }),
    ),
    alive(idsOf('team'), (ids) =>
      prisma.teamMember.findMany({
        where: { id: { in: ids }, ...notDeleted },
        select: { id: true },
      }),
    ),
    alive(idsOf('partners'), (ids) =>
      prisma.partner.findMany({ where: { id: { in: ids }, ...notDeleted }, select: { id: true } }),
    ),
  ]);

  return (row: AuditLog): string | null => {
    const id = row.entityId;
    if (id === REORDER_ENTITY_ID) return LIST_PAGES[row.entity] ?? null;
    switch (row.entity as AuditEntity) {
      case 'projects':
        return projects.has(id) ? `/projects/${id}` : null;
      case 'services':
        return services.has(id) ? `/services/${id}` : null;
      case 'pages': {
        const page = pages.get(id);
        return page ? `/pages/${page.slug}` : null;
      }
      case 'leads':
        return leads.has(id) ? `/leads?lead=${id}` : null;
      case 'users':
        return users.has(id) ? `/users?user=${id}` : null;
      case 'settings':
        return contentKeys.has(id) ? '/settings/content' : '/settings';
      case 'media':
        return media.has(id) ? '/media' : null;
      case 'team':
        return team.has(id) ? `/team/${id}` : null;
      case 'partners':
        return partners.has(id) ? `/partners/${id}` : null;
      default:
        return null;
    }
  };
}

export async function list(query: ListAuditLogsQuery) {
  const where: Prisma.AuditLogWhereInput = {
    ...(query.entity && { entity: query.entity }),
    ...(query.action && { action: query.action }),
    ...(query.userId && { userId: query.userId }),
    ...(query.entityId && { entityId: query.entityId }),
    ...((query.from || query.to) && {
      createdAt: { ...(query.from && { gte: query.from }), ...(query.to && { lte: query.to }) },
    }),
    ...(query.q && {
      OR: [
        { entityLabel: { contains: query.q } },
        { entityId: { contains: query.q } },
        { userName: { contains: query.q } },
        { userEmail: { contains: query.q } },
      ],
    }),
  };
  const [rows, total] = await prisma.$transaction([
    prisma.auditLog.findMany({
      where,
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      ...pageArgs(query),
    }),
    prisma.auditLog.count({ where }),
  ]);
  const hrefOf = await hrefs(rows);
  return paginated(
    rows.map((row) => ({ ...row, href: hrefOf(row) })),
    total,
    query,
  );
}
