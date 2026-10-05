import type { Request, Response } from 'express';

import { idParams } from '../../lib/schemas.js';
import { parse } from '../../lib/validate.js';
import {
  createSectionBody,
  listSectionsQuery,
  reorderSectionsBody,
  updateSectionBody,
} from './sections.schema.js';
import * as sectionsService from './sections.service.js';

export async function list(req: Request, res: Response) {
  res.json({ data: await sectionsService.list(parse(listSectionsQuery, req.query)) });
}

export async function getById(req: Request, res: Response) {
  const { id } = parse(idParams, req.params);
  res.json({ data: await sectionsService.getById(id) });
}

export async function create(req: Request, res: Response) {
  res.status(201).json({ data: await sectionsService.create(parse(createSectionBody, req.body)) });
}

export async function update(req: Request, res: Response) {
  const { id } = parse(idParams, req.params);
  res.json({ data: await sectionsService.update(id, parse(updateSectionBody, req.body)) });
}

export async function remove(req: Request, res: Response) {
  const { id } = parse(idParams, req.params);
  await sectionsService.remove(id);
  res.status(204).end();
}

export async function reorder(req: Request, res: Response) {
  res.json({ data: await sectionsService.reorder(parse(reorderSectionsBody, req.body)) });
}
