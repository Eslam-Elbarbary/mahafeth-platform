import { z } from 'zod';

import { LeadInterest, LeadSource, LeadStatus, Locale } from '../../generated/prisma/client.js';
import { optionalText, requiredText, searchQuery, slug } from '../../lib/schemas.js';

const phone = z
  .string()
  .trim()
  .transform((v) => v.replace(/[\s()-]/g, ''))
  .pipe(z.string().regex(/^\+?\d{7,15}$/, 'Enter a valid phone number'));

export const submitLeadBody = z.object({
  name: requiredText(160),
  phone,
  email: z.email().trim().toLowerCase().max(191).nullish(),
  city: z.string().trim().toLowerCase().max(60).nullish(),
  interestType: z.enum(LeadInterest).nullish(),
  message: z.string().trim().max(2000).nullish(),
  projectId: z.uuid().nullish(),
  /** Website deep links (`?project=`) only know the slug; unknown slugs are ignored. */
  projectSlug: slug.nullish(),
  locale: z.enum(Locale).default(Locale.ar),
  source: z.enum(LeadSource).default(LeadSource.WEBSITE),
  /** Honeypot: real users never fill this hidden field. */
  website: z.string().max(0).optional().catch('filled'),
});

export const listLeadsQuery = searchQuery.extend({
  status: z.enum(LeadStatus).optional(),
  source: z.enum(LeadSource).optional(),
  interestType: z.enum(LeadInterest).optional(),
  city: z.string().trim().toLowerCase().max(60).optional(),
  projectId: z.uuid().optional(),
  assignedToId: z.uuid().optional(),
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
});

export const updateLeadBody = z
  .object({
    status: z.enum(LeadStatus).optional(),
    notes: optionalText(10_000),
    assignedToId: z.uuid().nullish(),
  })
  .refine((v) => Object.keys(v).length > 0, { message: 'Nothing to update' });
