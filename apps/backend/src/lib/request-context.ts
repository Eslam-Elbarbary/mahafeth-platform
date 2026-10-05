import { AsyncLocalStorage } from 'node:async_hooks';

import type { AuthUser } from '../modules/auth/auth.types.js';

export interface RequestContext {
  user: AuthUser | null;
  ipAddress: string | null;
}

const storage = new AsyncLocalStorage<RequestContext>();

/** Runs `fn` (the rest of the request) with `context` available to services, e.g. for auditing. */
export const runWithContext = <T>(context: RequestContext, fn: () => T) => storage.run(context, fn);

export const requestContext = (): RequestContext | undefined => storage.getStore();
