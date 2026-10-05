import type { z } from 'zod';

import type { createTeamMemberBody, listTeamQuery, updateTeamMemberBody } from './team.schema.js';

export type ListTeamQuery = z.infer<typeof listTeamQuery>;
export type CreateTeamMemberInput = z.infer<typeof createTeamMemberBody>;
export type UpdateTeamMemberInput = z.infer<typeof updateTeamMemberBody>;
