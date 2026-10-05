import { Router } from 'express';

import * as controller from './audit.controller.js';

/** Read-only; entries are written by the modules themselves. */
export const auditAdminRouter = Router();

auditAdminRouter.get('/', controller.list);
