import type { Request, Response } from 'express';

import { parse } from '../../lib/validate.js';
import { currentUser } from '../../middleware/auth.js';
import { changePasswordBody, loginBody } from './auth.schema.js';
import * as authService from './auth.service.js';

export async function login(req: Request, res: Response) {
  const result = await authService.login(parse(loginBody, req.body));
  res.json({ data: result });
}

export function me(req: Request, res: Response) {
  res.json({ data: authService.withPermissions(currentUser(req)) });
}

export async function changePassword(req: Request, res: Response) {
  const input = parse(changePasswordBody, req.body);
  res.json({ data: await authService.changePassword(currentUser(req).id, input) });
}
