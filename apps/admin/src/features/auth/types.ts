/* Mirrors `apps/backend/src/modules/auth/auth.types.ts`. */

export type Role = 'SUPER_ADMIN' | 'ADMIN' | 'EDITOR';

/* Mirrors `apps/backend/src/lib/permissions.ts`; the matrix itself comes from the API. */
export type Resource =
  | 'projects'
  | 'services'
  | 'pages'
  | 'media'
  | 'team'
  | 'partners'
  | 'leads'
  | 'settings'
  | 'users'
  | 'auditLogs';
export type Action = 'read' | 'create' | 'update' | 'delete';
export type Permissions = Record<Resource, Action[]>;

export type AuthUser = {
  id: string;
  name: string;
  email: string;
  role: Role;
  permissions: Permissions;
};

export type LoginResult = {
  accessToken: string;
  tokenType: 'Bearer';
  user: AuthUser;
};

export type LoginInput = { email: string; password: string };

export type AuthStatus =
  /** Checking a stored token against `GET /auth/me`. */
  | 'loading'
  | 'authenticated'
  | 'unauthenticated'
  /** A token exists but the backend could not confirm it (down or unreachable). */
  | 'unavailable';

/** Why the user was sent to the login screen, shown as a notice there. */
export type SignedOutReason = 'expired' | 'logout' | null;
