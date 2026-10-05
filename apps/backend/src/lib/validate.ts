import { z } from 'zod';

import { HttpError } from './http-error.js';

/** Parses `data` with `schema`, throwing a 400 with field issues on failure. */
export function parse<T extends z.ZodType>(schema: T, data: unknown): z.output<T> {
  const result = schema.safeParse(data);
  if (!result.success) {
    throw new HttpError(400, 'Validation failed', 'VALIDATION_ERROR', z.flattenError(result.error));
  }
  return result.data;
}
