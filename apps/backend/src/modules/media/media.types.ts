import type { z } from 'zod';

import type { listMediaQuery, mediaMetaBody, updateMediaBody } from './media.schema.js';

export type ListMediaQuery = z.infer<typeof listMediaQuery>;
export type MediaMetaInput = z.infer<typeof mediaMetaBody>;
export type UpdateMediaInput = z.infer<typeof updateMediaBody>;

export interface UploadedFile {
  filename: string;
  originalname: string;
  mimetype: string;
  size: number;
}
