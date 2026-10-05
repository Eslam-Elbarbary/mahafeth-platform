import type { LeadershipMember, TeamMember } from '@/content/types';
import type { Locale } from '@/lib/i18n/config';

import type { CmsTeamMember } from '../types';
import { paragraphs, pick, placeholderImage, toMediaAsset } from './common';

/* CMS team member → view models. Empty CMS text falls back to the other language. */

export function toTeamMember(member: CmsTeamMember, locale: Locale): TeamMember {
  const name = pick(member.nameAr, member.nameEn, locale) ?? '';
  return {
    id: member.id,
    name,
    role: pick(member.positionAr, member.positionEn, locale) ?? '',
    bio: paragraphs(pick(member.bioAr, member.bioEn, locale)),
    photo: member.photo ? toMediaAsset(member.photo, locale, name) : null,
  };
}

/** A slide of the leadership track: the whole biography as the message, a placeholder portrait if none. */
export function toLeadershipMember(member: TeamMember): LeadershipMember {
  return {
    id: member.id,
    name: member.name,
    role: member.role,
    quote: member.bio.join('\n\n'),
    photo: member.photo ?? { ...placeholderImage, alt: member.name },
  };
}
