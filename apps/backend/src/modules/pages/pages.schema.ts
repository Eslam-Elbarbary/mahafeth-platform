import { z } from 'zod';

import { PublishStatus } from '../../generated/prisma/client.js';
import { mediaId, optionalText, requiredText, searchQuery, slug } from '../../lib/schemas.js';

export const listPagesQuery = searchQuery.extend({
  status: z.enum(PublishStatus).optional(),
});

/* Fields shared by create and update — no defaults here, so a partial update never resets them. */
const pageFields = {
  slug,
  titleAr: requiredText(255),
  titleEn: requiredText(255),
  metaTitleAr: optionalText(255),
  metaTitleEn: optionalText(255),
  metaDescriptionAr: optionalText(320),
  metaDescriptionEn: optionalText(320),
  ogImageId: mediaId,
  status: z.enum(PublishStatus),
};

export const createPageBody = z.object({
  ...pageFields,
  status: pageFields.status.default(PublishStatus.DRAFT),
});

export const updatePageBody = z.object(pageFields).partial();
