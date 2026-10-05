import { z } from 'zod';

import { optionalText, searchQuery } from '../../lib/schemas.js';

export const listMediaQuery = searchQuery.extend({
  /** Prefix match, e.g. `image/` or `video/mp4`. */
  type: z.string().trim().max(100).optional(),
});

const altFields = {
  altAr: optionalText(255),
  altEn: optionalText(255),
};

/** Pixel size measured by the uploader (multipart fields arrive as strings). */
const dimension = z.coerce.number().int().min(1).max(50_000).optional();

export const mediaMetaBody = z.object({ ...altFields, width: dimension, height: dimension });

export const updateMediaBody = z
  .object(altFields)
  .refine((v) => Object.keys(v).length > 0, { message: 'Nothing to update' });
