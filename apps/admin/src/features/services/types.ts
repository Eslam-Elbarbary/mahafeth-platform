/* Mirrors `apps/backend/src/modules/services` request/response shapes. */
import type { MediaSummary } from '@/features/media/types';
import type { PublishStatus } from '@/features/projects/types';

export { PUBLISH_STATUSES, publishMeta, type PublishStatus } from '@/features/projects/types';

export type Service = {
  id: string;
  slug: string;
  titleAr: string;
  titleEn: string;
  summaryAr: string | null;
  summaryEn: string | null;
  descriptionAr: string | null;
  descriptionEn: string | null;
  icon: string | null;
  imageId: string | null;
  image: MediaSummary | null;
  order: number;
  status: PublishStatus;
  metaTitleAr: string | null;
  metaTitleEn: string | null;
  metaDescriptionAr: string | null;
  metaDescriptionEn: string | null;
  createdAt: string;
  updatedAt: string;
};

export type ServiceInput = Omit<Service, 'id' | 'image' | 'createdAt' | 'updatedAt'>;
