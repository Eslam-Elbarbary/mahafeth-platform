import { cache } from 'react';

import { fallbackTeam } from '@/content/fallback/team';
import type { LeadershipMember, TeamMember } from '@/content/types';
import type { Locale } from '@/lib/i18n/config';

import { cmsFetch } from './client';
import { toLeadershipMember, toTeamMember } from './mappers/team';
import type { CmsList, CmsTeamMember } from './types';

/*
 * Team / leadership data source. The CMS is authoritative whenever it serves at least one visible
 * member; if it is disabled, unreachable or empty, the bundled leadership members are used.
 */

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

const isMember = (value: unknown): value is CmsTeamMember =>
  isObject(value) &&
  typeof value.id === 'string' &&
  typeof value.nameAr === 'string' &&
  typeof value.nameEn === 'string';

const isList = (body: unknown): body is CmsList<CmsTeamMember> =>
  isObject(body) && Array.isArray(body.data) && body.data.every(isMember);

/** Visible CMS members in display order, or `null` when the fallback should be used. */
const loadVisible = cache(async (): Promise<CmsTeamMember[] | null> => {
  const result = await cmsFetch('/team', { tags: ['cms:team'], isValid: isList });
  return result.state === 'ok' && result.data.data.length > 0 ? result.data.data : null;
});

/** Every visible team member, in the CMS order. */
export async function getTeam(locale: Locale): Promise<TeamMember[]> {
  const members = await loadVisible();
  if (!members) return fallbackTeam(locale);
  return members.map((member) => toTeamMember(member, locale));
}

/** Slides of the leadership track (homepage and `/leadership`). */
export async function getLeadershipMembers(locale: Locale): Promise<LeadershipMember[]> {
  return (await getTeam(locale)).map(toLeadershipMember);
}
