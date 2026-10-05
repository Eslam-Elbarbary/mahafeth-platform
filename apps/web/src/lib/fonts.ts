import localFont from 'next/font/local';

/*
 * Thmanyah Sans (UI) + Thmanyah Serif Display (headings) — same files and weights as the
 * design source. `preload: false` matches the original `font-display: swap` loading; the
 * intro/hero wait on `document.fonts.ready`, exactly like the legacy `app.js`.
 */
export const thmanyahSans = localFont({
  src: [
    { path: '../fonts/thmanyah-sans/thmanyah-sans-Light.woff2', weight: '300', style: 'normal' },
    { path: '../fonts/thmanyah-sans/thmanyah-sans-Regular.woff2', weight: '400', style: 'normal' },
    { path: '../fonts/thmanyah-sans/thmanyah-sans-Medium.woff2', weight: '500', style: 'normal' },
    { path: '../fonts/thmanyah-sans/thmanyah-sans-Bold.woff2', weight: '700', style: 'normal' },
    { path: '../fonts/thmanyah-sans/thmanyah-sans-Black.woff2', weight: '900', style: 'normal' },
  ],
  variable: '--font-thmanyah-sans',
  display: 'swap',
  preload: false,
  fallback: ['system-ui', '-apple-system', 'Segoe UI', 'Tahoma', 'sans-serif'],
});

export const thmanyahSerif = localFont({
  src: [
    {
      path: '../fonts/thmanyah-serif-display/thmanyah-serif-display-Light.woff2',
      weight: '300',
      style: 'normal',
    },
    {
      path: '../fonts/thmanyah-serif-display/thmanyah-serif-display-Regular.woff2',
      weight: '400',
      style: 'normal',
    },
    {
      path: '../fonts/thmanyah-serif-display/thmanyah-serif-display-Medium.woff2',
      weight: '500',
      style: 'normal',
    },
    {
      path: '../fonts/thmanyah-serif-display/thmanyah-serif-display-Bold.woff2',
      weight: '700',
      style: 'normal',
    },
    {
      path: '../fonts/thmanyah-serif-display/thmanyah-serif-display-Black.woff2',
      weight: '900',
      style: 'normal',
    },
  ],
  variable: '--font-thmanyah-serif',
  display: 'swap',
  preload: false,
  fallback: ['serif'],
});

export const fontVariables = `${thmanyahSans.variable} ${thmanyahSerif.variable}`;
