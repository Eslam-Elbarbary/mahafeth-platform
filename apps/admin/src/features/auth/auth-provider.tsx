import { type ReactNode, useCallback, useEffect, useMemo, useState } from 'react';

import { ApiError, authToken, onUnauthorized } from '@/lib/api-client';

import { authApi } from './api';
import { AuthContext, type AuthContextValue } from './auth-context';
import type { AuthStatus, AuthUser, LoginInput, SignedOutReason } from './types';

type Session = { status: AuthStatus; user: AuthUser | null; signedOutReason: SignedOutReason };

const signedOut = (reason: SignedOutReason): Session => ({
  status: 'unauthenticated',
  user: null,
  signedOutReason: reason,
});

/**
 * Owns the admin session: the token in localStorage (`mahafeth.admin.token`), the current user
 * from `GET /auth/me`, and sign-out when any authenticated request comes back 401.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session>(() =>
    authToken.get() ? { status: 'loading', user: null, signedOutReason: null } : signedOut(null),
  );
  /** Bumped to re-run the token check. */
  const [check, setCheck] = useState(0);

  const needsCheck = session.status === 'loading';

  useEffect(() => {
    if (!needsCheck) return;
    const controller = new AbortController();
    authApi
      .me(controller.signal)
      .then((user) => setSession({ status: 'authenticated', user, signedOutReason: null }))
      .catch((error: unknown) => {
        if (controller.signal.aborted) return;
        if (error instanceof ApiError && error.isUnavailable) {
          setSession({ status: 'unavailable', user: null, signedOutReason: null });
          return;
        }
        authToken.clear();
        setSession(signedOut('expired'));
      });
    return () => controller.abort();
  }, [needsCheck, check]);

  useEffect(
    () =>
      onUnauthorized(() => {
        authToken.clear();
        setSession(signedOut('expired'));
      }),
    [],
  );

  const login = useCallback(async ({ email, password }: LoginInput) => {
    const result = await authApi.login({ email: email.trim(), password });
    authToken.set(result.accessToken);
    setSession({ status: 'authenticated', user: result.user, signedOutReason: null });
    return result.user;
  }, []);

  const logout = useCallback(() => {
    authToken.clear();
    setSession(signedOut('logout'));
  }, []);

  const retry = useCallback(() => {
    if (!authToken.get()) {
      setSession(signedOut(null));
      return;
    }
    setSession({ status: 'loading', user: null, signedOutReason: null });
    setCheck((n) => n + 1);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({ ...session, login, logout, retry }),
    [session, login, logout, retry],
  );

  return <AuthContext value={value}>{children}</AuthContext>;
}
