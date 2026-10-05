import { z } from 'zod';

import { booleanQuery, mediaId, requiredText, searchQuery, sortOrder } from '../../lib/schemas.js';

export const listPartnersQuery = searchQuery.extend({
  visible: booleanQuery,
});

/* Fields shared by create and update — no defaults here, so a partial update never resets them. */
const partnerFields = {
  nameAr: requiredText(160),
  nameEn: requiredText(160),
  websiteUrl: z
    .url({ protocol: /^https?$/ })
    .max(500)
    .nullish(),
  logoId: mediaId,
  order: sortOrder,
  visible: z.boolean(),
};

export const createPartnerBody = z.object({
  ...partnerFields,
  order: partnerFields.order.default(0),
  visible: partnerFields.visible.default(true),
});

export const updatePartnerBody = z.object(partnerFields).partial();
