import { Router } from 'express';

import { actionOf } from '../../lib/permissions.js';
import { assertCan } from '../../middleware/auth.js';
import * as controller from './sections.controller.js';

/** Admin only. Public section data is served embedded in `GET /pages/:slug`. */
export const sectionsAdminRouter = Router();

/* Sections are page content: reading them is reading the page, any change is a page update. */
sectionsAdminRouter.use((req, _res, next) => {
  assertCan(req, 'pages', actionOf(req.method) === 'read' ? 'read' : 'update');
  next();
});
sectionsAdminRouter.get('/', controller.list);
sectionsAdminRouter.post('/', controller.create);
sectionsAdminRouter.put('/reorder', controller.reorder);
sectionsAdminRouter.get('/:id', controller.getById);
sectionsAdminRouter.patch('/:id', controller.update);
sectionsAdminRouter.delete('/:id', controller.remove);
