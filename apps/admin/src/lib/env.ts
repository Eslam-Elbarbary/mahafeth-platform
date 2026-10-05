export const env = {
  apiUrl: import.meta.env.VITE_API_URL ?? '/api/v1',
  /** Public website origin, for "view on site" links. */
  siteUrl: (import.meta.env.VITE_SITE_URL ?? 'http://localhost:3000').replace(/\/$/, ''),
} as const;
