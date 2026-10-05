import type { Request, Response } from 'express';

import { idParams } from '../../lib/schemas.js';
import { parse } from '../../lib/validate.js';
import { currentUser } from '../../middleware/auth.js';
import {
  createUserBody,
  listUsersQuery,
  resetPasswordBody,
  updateUserBody,
} from './users.schema.js';
import * as usersService from './users.service.js';

export async function list(req: Request, res: Response) {
  res.json(await usersService.list(parse(listUsersQuery, req.query)));
}

export async function stats(_req: Request, res: Response) {
  res.json({ data: await usersService.stats() });
}

export async function getById(req: Request, res: Response) {
  const { id } = parse(idParams, req.params);
  res.json({ data: await usersService.getById(id) });
}

export async function create(req: Request, res: Response) {
  res.status(201).json({ data: await usersService.create(parse(createUserBody, req.body)) });
}

export async function update(req: Request, res: Response) {
  const { id } = parse(idParams, req.params);
  const input = parse(updateUserBody, req.body);
  res.json({ data: await usersService.update(currentUser(req), id, input) });
}

export async function resetPassword(req: Request, res: Response) {
  const { id } = parse(idParams, req.params);
  await usersService.resetPassword(id, parse(resetPasswordBody, req.body));
  res.status(204).end();
}

export async function remove(req: Request, res: Response) {
  const { id } = parse(idParams, req.params);
  await usersService.remove(currentUser(req), id);
  res.status(204).end();
}
