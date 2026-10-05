import { Router } from 'express';

import { authorize, requireAuth, withRequestContext } from '../middleware/auth.js';
import { revalidateWebsite } from '../middleware/revalidate-website.js';
import { auditAdminRouter } from '../modules/audit/audit.routes.js';
import { authRouter } from '../modules/auth/auth.routes.js';
import { dashboardAdminRouter } from '../modules/dashboard/dashboard.routes.js';
import { healthRouter } from '../modules/health/health.routes.js';
import { leadsAdminRouter, leadsPublicRouter } from '../modules/leads/leads.routes.js';
import { mediaAdminRouter } from '../modules/media/media.routes.js';
import { pagesAdminRouter, pagesPublicRouter } from '../modules/pages/pages.routes.js';
import { partnersAdminRouter, partnersPublicRouter } from '../modules/partners/partners.routes.js';
import { projectsAdminRouter, projectsPublicRouter } from '../modules/projects/projects.routes.js';
import { sectionsAdminRouter } from '../modules/sections/sections.routes.js';
import { servicesAdminRouter, servicesPublicRouter } from '../modules/services/services.routes.js';
import { settingsAdminRouter, settingsPublicRouter } from '../modules/settings/settings.routes.js';
import { teamAdminRouter, teamPublicRouter } from '../modules/team/team.routes.js';
import { usersAdminRouter } from '../modules/users/users.routes.js';

/** Public, read-only content for the website (plus lead submission). */
const publicRouter = Router();
publicRouter.use('/settings', settingsPublicRouter);
publicRouter.use('/pages', pagesPublicRouter);
publicRouter.use('/projects', projectsPublicRouter);
publicRouter.use('/services', servicesPublicRouter);
publicRouter.use('/team', teamPublicRouter);
publicRouter.use('/partners', partnersPublicRouter);
publicRouter.use('/leads', leadsPublicRouter);

/**
 * CMS management for the admin dashboard; every route requires a valid token, and each module is
 * guarded by the role permissions in `lib/permissions.ts` (the HTTP method picks the action).
 */
const adminRouter = Router();
adminRouter.use(requireAuth);
adminRouter.use(revalidateWebsite);
adminRouter.use('/dashboard', dashboardAdminRouter);
adminRouter.use('/media', authorize('media'), mediaAdminRouter);
/* Settings check per request: Global Content keys follow `pages`, the rest `settings`. */
adminRouter.use('/settings', settingsAdminRouter);
adminRouter.use('/pages', authorize('pages'), pagesAdminRouter);
adminRouter.use('/sections', sectionsAdminRouter);
adminRouter.use('/projects', authorize('projects'), projectsAdminRouter);
adminRouter.use('/services', authorize('services'), servicesAdminRouter);
adminRouter.use('/team', authorize('team'), teamAdminRouter);
adminRouter.use('/partners', authorize('partners'), partnersAdminRouter);
adminRouter.use('/leads', authorize('leads'), leadsAdminRouter);
adminRouter.use('/users', authorize('users'), usersAdminRouter);
adminRouter.use('/audit-logs', authorize('auditLogs', 'read'), auditAdminRouter);

export const apiRouter = Router();

apiRouter.use(withRequestContext);
apiRouter.use('/health', healthRouter);
apiRouter.use('/auth', authRouter);
apiRouter.use('/admin', adminRouter);
apiRouter.use('/', publicRouter);
