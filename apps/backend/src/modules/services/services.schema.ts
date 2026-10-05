import { z } from 'zod';

import { PublishStatus } from '../../generated/prisma/client.js';
import {
  longText,
  mediaId,
  optionalText,
  requiredText,
  searchQuery,
  slug,
  sortOrder,
} from '../../lib/schemas.js';

export const listServicesQuery = searchQuery.extend({
  status: z.enum(PublishStatus).optional(),
});

/* Fields shared by create and update — no defaults here, so a partial update never resets them. */
const serviceFields = {
  slug,
  titleAr: requiredText(255),
  titleEn: requiredText(255),
  summaryAr: optionalText(500),
  summaryEn: optionalText(500),
  descriptionAr: longText,
  descriptionEn: longText,
  icon: optionalText(80),
  imageId: mediaId,
  order: sortOrder,
  status: z.enum(PublishStatus),
  metaTitleAr: optionalText(255),
  metaTitleEn: optionalText(255),
  metaDescriptionAr: optionalText(500),
  metaDescriptionEn: optionalText(500),
};

export const createServiceBody = z.object({
  ...serviceFields,
  order: serviceFields.order.default(0),
  status: serviceFields.status.default(PublishStatus.DRAFT),
});

export const updateServiceBody = z.object(serviceFields).partial();
