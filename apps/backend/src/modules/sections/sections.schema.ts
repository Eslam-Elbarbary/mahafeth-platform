import { z } from 'zod';

import { SectionType } from '../../generated/prisma/client.js';
import { mediaId, optionalText, reorderBody, sortOrder } from '../../lib/schemas.js';

/*
 * `Section.content` per type: one bilingual object (`fooAr` / `fooEn` pairs) plus media ids.
 * Every field is optional — the website falls back to its bundled copy for anything left empty.
 * Unknown keys are stripped. Media ids are checked against the library in the service.
 */

const text = (max: number) => z.string().trim().max(max).optional();

/** `{ <key>Ar, <key>En }` text pair. */
function bi<K extends string>(key: K, max = 500) {
  return { [`${key}Ar`]: text(max), [`${key}En`]: text(max) } as Record<
    `${K}Ar` | `${K}En`,
    ReturnType<typeof text>
  >;
}

/** Website link: section anchor (`#projects`), locale-relative route (`/contact`) or absolute URL. */
const href = z
  .string()
  .trim()
  .max(500)
  .regex(/^(#|\/|https?:\/\/|tel:|mailto:)/, 'Use #section, /path, https://, tel: or mailto:')
  .or(z.literal(''))
  .optional();

const button = z.object({ ...bi('label', 120), href }).optional();
const imageRef = z.uuid().nullish();
const label = bi('label', 120);
const description = (max = 1000) => bi('description', max);

const interestKeys = ['own', 'invest', 'owner', 'partner', 'job'] as const;

const hero = z.object({
  ...bi('eyebrow', 255),
  ...bi('subtitle', 1000),
  primaryButton: button,
  secondaryButton: button,
  ...bi('hint', 120),
  logoImageId: imageRef,
});

const about = z.object({
  ...label,
  ...description(3000),
  ...bi('buttonText', 120),
  ...bi('buttonCloseText', 120),
  imageIds: z.array(z.uuid()).max(2).optional(),
});

const figures = z.object({
  items: z
    .array(
      z.object({
        value: z
          .string()
          .trim()
          .regex(/^\+?\d{1,9}\+?$/, 'Digits only, optionally with + (e.g. 2500+)'),
        ...bi('label', 120),
      }),
    )
    .max(12)
    .optional(),
});

const timeline = z.object({
  ...label,
  items: z
    .array(
      z.object({
        year: z.string().trim().min(1).max(20),
        ...bi('title', 255),
        ...bi('description', 1000),
        imageId: imageRef,
        current: z.boolean().optional(),
      }),
    )
    .max(20)
    .optional(),
});

const reach = z.object({
  ...label,
  items: z
    .array(
      z.object({
        key: z.enum(interestKeys),
        ...bi('title', 255),
        ...bi('description', 1000),
        ...bi('button', 120),
      }),
    )
    .max(interestKeys.length)
    .refine((items) => new Set(items.map((item) => item.key)).size === items.length, {
      message: 'Each interest can appear once',
    })
    .optional(),
});

const interestForm = z.object({
  ...label,
  ...description(),
  points: z
    .array(z.object({ ...bi('text', 255) }))
    .max(6)
    .optional(),
  ...bi('cardTitle', 255),
  ...bi('cardBody', 1000),
  ...bi('submit', 120),
  ...bi('note', 500),
  ...bi('successTitle', 255),
  ...bi('successBody', 1000),
});

const cta = z.object({
  ...label,
  ...description(),
  button,
  ...bi('callLabel', 120),
  ...bi('whatsappLabel', 120),
});

const statement = z.object({ ...label, ...description(3000) });

const coordinate = (limit: number) => z.number().min(-limit).max(limit).nullish();

export const sectionContentSchemas: Record<SectionType, z.ZodType<Record<string, unknown>>> = {
  HERO: hero,
  ABOUT: about,
  STORY: about,
  STATS: figures,
  TIMELINE: timeline,
  PROJECTS_SHOWCASE: z.object({ ...label, button, ...bi('exploreLabel', 120) }),
  SERVICES: z.object({ ...label, ...bi('linkLabel', 120) }),
  LEADERSHIP: z.object({ ...label, ...bi('swipeHint', 120) }),
  CONTACT: reach,
  INTEREST_FORM: interestForm,
  PARTNERS: z.object({ ...label, ...description() }),
  CTA: cta,
  VISION: statement,
  MISSION: statement,
  INTRO: z.object({ ...label, ...description(5000), ...bi('membersLabel', 120) }),
  CONTACT_INFO: z.object({
    ...label,
    ...description(),
    ...bi('phoneLabel', 120),
    ...bi('whatsappLabel', 120),
    ...bi('emailLabel', 120),
    ...bi('hoursLabel', 120),
    ...bi('hours', 255),
  }),
  BRANCHES: z.object({ ...label, ...description() }),
  MAP: z.object({
    ...label,
    ...description(),
    ...bi('address', 255),
    latitude: coordinate(90),
    longitude: coordinate(180),
    ...bi('directionsLabel', 120),
  }),
  RICH_TEXT: z.object({ ...bi('body', 20_000) }),
};

const MEDIA_KEY = /^(imageId|imageIds|logoImageId)$/;

/** Every media id referenced anywhere inside a section's content. */
export function mediaIdsIn(value: unknown, found = new Set<string>()): Set<string> {
  if (Array.isArray(value)) {
    for (const item of value) mediaIdsIn(item, found);
  } else if (typeof value === 'object' && value !== null) {
    for (const [key, item] of Object.entries(value)) {
      if (MEDIA_KEY.test(key)) {
        for (const id of [item].flat()) if (typeof id === 'string') found.add(id);
      } else {
        mediaIdsIn(item, found);
      }
    }
  }
  return found;
}

export const listSectionsQuery = z.object({
  pageId: z.uuid(),
});

/** Legacy per-locale content, kept for `RICH_TEXT` blocks created before `content`. */
const localizedContent = z.record(z.string(), z.json());

/* No defaults here, so a partial update never resets a field. */
const sectionFields = {
  titleAr: optionalText(255),
  titleEn: optionalText(255),
  content: z.record(z.string(), z.unknown()).nullish(),
  contentAr: localizedContent.nullish(),
  contentEn: localizedContent.nullish(),
  imageId: mediaId,
  order: sortOrder.optional(),
  visible: z.boolean().optional(),
};

/** `content` is additionally checked against `sectionContentSchemas[type]` in the service. */
export const createSectionBody = z.object({
  pageId: z.uuid(),
  type: z.enum(SectionType),
  ...sectionFields,
});

/** `type` and `pageId` are fixed after creation. */
export const updateSectionBody = z.object(sectionFields);

export const reorderSectionsBody = reorderBody.extend({ pageId: z.uuid() });
