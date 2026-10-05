import { z } from 'zod';

import {
  ProjectImageCategory,
  ProjectStatus,
  PublishStatus,
} from '../../generated/prisma/client.js';
import {
  booleanQuery,
  longText,
  mediaId,
  optionalText,
  paginationQuery,
  reorderBody,
  requiredText,
  searchQuery,
  sortOrder,
  slug,
} from '../../lib/schemas.js';

const city = z.string().trim().toLowerCase().min(1).max(60);

export const publicListProjectsQuery = paginationQuery.extend({
  city: city.optional(),
  status: z.enum(ProjectStatus).optional(),
  featured: booleanQuery,
});

export const adminListProjectsQuery = searchQuery.extend({
  city: city.optional(),
  status: z.enum(ProjectStatus).optional(),
  publishStatus: z.enum(PublishStatus).optional(),
  featured: booleanQuery,
});

/** Icon keys the website knows how to draw for a feature card. */
export const PROJECT_FEATURE_ICONS = [
  'plan',
  'key',
  'shield',
  'pin',
  'service',
  'calendar',
] as const;

const squareMetres = z.number().int().min(1).max(100_000);

export const sizeRange = z
  .object({ min: squareMetres, max: squareMetres })
  .refine((r) => r.min <= r.max, { message: 'min must be ≤ max', path: ['max'] });

export const projectFeature = z.object({
  icon: z.enum(PROJECT_FEATURE_ICONS).default('plan'),
  titleAr: requiredText(160),
  titleEn: requiredText(160),
  bodyAr: optionalText(500),
  bodyEn: optionalText(500),
});

/* Fields shared by create and update — no defaults here, so a partial update never resets them. */
const projectFields = {
  slug,
  titleAr: requiredText(255),
  titleEn: requiredText(255),
  summaryAr: optionalText(500),
  summaryEn: optionalText(500),
  descriptionAr: longText,
  descriptionEn: longText,
  city,
  locationAr: optionalText(255),
  locationEn: optionalText(255),
  status: z.enum(ProjectStatus),
  publishStatus: z.enum(PublishStatus),
  featured: z.boolean(),
  order: sortOrder,
  unitsCount: z.number().int().min(0).max(100_000).nullish(),
  sizeRange: sizeRange.nullish(),
  completionYear: z.number().int().min(1950).max(2100).nullish(),
  features: z.array(projectFeature).max(24).nullish(),
  latitude: z.number().min(-90).max(90).nullish(),
  longitude: z.number().min(-180).max(180).nullish(),
  metaTitleAr: optionalText(255),
  metaTitleEn: optionalText(255),
  metaDescriptionAr: optionalText(500),
  metaDescriptionEn: optionalText(500),
  coverImageId: mediaId,
};

type GeoInput = { latitude?: number | null; longitude?: number | null };

/** Coordinates are one value: when either is sent, both must be sent (both numbers or both null). */
function checkGeo(value: GeoInput, ctx: z.RefinementCtx) {
  const sentLat = value.latitude !== undefined;
  const sentLng = value.longitude !== undefined;
  if (!sentLat && !sentLng) return;
  if (sentLat !== sentLng || (value.latitude === null) !== (value.longitude === null)) {
    ctx.addIssue({
      code: 'custom',
      message: 'latitude and longitude must be provided together',
      path: [sentLat ? 'longitude' : 'latitude'],
    });
  }
}

export const createProjectBody = z
  .object({
    ...projectFields,
    status: projectFields.status.default(ProjectStatus.COMING_SOON),
    publishStatus: projectFields.publishStatus.default(PublishStatus.DRAFT),
    featured: projectFields.featured.default(false),
    order: projectFields.order.default(0),
  })
  .superRefine(checkGeo);

export const updateProjectBody = z.object(projectFields).partial().superRefine(checkGeo);

export const imageParams = z.object({ id: z.uuid(), imageId: z.uuid() });

const imageFields = {
  category: z.enum(ProjectImageCategory),
  captionAr: optionalText(255),
  captionEn: optionalText(255),
  order: sortOrder,
};

export const addProjectImageBody = z.object({
  mediaId: z.uuid(),
  ...imageFields,
  category: imageFields.category.default(ProjectImageCategory.GALLERY),
  order: imageFields.order.optional(),
});

export const updateProjectImageBody = z.object(imageFields).partial();

export const reorderProjectImagesBody = reorderBody;
