import { getGlobalContent } from '@/lib/cms/global-content';

import type { Locale } from './config';
import type { Dictionary } from './types';

/* The switch names the other language in that language, so it is fixed rather than CMS copy. */
const language: Record<Locale, Dictionary['language']> = {
  ar: { toggle: 'EN', toggleLabel: 'Switch to English' },
  en: { toggle: 'AR', toggleLabel: 'التبديل إلى العربية' },
};

/** UI labels of the client chrome (toggles, menu button, cursor), from the global content. */
export async function getDictionary(locale: Locale): Promise<Dictionary> {
  const { labels, buttons } = await getGlobalContent(locale);
  return {
    language: language[locale],
    theme: { toggleLabel: labels.themeToggle, title: labels.themeTitle },
    menu: { open: labels.menuOpen, close: labels.menuClose },
    toTop: labels.toTop,
    film: { close: buttons.close },
    cursor: { view: labels.cursorView, explore: labels.cursorExplore, click: labels.cursorClick },
  };
}
