/* Mirrors `apps/backend/src/modules/partners` request/response shapes. */
import type { MediaSummary } from '@/features/media/types';

export type Partner = {
  id: string;
  nameAr: string;
  nameEn: string;
  websiteUrl: string | null;
  logoId: string | null;
  logo: MediaSummary | null;
  order: number;
  visible: boolean;
  createdAt: string;
  updatedAt: string;
};

export type PartnerInput = Omit<Partner, 'id' | 'logo' | 'createdAt' | 'updatedAt'>;
