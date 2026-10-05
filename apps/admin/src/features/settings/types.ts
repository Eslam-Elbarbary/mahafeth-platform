/* Mirrors `apps/backend/src/modules/settings` (see `settings.catalog.ts` for the known keys). */

export type Setting = {
  id: string;
  key: string;
  value: unknown;
  group: string;
  isPublic: boolean;
  description: string | null;
  createdAt: string;
  updatedAt: string;
};

export type SettingInput = { key: string; value: unknown };

export type MediaRef = { mediaId: string | null };

export type Branch = {
  cityAr: string;
  cityEn: string;
  addressAr: string;
  addressEn: string;
  phone: string;
};

export type LegalLink = { titleAr: string; titleEn: string; url: string };
