import type { Metadata, Viewport } from 'next';
import { notFound } from 'next/navigation';
import type { ReactNode } from 'react';

import { FloatingContact } from '@/components/layout/FloatingContact';
import { Header } from '@/components/layout/Header';
import { PageTransitionCurtain } from '@/components/layout/PageTransitionCurtain';
import { ToTop } from '@/components/layout/ToTop';
import { CustomCursor } from '@/components/overlays/CustomCursor';
import { siteConfig } from '@/config/site';
import { getSettings } from '@/lib/cms/settings';
import { getSite } from '@/lib/cms/site';
import { fontVariables } from '@/lib/fonts';
import { isLocale, localeDirection, locales } from '@/lib/i18n/config';
import { DictionaryProvider } from '@/lib/i18n/dictionary-provider';
import { getDictionary } from '@/lib/i18n/get-dictionary';
import { LocaleProvider } from '@/lib/i18n/locale-provider';
import { AnchorScroll } from '@/lib/motion/anchor-scroll';
import { MotionProvider } from '@/lib/motion/motion-provider';
import { BootScript } from '@/lib/theme/boot-script';
import { ThemeProvider } from '@/lib/theme/theme-provider';

import '../globals.css';

type LayoutProps = {
  children: ReactNode;
  params: Promise<{ locale: string }>;
};

/* No `dynamicParams = false` here: Next applies it to every child segment, which would 404 CMS
 * projects published after the build. Unknown locales are redirected by the proxy and rejected
 * with `notFound()` below. */
export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: siteConfig.themeColor.dark,
};

export async function generateMetadata({ params }: LayoutProps): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const { companyName, favicon, seo } = await getSettings(locale);
  return {
    metadataBase: new URL(siteConfig.url),
    title: seo.title,
    description: seo.description,
    icons: { icon: favicon },
    alternates: {
      canonical: `/${locale}`,
      languages: { ar: '/ar', en: '/en', 'x-default': '/ar' },
    },
    openGraph: {
      type: 'website',
      siteName: companyName,
      title: seo.title,
      description: seo.description,
      locale,
      ...(seo.ogImage && { images: [{ url: seo.ogImage }] }),
    },
  };
}

export default async function LocaleLayout({ children, params }: LayoutProps) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const dictionary = await getDictionary(locale);
  const site = await getSite(locale);

  return (
    <html
      lang={locale}
      dir={localeDirection[locale]}
      data-theme="dark"
      className={fontVariables}
      suppressHydrationWarning
    >
      <head>
        <BootScript />
      </head>
      <body suppressHydrationWarning>
        <DictionaryProvider dictionary={dictionary}>
          <LocaleProvider locale={locale}>
            <ThemeProvider>
              <MotionProvider>
                <PageTransitionCurtain seal={site.brand.seal} />
                <AnchorScroll />
                <Header site={site} />
                {children}
                <ToTop />
                <CustomCursor />
                <FloatingContact site={site} />
              </MotionProvider>
            </ThemeProvider>
          </LocaleProvider>
        </DictionaryProvider>
      </body>
    </html>
  );
}
