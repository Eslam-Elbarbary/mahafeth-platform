import { createContext, useCallback, useContext } from 'react';

import type { Action, AuthStatus, AuthUser, LoginInput, Resource, SignedOutReason } from './types';

export type AuthContextValue = {
  status: AuthStatus;
  user: AuthUser | null;
  signedOutReason: SignedOutReason;
  /** Stores the token and user; throws `ApiError` on failure. */
  login: (input: LoginInput) => Promise<AuthUser>;
  logout: () => void;
  /** Re-checks the stored token (after the backend was unavailable). */
  retry: () => void;
};

export const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuth(): AuthContextValue {
  const value = useContext(AuthContext);
  if (!value) throw new Error('useAuth must be used inside <AuthProvider>');
  return value;
}

export const can = (user: AuthUser | null, resource: Resource, action: Action = 'read') =>
  Boolean(user?.permissions[resource]?.includes(action));

/** `can(resource, action?)` for the signed-in user; the API enforces the same rules. */
export function useCan() {
  const { user } = useAuth();
  return useCallback(
    (resource: Resource, action: Action = 'read') => can(user, resource, action),
    [user],
  );
}
