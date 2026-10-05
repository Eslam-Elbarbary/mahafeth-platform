import { z } from 'zod';

/** bcrypt ignores everything after 72 bytes, so longer passwords are refused instead. */
export const password = z
  .string()
  .min(10, 'Use at least 10 characters')
  .max(128)
  .refine((value) => Buffer.byteLength(value, 'utf8') <= 72, 'Use at most 72 bytes');

export const loginBody = z.object({
  email: z.email().trim().toLowerCase(),
  password: z.string().min(1).max(128),
});

export const changePasswordBody = z
  .object({
    currentPassword: z.string().min(1).max(128),
    newPassword: password,
  })
  .refine((v) => v.currentPassword !== v.newPassword, {
    message: 'New password must differ from the current one',
    path: ['newPassword'],
  });
