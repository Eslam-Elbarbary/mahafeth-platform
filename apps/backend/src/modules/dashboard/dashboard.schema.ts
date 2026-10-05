import { z } from 'zod';

export const leadsChartQuery = z.object({
  days: z.coerce.number().int().min(7).max(365).default(30),
});

export const topProjectsQuery = z.object({
  limit: z.coerce.number().int().min(1).max(10).default(5),
  /** Only count leads from the last N days; omit for all time. */
  days: z.coerce.number().int().min(1).max(365).optional(),
});

export const activityQuery = z.object({
  limit: z.coerce.number().int().min(1).max(50).default(15),
});
