import type { Role } from '../generated/prisma/client.js';

export const RESOURCES = [
  'projects',
  'services',
  'pages',
  'media',
  'team',
  'partners',
  'leads',
  'settings',
  'users',
  'auditLogs',
] as const;
export type Resource = (typeof RESOURCES)[number];

export const ACTIONS = ['read', 'create', 'update', 'delete'] as const;
export type Action = (typeof ACTIONS)[number];

export type Permissions = Record<Resource, Action[]>;

/** Website content, including Global Content copy (stored as settings, governed by `pages`). */
const CONTENT: Resource[] = ['projects', 'services', 'pages', 'media', 'team', 'partners'];

const grant = (resources: readonly Resource[]): Permissions =>
  Object.fromEntries(
    RESOURCES.map((resource) => [resource, resources.includes(resource) ? [...ACTIONS] : []]),
  ) as Permissions;

/**
 * Role → allowed actions per resource. SUPER_ADMIN has full access; ADMIN manages content and
 * leads; EDITOR manages content only. Users, site settings and the audit log are SUPER_ADMIN only.
 */
const matrix: Record<Role, Permissions> = {
  SUPER_ADMIN: grant(RESOURCES),
  ADMIN: grant([...CONTENT, 'leads']),
  EDITOR: grant(CONTENT),
};

export const permissionsOf = (role: Role): Permissions => matrix[role];

export const can = (role: Role, resource: Resource, action: Action = 'read') =>
  matrix[role][resource].includes(action);

/** HTTP method → the action it performs. */
export function actionOf(method: string): Action {
  switch (method.toUpperCase()) {
    case 'POST':
      return 'create';
    case 'PUT':
    case 'PATCH':
      return 'update';
    case 'DELETE':
      return 'delete';
    default:
      return 'read';
  }
}
