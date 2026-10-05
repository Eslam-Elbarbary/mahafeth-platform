import type { Request, Response } from 'express';

import { idParams, reorderBody } from '../../lib/schemas.js';
import { parse } from '../../lib/validate.js';
import { createPartnerBody, listPartnersQuery, updatePartnerBody } from './partners.schema.js';
import * as partnersService from './partners.service.js';

export async function listVisible(_req: Request, res: Response) {
  res.json({ data: await partnersService.listVisible() });
}

export async function list(req: Request, res: Response) {
  res.json(await partnersService.list(parse(listPartnersQuery, req.query)));
}

export async function getById(req: Request, res: Response) {
  const { id } = parse(idParams, req.params);
  res.json({ data: await partnersService.getById(id) });
}

export async function create(req: Request, res: Response) {
  res.status(201).json({ data: await partnersService.create(parse(createPartnerBody, req.body)) });
}

export async function update(req: Request, res: Response) {
  const { id } = parse(idParams, req.params);
  res.json({ data: await partnersService.update(id, parse(updatePartnerBody, req.body)) });
}

export async function remove(req: Request, res: Response) {
  const { id } = parse(idParams, req.params);
  await partnersService.remove(id);
  res.status(204).end();
}

export async function reorder(req: Request, res: Response) {
  await partnersService.reorder(parse(reorderBody, req.body));
  res.status(204).end();
}
