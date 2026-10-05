type Method = 'get' | 'post' | 'put' | 'patch' | 'delete';
type Endpoint = [method: Method, path: string, summary: string, secured?: boolean];

/**
 * Route placeholders for Swagger UI. Request/response schemas are not described yet;
 * keep this list in sync with src/routes/index.ts.
 */
const endpoints: Record<string, Endpoint[]> = {
  Health: [
    ['get', '/health', 'Liveness probe'],
    ['get', '/health/db', 'Database connectivity probe'],
  ],
  Auth: [
    ['post', '/auth/login', 'Exchange email + password for a bearer token'],
    ['get', '/auth/me', 'Current user', true],
    ['post', '/auth/change-password', 'Change own password', true],
  ],
  'Public content': [
    ['get', '/settings', 'Public settings nested by group (?format=flat: key → value map)'],
    ['get', '/pages/{slug}', 'Published page with visible sections and their referenced media'],
    [
      'get',
      '/projects',
      'Published projects with details and first COVER image (filters: city, status, featured)',
    ],
    [
      'get',
      '/projects/{slug}',
      'Published project with details (units, sizeRange, completionYear, features, latitude/longitude) and categorized images (COVER, GALLERY, FLOOR_PLAN)',
    ],
    ['get', '/services', 'Published services'],
    ['get', '/services/{slug}', 'Published service'],
    ['get', '/team', 'Visible team members'],
    ['get', '/partners', 'Visible partners'],
    ['post', '/leads', 'Submit the interest form'],
  ],
  'Admin · Dashboard': [
    ['get', '/admin/dashboard/summary', 'Content and lead counts (leads null for editors)', true],
    ['get', '/admin/dashboard/leads-chart', 'Daily leads for the last N days (days)', true],
    ['get', '/admin/dashboard/top-projects', 'Projects ranked by leads (limit, days)', true],
    ['get', '/admin/dashboard/activity', 'Recent CMS changes, newest first (limit)', true],
  ],
  'Admin · Media': [
    ['get', '/admin/media', 'List media (filters: type, q)', true],
    ['post', '/admin/media', 'Upload a file (multipart: file, altAr, altEn, width, height)', true],
    ['get', '/admin/media/{id}', 'Get media item', true],
    ['patch', '/admin/media/{id}', 'Update alt texts', true],
    ['delete', '/admin/media/{id}', 'Soft-delete media item', true],
  ],
  'Admin · Settings': [
    ['get', '/admin/settings', 'List settings (filter: group)', true],
    ['put', '/admin/settings', 'Bulk upsert settings', true],
    ['get', '/admin/settings/{key}', 'Get setting', true],
    ['put', '/admin/settings/{key}', 'Upsert setting', true],
    ['delete', '/admin/settings/{key}', 'Delete setting', true],
  ],
  'Admin · Pages': [
    ['get', '/admin/pages', 'List pages', true],
    ['post', '/admin/pages', 'Create page', true],
    ['get', '/admin/pages/by-slug/{slug}', 'Get page with sections by slug', true],
    ['get', '/admin/pages/{id}', 'Get page with sections', true],
    ['patch', '/admin/pages/{id}', 'Update page', true],
    ['delete', '/admin/pages/{id}', 'Soft-delete page (core pages are protected)', true],
  ],
  'Admin · Sections': [
    ['get', '/admin/sections', 'List sections of a page (query: pageId)', true],
    ['post', '/admin/sections', 'Create section', true],
    ['put', '/admin/sections/reorder', 'Reorder sections of a page', true],
    ['get', '/admin/sections/{id}', 'Get section', true],
    ['patch', '/admin/sections/{id}', 'Update section', true],
    ['delete', '/admin/sections/{id}', 'Delete section', true],
  ],
  'Admin · Projects': [
    ['get', '/admin/projects', 'List projects', true],
    ['post', '/admin/projects', 'Create project', true],
    ['get', '/admin/projects/{id}', 'Get project with gallery', true],
    ['patch', '/admin/projects/{id}', 'Update project', true],
    ['delete', '/admin/projects/{id}', 'Soft-delete project', true],
    ['put', '/admin/projects/reorder', 'Reorder projects', true],
    [
      'post',
      '/admin/projects/{id}/images',
      'Add image (category: COVER, GALLERY, FLOOR_PLAN)',
      true,
    ],
    ['put', '/admin/projects/{id}/images/reorder', 'Reorder images', true],
    ['patch', '/admin/projects/{id}/images/{imageId}', 'Update image caption/order/category', true],
    ['delete', '/admin/projects/{id}/images/{imageId}', 'Remove image', true],
  ],
  'Admin · Services': [
    ['get', '/admin/services', 'List services', true],
    ['post', '/admin/services', 'Create service', true],
    ['put', '/admin/services/reorder', 'Reorder services', true],
    ['get', '/admin/services/{id}', 'Get service', true],
    ['patch', '/admin/services/{id}', 'Update service', true],
    ['delete', '/admin/services/{id}', 'Soft-delete service', true],
  ],
  'Admin · Team': [
    ['get', '/admin/team', 'List team members', true],
    ['post', '/admin/team', 'Create team member', true],
    ['put', '/admin/team/reorder', 'Reorder team', true],
    ['get', '/admin/team/{id}', 'Get team member', true],
    ['patch', '/admin/team/{id}', 'Update team member', true],
    ['delete', '/admin/team/{id}', 'Soft-delete team member', true],
  ],
  'Admin · Partners': [
    ['get', '/admin/partners', 'List partners', true],
    ['post', '/admin/partners', 'Create partner', true],
    ['put', '/admin/partners/reorder', 'Reorder partners', true],
    ['get', '/admin/partners/{id}', 'Get partner', true],
    ['patch', '/admin/partners/{id}', 'Update partner', true],
    ['delete', '/admin/partners/{id}', 'Soft-delete partner', true],
  ],
  'Admin · Leads': [
    [
      'get',
      '/admin/leads',
      'List leads (filters: status, source, interestType, city, projectId, assignedToId, from, to, q)',
      true,
    ],
    ['get', '/admin/leads/stats', 'Lead counts per status', true],
    ['get', '/admin/leads/assignees', 'Users a lead can be assigned to', true],
    ['get', '/admin/leads/{id}', 'Get lead', true],
    ['patch', '/admin/leads/{id}', 'Update lead status/notes/assignee', true],
    ['delete', '/admin/leads/{id}', 'Soft-delete lead', true],
  ],
  'Admin · Users (super admin)': [
    ['get', '/admin/users', 'List users (filters: q, role, status=ACTIVE|INACTIVE)', true],
    ['post', '/admin/users', 'Create user { name, email, role, isActive, password }', true],
    ['get', '/admin/users/stats', 'User counts: total, active, inactive, per role', true],
    ['get', '/admin/users/{id}', 'Get user', true],
    [
      'patch',
      '/admin/users/{id}',
      'Update name/email/role/isActive (not your own role or status; keeps one active super admin)',
      true,
    ],
    ['post', '/admin/users/{id}/reset-password', 'Set a new password { password }', true],
    [
      'delete',
      '/admin/users/{id}',
      'Soft-delete user (not yourself, not the last super admin)',
      true,
    ],
  ],
  'Admin · Audit log (super admin)': [
    [
      'get',
      '/admin/audit-logs',
      'Changes, newest first (filters: entity, action, userId, entityId, from, to, q)',
      true,
    ],
  ],
};

function pathParameters(path: string) {
  return [...path.matchAll(/\{(\w+)\}/g)].map(([, name]) => ({
    name,
    in: 'path',
    required: true,
    schema: { type: 'string' },
  }));
}

function buildPaths() {
  const paths: Record<string, Record<string, unknown>> = {};
  for (const [tag, list] of Object.entries(endpoints)) {
    for (const [method, path, summary, secured] of list) {
      const parameters = pathParameters(path);
      (paths[path] ??= {})[method] = {
        tags: [tag],
        summary,
        ...(parameters.length > 0 && { parameters }),
        ...(secured && { security: [{ bearerAuth: [] }] }),
        responses: { default: { description: 'See implementation' } },
      };
    }
  }
  return paths;
}

export const openApiDocument = {
  openapi: '3.1.0',
  info: {
    title: 'Mahafeth CMS API',
    version: '1.0.0',
    description:
      'Responses use `{ data }` (lists add `meta`); errors use `{ error: { message, code, details? } }`.',
  },
  servers: [{ url: '/api/v1' }],
  components: {
    securitySchemes: {
      bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
    },
  },
  paths: buildPaths(),
};
