import { Prisma } from '../generated/prisma/client.js';

import { prisma } from './prisma.js';
import type { ReorderInput } from './schemas.js';

export const notDeleted = { deletedAt: null } as const;

/** Maps an optional JSON input to Prisma's nullable-JSON semantics. */
export function toJson(value: unknown): Prisma.InputJsonValue | typeof Prisma.DbNull | undefined {
  if (value === undefined) return undefined;
  if (value === null) return Prisma.DbNull;
  return value as Prisma.InputJsonValue;
}

/**
 * Short, practically unique form of a UUIDv7: its random tail (the head is a timestamp, shared by
 * rows created around the same time).
 */
export const shortId = (id: string) => id.slice(-8);

/**
 * Frees a unique slug when a row is soft-deleted, so the slug can be reused.
 * Keeps the original readable: `my-project--deleted-9f3c2a1b`.
 */
export const archivedSlug = (slug: string, id: string) =>
  `${slug}--deleted-${shortId(id)}`.slice(0, 160);

type OrderDelegate = {
  update(args: { where: { id: string }; data: { order: number } }): Prisma.PrismaPromise<unknown>;
};

/** Applies `{ id, order }` pairs in one transaction. */
export async function reorder(delegate: OrderDelegate, { items }: ReorderInput) {
  await prisma.$transaction(
    items.map(({ id, order }) => delegate.update({ where: { id }, data: { order } })),
  );
}
