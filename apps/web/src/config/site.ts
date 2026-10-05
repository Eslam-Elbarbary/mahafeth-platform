export const siteConfig = {
  url: process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000',
  apiUrl: process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api/v1',
  filmUrl: process.env.NEXT_PUBLIC_FILM_URL ?? '',
  themeColor: {
    dark: '#000000',
    light: '#ebe2d1',
  },
  motion: {
    smoothScroll: process.env.NEXT_PUBLIC_SMOOTH_SCROLL === 'true',
  },
} as const;
