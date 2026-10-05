import { z } from 'zod';

import {
  booleanQuery,
  longText,
  mediaId,
  requiredText,
  searchQuery,
  sortOrder,
} from '../../lib/schemas.js';

export const listTeamQuery = searchQuery.extend({
  visible: booleanQuery,
});

/* Fields shared by create and update — no defaults here, so a partial update never resets them. */
const teamMemberFields = {
  nameAr: requiredText(160),
  nameEn: requiredText(160),
  positionAr: requiredText(160),
  positionEn: requiredText(160),
  bioAr: longText,
  bioEn: longText,
  photoId: mediaId,
  order: sortOrder,
  visible: z.boolean(),
};

export const createTeamMemberBody = z.object({
  ...teamMemberFields,
  order: teamMemberFields.order.default(0),
  visible: teamMemberFields.visible.default(true),
});

export const updateTeamMemberBody = z.object(teamMemberFields).partial();
