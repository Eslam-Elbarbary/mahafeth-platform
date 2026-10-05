import type { ErrorRequestHandler } from 'express';
import multer from 'multer';

import { isProduction } from '../config/env.js';
import { Prisma } from '../generated/prisma/client.js';
import { HttpError } from '../lib/http-error.js';

/** Normalizes known library errors into HttpErrors. */
function toHttpError(err: unknown): HttpError | undefined {
  if (err instanceof HttpError) return err;

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    switch (err.code) {
      case 'P2002':
        return new HttpError(409, 'A record with this value already exists', 'CONFLICT');
      case 'P2003':
        return new HttpError(409, 'Related record does not exist or is in use', 'RELATION_ERROR');
      case 'P2025':
        return new HttpError(404, 'Resource not found', 'NOT_FOUND');
    }
  }

  if (err instanceof multer.MulterError) {
    const status = err.code === 'LIMIT_FILE_SIZE' ? 413 : 400;
    return new HttpError(status, err.message, err.code);
  }

  if (err instanceof SyntaxError && 'body' in err) {
    return new HttpError(400, 'Malformed JSON body', 'BAD_JSON');
  }

  return undefined;
}

export const errorHandler: ErrorRequestHandler = (err: unknown, req, res, _next) => {
  const httpError = toHttpError(err);
  const status = httpError?.status ?? 500;
  const message =
    httpError?.message ??
    (isProduction ? 'Internal server error' : err instanceof Error ? err.message : String(err));

  if (status >= 500) req.log.error({ err }, message);

  res.status(status).json({
    error: {
      message,
      code: httpError?.code ?? 'INTERNAL_ERROR',
      ...(httpError?.details !== undefined && { details: httpError.details }),
    },
  });
};
