import type { Request, RequestHandler } from 'express';

import type { Role } from '../generated/prisma/client.js';
import { forbidden, unauthorized } from '../lib/http-error.js';
import { verifyAccessToken } from '../lib/jwt.js';
import { type Action, actionOf, can, type Resource } from '../lib/permissions.js';
import { requestContext, runWithContext } from '../lib/request-context.js';
import { findSessionUser } from '../modules/auth/auth.service.js';
import type { AuthUser } from '../modules/auth/auth.types.js';

/** Makes the caller (IP, and the user once authenticated) available to services, e.g. auditing. */
export const withRequestContext: RequestHandler = (req, _res, next) =>
  runWithContext({ user: null, ipAddress: req.ip ?? null }, next);

/** Verifies the bearer token and attaches the (still active) user to `req.user`. */
export const requireAuth: RequestHandler = async (req, _res, next) => {
  const header = req.headers.authorization;
  const token = header?.startsWith('Bearer ') ? header.slice(7) : undefined;
  if (!token) throw unauthorized();

  const claims = await verifyAccessToken(token);
  const user = claims ? await findSessionUser(claims.userId, claims.issuedAt) : null;
  if (!user) throw unauthorized('Invalid or expired token');

  req.user = user;
  const context = requestContext();
  if (context) context.user = user;
  next();
};

export const requireRole =
  (...roles: Role[]): RequestHandler =>
  (req, _res, next) => {
    if (!req.user) throw unauthorized();
    if (!roles.includes(req.user.role)) throw forbidden();
    next();
  };

export function currentUser(req: Request): AuthUser {
  if (!req.user) throw unauthorized();
  return req.user;
}

/** Throws 403 unless the current user's role may perform `action` on `resource`. */
export function assertCan(req: Request, resource: Resource, action: Action = 'read') {
  if (!can(currentUser(req).role, resource, action)) throw forbidden();
}

/**
 * Permission guard for a resource. Without `action`, it follows the HTTP method
 * (GET → read, POST → create, PUT/PATCH → update, DELETE → delete).
 */
export const authorize =
  (resource: Resource, action?: Action): RequestHandler =>
  (req, _res, next) => {
    assertCan(req, resource, action ?? actionOf(req.method));
    next();
  };
