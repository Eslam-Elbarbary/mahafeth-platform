'use client';

import { useSyncExternalStore } from 'react';

export const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)';
export const FINE_POINTER_QUERY = '(hover:hover) and (pointer:fine)';

function useMediaQuery(query: string, serverValue = false): boolean {
  return useSyncExternalStore(
    (onChange) => {
      const mql = matchMedia(query);
      mql.addEventListener('change', onChange);
      return () => mql.removeEventListener('change', onChange);
    },
    () => matchMedia(query).matches,
    () => serverValue,
  );
}

export const useReducedMotion = () => useMediaQuery(REDUCED_MOTION_QUERY);
export const useFinePointer = () => useMediaQuery(FINE_POINTER_QUERY);
