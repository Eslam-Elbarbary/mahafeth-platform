import type { z } from 'zod';

import type { Role } from '../../generated/prisma/client.js';
import type {
  createUserBody,
  listUsersQuery,
  resetPasswordBody,
  updateUserBody,
} from './users.schema.js';

export type ListUsersQuery = z.infer<typeof listUsersQuery>;
export type CreateUserInput = z.infer<typeof createUserBody>;
export type UpdateUserInput = z.infer<typeof updateUserBody>;
export type ResetPasswordInput = z.infer<typeof resetPasswordBody>;

export interface UserStats {
  total: number;
  active: number;
  inactive: number;
  byRole: Record<Role, number>;
}
