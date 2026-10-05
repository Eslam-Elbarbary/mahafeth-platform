import { notDeleted } from '../../lib/db-helpers.js';
import { badRequest, unauthorized } from '../../lib/http-error.js';
import { signAccessToken } from '../../lib/jwt.js';
import { hashPassword, verifyPassword } from '../../lib/password.js';
import { permissionsOf } from '../../lib/permissions.js';
import { prisma } from '../../lib/prisma.js';
import type {
  AuthUser,
  ChangePasswordInput,
  CurrentUser,
  LoginInput,
  LoginResult,
} from './auth.types.js';

const authUserSelect = { id: true, name: true, email: true, role: true } as const;

/**
 * The token's user when the account is still active and the token was issued after the last
 * password change (so changing or resetting a password signs out every other session).
 */
export async function findSessionUser(id: string, issuedAt: number): Promise<AuthUser | null> {
  const user = await prisma.user.findFirst({
    where: { id, isActive: true, ...notDeleted },
    select: { ...authUserSelect, passwordChangedAt: true },
  });
  if (!user) return null;
  const { passwordChangedAt, ...authUser } = user;
  if (passwordChangedAt && issuedAt < Math.floor(passwordChangedAt.getTime() / 1000)) return null;
  return authUser;
}

export async function login({ email, password }: LoginInput): Promise<LoginResult> {
  const user = await prisma.user.findFirst({
    where: { email, isActive: true, ...notDeleted },
    select: { ...authUserSelect, passwordHash: true },
  });

  const valid = await verifyPassword(password, user?.passwordHash);
  if (!user || !valid) throw unauthorized('Invalid email or password');

  await prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });

  const { passwordHash: _, ...authUser } = user;
  return {
    accessToken: await signAccessToken(user.id),
    tokenType: 'Bearer',
    user: withPermissions(authUser),
  };
}

export const withPermissions = (user: AuthUser): CurrentUser => ({
  ...user,
  permissions: permissionsOf(user.role),
});

/** Returns a fresh token: the change revokes every token issued before it, including the caller's. */
export async function changePassword(userId: string, input: ChangePasswordInput) {
  const user = await prisma.user.findUniqueOrThrow({
    where: { id: userId },
    select: { passwordHash: true },
  });
  if (!(await verifyPassword(input.currentPassword, user.passwordHash))) {
    throw badRequest('Current password is incorrect');
  }
  await prisma.user.update({
    where: { id: userId },
    data: { passwordHash: await hashPassword(input.newPassword), passwordChangedAt: new Date() },
  });
  return { accessToken: await signAccessToken(userId), tokenType: 'Bearer' as const };
}
