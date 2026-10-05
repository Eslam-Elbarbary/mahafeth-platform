import { Router } from 'express';

import { isProduction } from '../../config/env.js';
import { requireAuth } from '../../middleware/auth.js';
import { rateLimit } from '../../middleware/rate-limit.js';
import * as controller from './auth.controller.js';

const FIFTEEN_MINUTES = 15 * 60 * 1000;
const tooManyAttempts = 'Too many failed attempts, please try again in a few minutes';

const LOOPBACK = new Set(['127.0.0.1', '::1', '::ffff:127.0.0.1']);

/*
 * Brute-force protection: failed sign-ins are limited per IP and per account. Local requests skip
 * the per-IP bucket outside production, so repeated local test runs don't lock the machine out.
 */
const loginFailuresPerIp = rateLimit({
  max: 20,
  windowMs: FIFTEEN_MINUTES,
  failuresOnly: true,
  key: (req) => {
    const ip = req.ip ?? 'unknown';
    return !isProduction && LOOPBACK.has(ip) ? null : `ip:${ip}`;
  },
  message: tooManyAttempts,
});
const loginFailuresPerEmail = rateLimit({
  max: 5,
  windowMs: FIFTEEN_MINUTES,
  failuresOnly: true,
  key: (req) => {
    const email: unknown = (req.body as { email?: unknown } | undefined)?.email;
    return typeof email === 'string' ? `email:${email.trim().toLowerCase()}` : null;
  },
  message: tooManyAttempts,
});
const passwordChangeFailures = rateLimit({
  max: 5,
  windowMs: FIFTEEN_MINUTES,
  failuresOnly: true,
  key: (req) => (req.user ? `user:${req.user.id}` : null),
  message: tooManyAttempts,
});

export const authRouter = Router();

authRouter.post('/login', loginFailuresPerIp, loginFailuresPerEmail, controller.login);
authRouter.get('/me', requireAuth, controller.me);
authRouter.post('/change-password', requireAuth, passwordChangeFailures, controller.changePassword);
