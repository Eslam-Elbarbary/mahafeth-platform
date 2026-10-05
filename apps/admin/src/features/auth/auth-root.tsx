import { Outlet } from 'react-router';

import { AuthProvider } from './auth-provider';

/** Root route element: the session is available to every route, including `/login`. */
export function AuthRoot() {
  return (
    <AuthProvider>
      <Outlet />
    </AuthProvider>
  );
}
