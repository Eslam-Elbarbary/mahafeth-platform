import { z } from 'zod';

import { Role } from '../../generated/prisma/client.js';
import { requiredText, searchQuery } from '../../lib/schemas.js';
import { password } from '../auth/auth.schema.js';

export const USER_STATUSES = ['ACTIVE', 'INACTIVE'] as const;

const email = z.email().trim().toLowerCase().max(191);

export const listUsersQuery = searchQuery.extend({
  role: z.enum(Role).optional(),
  status: z.enum(USER_STATUSES).optional(),
});

export const createUserBody = z.object({
  name: requiredText(120),
  email,
  role: z.enum(Role).default(Role.EDITOR),
  isActive: z.boolean().default(true),
  password,
});

export const updateUserBody = z
  .object({
    name: requiredText(120).optional(),
    email: email.optional(),
    role: z.enum(Role).optional(),
    isActive: z.boolean().optional(),
  })
  .refine((v) => Object.keys(v).length > 0, { message: 'Nothing to update' });

export const resetPasswordBody = z.object({ password });
