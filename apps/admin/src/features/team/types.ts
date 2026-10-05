/* Mirrors `apps/backend/src/modules/team` request/response shapes. */
import type { MediaSummary } from '@/features/media/types';

export type TeamMember = {
  id: string;
  nameAr: string;
  nameEn: string;
  positionAr: string;
  positionEn: string;
  bioAr: string | null;
  bioEn: string | null;
  photoId: string | null;
  photo: MediaSummary | null;
  order: number;
  visible: boolean;
  createdAt: string;
  updatedAt: string;
};

export type TeamMemberInput = Omit<TeamMember, 'id' | 'photo' | 'createdAt' | 'updatedAt'>;
