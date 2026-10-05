import { Router } from 'express';

import { authorize } from '../../middleware/auth.js';
import * as controller from './dashboard.controller.js';

/** Every signed-in role sees the dashboard; lead analytics need the `leads` permission. */
export const dashboardAdminRouter = Router();

dashboardAdminRouter.get('/summary', controller.summary);
dashboardAdminRouter.get('/activity', controller.activity);
dashboardAdminRouter.get('/leads-chart', authorize('leads', 'read'), controller.leadsChart);
dashboardAdminRouter.get('/top-projects', authorize('leads', 'read'), controller.topProjects);
