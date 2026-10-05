import type { Request, Response } from 'express';

import { idParams, reorderBody, slugParams } from '../../lib/schemas.js';
import { parse } from '../../lib/validate.js';
import { createServiceBody, listServicesQuery, updateServiceBody } from './services.schema.js';
import * as servicesService from './services.service.js';

export async function listPublished(_req: Request, res: Response) {
  res.json({ data: await servicesService.listPublished() });
}

export async function getPublishedBySlug(req: Request, res: Response) {
  const { slug } = parse(slugParams, req.params);
  res.json({ data: await servicesService.getPublishedBySlug(slug) });
}

export async function list(req: Request, res: Response) {
  res.json(await servicesService.list(parse(listServicesQuery, req.query)));
}

export async function getById(req: Request, res: Response) {
  const { id } = parse(idParams, req.params);
  res.json({ data: await servicesService.getById(id) });
}

export async function create(req: Request, res: Response) {
  res.status(201).json({ data: await servicesService.create(parse(createServiceBody, req.body)) });
}

export async function update(req: Request, res: Response) {
  const { id } = parse(idParams, req.params);
  res.json({ data: await servicesService.update(id, parse(updateServiceBody, req.body)) });
}

export async function remove(req: Request, res: Response) {
  const { id } = parse(idParams, req.params);
  await servicesService.remove(id);
  res.status(204).end();
}

export async function reorder(req: Request, res: Response) {
  await servicesService.reorder(parse(reorderBody, req.body));
  res.status(204).end();
}
