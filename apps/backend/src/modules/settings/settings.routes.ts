import { Router } from 'express';

import * as controller from './settings.controller.js';

export const settingsPublicRouter = Router();

settingsPublicRouter.get('/', controller.getPublic);

/** Permissions are checked per request from the keys involved (see `settings.controller.ts`). */
export const settingsAdminRouter = Router();

settingsAdminRouter.get('/', controller.list);
settingsAdminRouter.get('/:key', controller.getByKey);
settingsAdminRouter.put('/', controller.bulkUpsert);
settingsAdminRouter.put('/:key', controller.upsert);
settingsAdminRouter.delete('/:key', controller.remove);
