import type { InterestKey } from '@/content/types';

/** Contact-form deep link that keeps the chosen project and interest in the URL. */
export function projectInterestHref(slug: string, interest: InterestKey = 'own'): string {
  return `/contact?project=${encodeURIComponent(slug)}&interest=${interest}#interest`;
}
