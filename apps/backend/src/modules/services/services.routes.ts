import { Router } from 'express';

import * as controller from './services.controller.js';

export const servicesPublicRouter = Router();

servicesPublicRouter.get('/', controller.listPublished);
servicesPublicRouter.get('/:slug', controller.getPublishedBySlug);

export const servicesAdminRouter = Router();

servicesAdminRouter.get('/', controller.list);
servicesAdminRouter.post('/', controller.create);
servicesAdminRouter.put('/reorder', controller.reorder);
servicesAdminRouter.get('/:id', controller.getById);
servicesAdminRouter.patch('/:id', controller.update);
servicesAdminRouter.delete('/:id', controller.remove);
