import type { Request, Response } from 'express';

import { parse } from '../../lib/validate.js';
import { listAuditLogsQuery } from './audit.schema.js';
import * as auditService from './audit.service.js';

export async function list(req: Request, res: Response) {
  res.json(await auditService.list(parse(listAuditLogsQuery, req.query)));
}
