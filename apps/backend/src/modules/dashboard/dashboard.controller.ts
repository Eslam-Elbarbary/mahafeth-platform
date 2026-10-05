import type { Request, Response } from 'express';

import { can } from '../../lib/permissions.js';
import { parse } from '../../lib/validate.js';
import { currentUser } from '../../middleware/auth.js';
import { activityQuery, leadsChartQuery, topProjectsQuery } from './dashboard.schema.js';
import * as dashboardService from './dashboard.service.js';

const canSeeLeads = (req: Request) => can(currentUser(req).role, 'leads', 'read');

export async function summary(req: Request, res: Response) {
  res.json({ data: await dashboardService.summary({ includeLeads: canSeeLeads(req) }) });
}

export async function leadsChart(req: Request, res: Response) {
  res.json({ data: await dashboardService.leadsChart(parse(leadsChartQuery, req.query)) });
}

export async function topProjects(req: Request, res: Response) {
  res.json({ data: await dashboardService.topProjects(parse(topProjectsQuery, req.query)) });
}

export async function activity(req: Request, res: Response) {
  res.json({
    data: await dashboardService.activity(parse(activityQuery, req.query), {
      includeLeads: canSeeLeads(req),
      includeSettings: can(currentUser(req).role, 'settings', 'read'),
    }),
  });
}
