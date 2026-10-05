import { Router } from 'express';

import * as controller from './projects.controller.js';

export const projectsPublicRouter = Router();

projectsPublicRouter.get('/', controller.listPublished);
projectsPublicRouter.get('/:slug', controller.getPublishedBySlug);

export const projectsAdminRouter = Router();

projectsAdminRouter.get('/', controller.list);
projectsAdminRouter.post('/', controller.create);
projectsAdminRouter.put('/reorder', controller.reorder);
projectsAdminRouter.get('/:id', controller.getById);
projectsAdminRouter.patch('/:id', controller.update);
projectsAdminRouter.delete('/:id', controller.remove);

projectsAdminRouter.post('/:id/images', controller.addImage);
projectsAdminRouter.put('/:id/images/reorder', controller.reorderImages);
projectsAdminRouter.patch('/:id/images/:imageId', controller.updateImage);
projectsAdminRouter.delete('/:id/images/:imageId', controller.removeImage);
