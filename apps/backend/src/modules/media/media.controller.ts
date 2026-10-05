import { rm } from 'node:fs/promises';

import type { Request, Response } from 'express';

import { badRequest } from '../../lib/http-error.js';
import { assertFileContent } from '../../lib/upload.js';
import { idParams } from '../../lib/schemas.js';
import { parse } from '../../lib/validate.js';
import { currentUser } from '../../middleware/auth.js';
import { listMediaQuery, mediaMetaBody, updateMediaBody } from './media.schema.js';
import * as mediaService from './media.service.js';

export async function list(req: Request, res: Response) {
  res.json(await mediaService.list(parse(listMediaQuery, req.query)));
}

export async function getById(req: Request, res: Response) {
  const { id } = parse(idParams, req.params);
  res.json({ data: await mediaService.getById(id) });
}

export async function upload(req: Request, res: Response) {
  const file = req.file;
  if (!file) throw badRequest('Missing file (multipart field "file")');

  await assertFileContent(file);
  try {
    const meta = parse(mediaMetaBody, req.body);
    const media = await mediaService.create(file, meta, currentUser(req).id);
    res.status(201).json({ data: media });
  } catch (error) {
    await rm(file.path, { force: true });
    throw error;
  }
}

export async function update(req: Request, res: Response) {
  const { id } = parse(idParams, req.params);
  res.json({ data: await mediaService.update(id, parse(updateMediaBody, req.body)) });
}

export async function remove(req: Request, res: Response) {
  const { id } = parse(idParams, req.params);
  await mediaService.remove(id);
  res.status(204).end();
}
