import { Router } from 'express';

import * as controller from './pages.controller.js';

export const pagesPublicRouter = Router();

pagesPublicRouter.get('/:slug', controller.getPublishedBySlug);

export const pagesAdminRouter = Router();

pagesAdminRouter.get('/', controller.list);
pagesAdminRouter.post('/', controller.create);
pagesAdminRouter.get('/by-slug/:slug', controller.getBySlug);
pagesAdminRouter.get('/:id', controller.getById);
pagesAdminRouter.patch('/:id', controller.update);
pagesAdminRouter.delete('/:id', controller.remove);
