import type { z } from 'zod';

import type {
  addProjectImageBody,
  adminListProjectsQuery,
  createProjectBody,
  publicListProjectsQuery,
  updateProjectBody,
  updateProjectImageBody,
} from './projects.schema.js';

export type PublicListProjectsQuery = z.infer<typeof publicListProjectsQuery>;
export type AdminListProjectsQuery = z.infer<typeof adminListProjectsQuery>;
export type CreateProjectInput = z.infer<typeof createProjectBody>;
export type UpdateProjectInput = z.infer<typeof updateProjectBody>;
export type AddProjectImageInput = z.infer<typeof addProjectImageBody>;
export type UpdateProjectImageInput = z.infer<typeof updateProjectImageBody>;
