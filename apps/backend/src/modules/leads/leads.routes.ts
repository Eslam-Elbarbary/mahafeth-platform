import { Router } from 'express';

import { rateLimit } from '../../middleware/rate-limit.js';
import * as controller from './leads.controller.js';

export const leadsPublicRouter = Router();

leadsPublicRouter.post('/', rateLimit({ max: 10, windowMs: 10 * 60 * 1000 }), controller.submit);

/** Leads contain personal data; guarded by the `leads` permission where mounted. */
export const leadsAdminRouter = Router();

leadsAdminRouter.get('/', controller.list);
leadsAdminRouter.get('/stats', controller.stats);
leadsAdminRouter.get('/assignees', controller.assignees);
leadsAdminRouter.get('/:id', controller.getById);
leadsAdminRouter.patch('/:id', controller.update);
leadsAdminRouter.delete('/:id', controller.remove);
