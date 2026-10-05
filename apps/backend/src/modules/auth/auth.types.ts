import type { z } from 'zod';

import type { Role } from '../../generated/prisma/client.js';
import type { Permissions } from '../../lib/permissions.js';
import type { changePasswordBody, loginBody } from './auth.schema.js';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: Role;
}

/** The signed-in user as returned to the admin, with what their role may do. */
export interface CurrentUser extends AuthUser {
  permissions: Permissions;
}

export interface LoginResult {
  accessToken: string;
  tokenType: 'Bearer';
  user: CurrentUser;
}

export type LoginInput = z.infer<typeof loginBody>;
export type ChangePasswordInput = z.infer<typeof changePasswordBody>;
