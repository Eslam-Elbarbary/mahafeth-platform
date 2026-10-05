export class HttpError extends Error {
  constructor(
    readonly status: number,
    message: string,
    readonly code?: string,
    readonly details?: unknown,
  ) {
    super(message);
    this.name = 'HttpError';
  }
}

export const badRequest = (message: string, details?: unknown) =>
  new HttpError(400, message, 'BAD_REQUEST', details);
export const unauthorized = (message = 'Authentication required') =>
  new HttpError(401, message, 'UNAUTHORIZED');
export const forbidden = (message = 'Insufficient permissions') =>
  new HttpError(403, message, 'FORBIDDEN');
export const notFound = (resource = 'Resource') =>
  new HttpError(404, `${resource} not found`, 'NOT_FOUND');
export const conflict = (message: string) => new HttpError(409, message, 'CONFLICT');
