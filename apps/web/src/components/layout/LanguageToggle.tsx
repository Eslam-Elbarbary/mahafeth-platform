'use client';

import { usePathname, useRouter } from 'next/navigation';

import { localizePath, otherLocale } from '@/lib/i18n/config';
import { useDictionary } from '@/lib/i18n/dictionary-provider';
import { useLocale } from '@/lib/i18n/locale-provider';

/** EN / AR switch — swaps the locale segment in place, keeping the hash and scroll position. */
export function LanguageToggle() {
  const { locale, rememberLocale } = useLocale();
  const dict = useDictionary();
  const router = useRouter();
  const pathname = usePathname();
  const next = otherLocale(locale);

  return (
    <button
      className="language"
      id="language"
      type="button"
      dir="ltr"
      lang={next}
      aria-label={dict.language.toggleLabel}
      title={dict.language.toggleLabel}
      onClick={() => {
        rememberLocale(next);
        router.replace(`${localizePath(pathname, next)}${window.location.hash}`, { scroll: false });
      }}
    >
      {dict.language.toggle}
    </button>
  );
}
