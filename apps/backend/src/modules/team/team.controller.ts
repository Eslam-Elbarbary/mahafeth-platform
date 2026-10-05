import type { Request, Response } from 'express';

import { idParams, reorderBody } from '../../lib/schemas.js';
import { parse } from '../../lib/validate.js';
import { createTeamMemberBody, listTeamQuery, updateTeamMemberBody } from './team.schema.js';
import * as teamService from './team.service.js';

export async function listVisible(_req: Request, res: Response) {
  res.json({ data: await teamService.listVisible() });
}

export async function list(req: Request, res: Response) {
  res.json(await teamService.list(parse(listTeamQuery, req.query)));
}

export async function getById(req: Request, res: Response) {
  const { id } = parse(idParams, req.params);
  res.json({ data: await teamService.getById(id) });
}

export async function create(req: Request, res: Response) {
  res.status(201).json({ data: await teamService.create(parse(createTeamMemberBody, req.body)) });
}

export async function update(req: Request, res: Response) {
  const { id } = parse(idParams, req.params);
  res.json({ data: await teamService.update(id, parse(updateTeamMemberBody, req.body)) });
}

export async function remove(req: Request, res: Response) {
  const { id } = parse(idParams, req.params);
  await teamService.remove(id);
  res.status(204).end();
}

export async function reorder(req: Request, res: Response) {
  await teamService.reorder(parse(reorderBody, req.body));
  res.status(204).end();
}
