import { AuditAction, type Prisma, Role } from '../../generated/prisma/client.js';
import { notDeleted, shortId } from '../../lib/db-helpers.js';
import { HttpError, notFound } from '../../lib/http-error.js';
import { pageArgs, paginated } from '../../lib/pagination.js';
import { hashPassword } from '../../lib/password.js';
import { prisma } from '../../lib/prisma.js';
import { audit, record } from '../audit/audit.service.js';
import type { AuthUser } from '../auth/auth.types.js';
import type {
  CreateUserInput,
  ListUsersQuery,
  ResetPasswordInput,
  UpdateUserInput,
  UserStats,
} from './users.types.js';

const select = {
  id: true,
  name: true,
  email: true,
  role: true,
  isActive: true,
  lastLoginAt: true,
  createdAt: true,
  updatedAt: true,
  _count: { select: { assignedLeads: { where: notDeleted } } },
} as const satisfies Prisma.UserSelect;

type UserRow = Prisma.UserGetPayload<{ select: typeof select }>;

const target = (user: Pick<UserRow, 'id' | 'name' | 'email'>) => ({
  entity: 'users' as const,
  id: user.id,
  label: `${user.name} <${user.email}>`,
  omit: ['_count', 'lastLoginAt'],
});

const emailTaken = () => new HttpError(409, 'This email is already in use', 'EMAIL_TAKEN');
const lastSuperAdmin = () =>
  new HttpError(409, 'At least one active super admin is required', 'LAST_SUPER_ADMIN');

async function assertEmailFree(email: string, exceptId?: string) {
  const existing = await prisma.user.count({
    where: { email, ...notDeleted, ...(exceptId && { id: { not: exceptId } }) },
  });
  if (existing) throw emailTaken();
}

/** Throws unless another active super admin remains besides `userId`. */
async function assertOtherSuperAdmin(userId: string) {
  const others = await prisma.user.count({
    where: { role: Role.SUPER_ADMIN, isActive: true, id: { not: userId }, ...notDeleted },
  });
  if (others === 0) throw lastSuperAdmin();
}

export async function list(query: ListUsersQuery) {
  const where: Prisma.UserWhereInput = {
    ...notDeleted,
    ...(query.role && { role: query.role }),
    ...(query.status && { isActive: query.status === 'ACTIVE' }),
    ...(query.q && {
      OR: [{ name: { contains: query.q } }, { email: { contains: query.q } }],
    }),
  };
  const [items, total] = await prisma.$transaction([
    prisma.user.findMany({
      where,
      select,
      orderBy: [{ isActive: 'desc' }, { createdAt: 'asc' }],
      ...pageArgs(query),
    }),
    prisma.user.count({ where }),
  ]);
  return paginated(items, total, query);
}

export async function stats(): Promise<UserStats> {
  const groups = await prisma.user.groupBy({
    by: ['role', 'isActive'],
    where: notDeleted,
    orderBy: { role: 'asc' },
    _count: { _all: true },
  });
  const byRole = Object.fromEntries(Object.values(Role).map((r) => [r, 0])) as Record<Role, number>;
  let active = 0;
  let inactive = 0;
  for (const group of groups) {
    const count = typeof group._count === 'object' ? (group._count._all ?? 0) : 0;
    byRole[group.role] += count;
    if (group.isActive) active += count;
    else inactive += count;
  }
  return { total: active + inactive, active, inactive, byRole };
}

export async function getById(id: string) {
  const user = await prisma.user.findFirst({ where: { id, ...notDeleted }, select });
  if (!user) throw notFound('User');
  return user;
}

export async function create({ password, ...input }: CreateUserInput) {
  await assertEmailFree(input.email);
  const user = await prisma.user.create({
    data: { ...input, passwordHash: await hashPassword(password) },
    select,
  });
  await audit.created(target(user), user);
  return user;
}

/**
 * You cannot change your own role or status (no self-lockout), and the last active super admin
 * cannot be demoted or deactivated.
 */
export async function update(actor: AuthUser, id: string, input: UpdateUserInput) {
  const before = await getById(id);
  const demoted = input.role !== undefined && input.role !== before.role;
  const deactivated = input.isActive === false && before.isActive;

  if (id === actor.id && (demoted || deactivated)) {
    throw new HttpError(400, 'You cannot change your own role or status', 'SELF_UPDATE');
  }
  if (before.role === Role.SUPER_ADMIN && before.isActive && (demoted || deactivated)) {
    await assertOtherSuperAdmin(id);
  }
  if (input.email && input.email !== before.email) await assertEmailFree(input.email, id);

  const user = await prisma.user.update({ where: { id }, data: input, select });
  await audit.updated(target(user), before, user);
  return user;
}

export async function resetPassword(id: string, { password }: ResetPasswordInput) {
  const user = await getById(id);
  await prisma.user.update({
    where: { id },
    data: { passwordHash: await hashPassword(password), passwordChangedAt: new Date() },
  });
  await record({
    action: AuditAction.UPDATE,
    entity: 'users',
    entityId: id,
    entityLabel: target(user).label,
    newData: { passwordReset: true },
  });
}

/** Soft delete; the email is archived so it can be reused for a new account. */
export async function remove(actor: AuthUser, id: string) {
  if (id === actor.id) {
    throw new HttpError(400, 'You cannot delete your own account', 'SELF_DELETE');
  }
  const user = await getById(id);
  if (user.role === Role.SUPER_ADMIN) await assertOtherSuperAdmin(id);

  await prisma.user.update({
    where: { id },
    data: {
      deletedAt: new Date(),
      isActive: false,
      email: `${user.email}#deleted-${shortId(id)}`.slice(0, 191),
    },
  });
  await audit.deleted(target(user), user);
}
