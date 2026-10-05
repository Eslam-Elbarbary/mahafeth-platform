/* Mirrors `apps/backend/src/modules/media`. */

/** Fields embedded wherever another model references a media item. */
export type MediaSummary = {
  id: string;
  url: string;
  mimeType: string;
  width: number | null;
  height: number | null;
  altAr: string | null;
  altEn: string | null;
};

export type MediaUsage = {
  projectCovers: number;
  projectImages: number;
  sections: number;
  pageOgImages: number;
  services: number;
  teamMemberPhotos: number;
  partnerLogos: number;
};

export type MediaItem = MediaSummary & {
  filename: string;
  originalName: string;
  size: number;
  createdAt: string;
  updatedAt: string;
  _count?: MediaUsage;
};

export const usageTotal = (item: Pick<MediaItem, '_count'>) =>
  item._count ? Object.values(item._count).reduce((sum, n) => sum + n, 0) : 0;

export const ACCEPTED_IMAGE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/avif',
  'image/gif',
];
export const MAX_UPLOAD_MB = 20;
