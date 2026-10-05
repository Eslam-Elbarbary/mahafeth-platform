import { env } from '@/lib/env';

const TOKEN_KEY = 'mahafeth.admin.token';

export class ApiError extends Error {
  constructor(
    /** HTTP status, or `0` when the backend could not be reached. */
    readonly status: number,
    message: string,
    readonly code?: string,
    readonly details?: unknown,
  ) {
    super(message);
    this.name = 'ApiError';
  }

  /** Network failure, proxy error or 5xx — the backend is down, not the request wrong. */
  get isUnavailable() {
    return this.status === 0 || this.status >= 500;
  }
}

/** Access token issued by `POST /auth/login`. */
export const authToken = {
  get: () => localStorage.getItem(TOKEN_KEY),
  set: (token: string) => localStorage.setItem(TOKEN_KEY, token),
  clear: () => localStorage.removeItem(TOKEN_KEY),
};

type UnauthorizedListener = () => void;
const unauthorizedListeners = new Set<UnauthorizedListener>();

/** Called when an authenticated request is rejected with 401 (expired or revoked token). */
export function onUnauthorized(listener: UnauthorizedListener) {
  unauthorizedListeners.add(listener);
  return () => void unauthorizedListeners.delete(listener);
}

type ErrorBody = { error?: { message?: string; code?: string; details?: unknown } };

/** Thin fetch wrapper around the backend (`apps/backend`, mounted at `/api/v1`). */
export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const token = authToken.get();
  const isForm = init?.body instanceof FormData;

  let res: Response;
  try {
    res = await fetch(`${env.apiUrl}${path}`, {
      credentials: 'include',
      ...init,
      headers: {
        ...(!isForm && { 'Content-Type': 'application/json' }),
        ...(token && { Authorization: `Bearer ${token}` }),
        ...init?.headers,
      },
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') throw error;
    throw new ApiError(0, 'The server could not be reached', 'NETWORK_ERROR');
  }

  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as ErrorBody;
    if (res.status === 401 && token) unauthorizedListeners.forEach((listener) => listener());
    throw new ApiError(
      res.status,
      body.error?.message ?? (res.statusText || 'Request failed'),
      body.error?.code,
      body.error?.details,
    );
  }
  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

export const jsonBody = (value: unknown): RequestInit['body'] => JSON.stringify(value);
