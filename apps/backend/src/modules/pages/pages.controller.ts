import type { Request, Response } from 'express';

import { idParams, slugParams } from '../../lib/schemas.js';
import { parse } from '../../lib/validate.js';
import { createPageBody, listPagesQuery, updatePageBody } from './pages.schema.js';
import * as pagesService from './pages.service.js';

export async function getPublishedBySlug(req: Request, res: Response) {
  const { slug } = parse(slugParams, req.params);
  res.json({ data: await pagesService.getPublishedBySlug(slug) });
}

export async function list(req: Request, res: Response) {
  res.json(await pagesService.list(parse(listPagesQuery, req.query)));
}

export async function getBySlug(req: Request, res: Response) {
  const { slug } = parse(slugParams, req.params);
  res.json({ data: await pagesService.getBySlug(slug) });
}

export async function getById(req: Request, res: Response) {
  const { id } = parse(idParams, req.params);
  res.json({ data: await pagesService.getById(id) });
}

export async function create(req: Request, res: Response) {
  res.status(201).json({ data: await pagesService.create(parse(createPageBody, req.body)) });
}

export async function update(req: Request, res: Response) {
  const { id } = parse(idParams, req.params);
  res.json({ data: await pagesService.update(id, parse(updatePageBody, req.body)) });
}

export async function remove(req: Request, res: Response) {
  const { id } = parse(idParams, req.params);
  await pagesService.remove(id);
  res.status(204).end();
}
