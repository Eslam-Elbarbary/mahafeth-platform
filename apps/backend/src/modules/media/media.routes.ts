import { Router } from 'express';

import { upload } from '../../lib/upload.js';
import * as controller from './media.controller.js';

/** Admin only (mounted behind `requireAuth`). */
export const mediaAdminRouter = Router();

mediaAdminRouter.get('/', controller.list);
mediaAdminRouter.post('/', upload.single('file'), controller.upload);
mediaAdminRouter.get('/:id', controller.getById);
mediaAdminRouter.patch('/:id', controller.update);
mediaAdminRouter.delete('/:id', controller.remove);
