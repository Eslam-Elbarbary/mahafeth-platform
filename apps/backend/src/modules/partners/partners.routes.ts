import { Router } from 'express';

import * as controller from './partners.controller.js';

export const partnersPublicRouter = Router();

partnersPublicRouter.get('/', controller.listVisible);

export const partnersAdminRouter = Router();

partnersAdminRouter.get('/', controller.list);
partnersAdminRouter.post('/', controller.create);
partnersAdminRouter.put('/reorder', controller.reorder);
partnersAdminRouter.get('/:id', controller.getById);
partnersAdminRouter.patch('/:id', controller.update);
partnersAdminRouter.delete('/:id', controller.remove);
