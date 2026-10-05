import { Router } from 'express';

import * as controller from './team.controller.js';

export const teamPublicRouter = Router();

teamPublicRouter.get('/', controller.listVisible);

export const teamAdminRouter = Router();

teamAdminRouter.get('/', controller.list);
teamAdminRouter.post('/', controller.create);
teamAdminRouter.put('/reorder', controller.reorder);
teamAdminRouter.get('/:id', controller.getById);
teamAdminRouter.patch('/:id', controller.update);
teamAdminRouter.delete('/:id', controller.remove);
