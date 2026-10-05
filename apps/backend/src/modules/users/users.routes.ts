import { Router } from 'express';

import { authorize } from '../../middleware/auth.js';
import * as controller from './users.controller.js';

export const usersAdminRouter = Router();

usersAdminRouter.get('/', controller.list);
usersAdminRouter.post('/', controller.create);
usersAdminRouter.get('/stats', controller.stats);
usersAdminRouter.get('/:id', controller.getById);
usersAdminRouter.patch('/:id', controller.update);
usersAdminRouter.post(
  '/:id/reset-password',
  authorize('users', 'update'),
  controller.resetPassword,
);
usersAdminRouter.delete('/:id', controller.remove);
