import { cache } from 'react';

import { getSiteContent } from '@/content/site';
import type { SiteContent } from '@/content/types';
import type { Locale } from '@/lib/i18n/config';

import { getGlobalContent } from './global-content';
import { getProjectNavigation } from './projects';
import { getServiceNavigation } from './services';
import { getSettings } from './settings';

/**
 * Site chrome (header, mega menu, footer) with the project and service links, the global
 * settings and the global content labels from the CMS.
 */
export const getSite = cache(async (locale: Locale): Promise<SiteContent> => {
  const [projects, services, settings, content] = await Promise.all([
    getProjectNavigation(locale),
    getServiceNavigation(locale),
    getSettings(locale),
    getGlobalContent(locale),
  ]);
  return getSiteContent({ projects, services }, settings, content);
});
