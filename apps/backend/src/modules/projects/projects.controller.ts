import type { Request, Response } from 'express';

import { idParams, reorderBody, slugParams } from '../../lib/schemas.js';
import { parse } from '../../lib/validate.js';
import {
  addProjectImageBody,
  adminListProjectsQuery,
  createProjectBody,
  imageParams,
  publicListProjectsQuery,
  reorderProjectImagesBody,
  updateProjectBody,
  updateProjectImageBody,
} from './projects.schema.js';
import * as projectsService from './projects.service.js';

export async function listPublished(req: Request, res: Response) {
  res.json(await projectsService.listPublished(parse(publicListProjectsQuery, req.query)));
}

export async function getPublishedBySlug(req: Request, res: Response) {
  const { slug } = parse(slugParams, req.params);
  res.json({ data: await projectsService.getPublishedBySlug(slug) });
}

export async function list(req: Request, res: Response) {
  res.json(await projectsService.list(parse(adminListProjectsQuery, req.query)));
}

export async function getById(req: Request, res: Response) {
  const { id } = parse(idParams, req.params);
  res.json({ data: await projectsService.getById(id) });
}

export async function create(req: Request, res: Response) {
  res.status(201).json({ data: await projectsService.create(parse(createProjectBody, req.body)) });
}

export async function update(req: Request, res: Response) {
  const { id } = parse(idParams, req.params);
  res.json({ data: await projectsService.update(id, parse(updateProjectBody, req.body)) });
}

export async function remove(req: Request, res: Response) {
  const { id } = parse(idParams, req.params);
  await projectsService.remove(id);
  res.status(204).end();
}

export async function reorder(req: Request, res: Response) {
  await projectsService.reorder(parse(reorderBody, req.body));
  res.status(204).end();
}

export async function addImage(req: Request, res: Response) {
  const { id } = parse(idParams, req.params);
  res
    .status(201)
    .json({ data: await projectsService.addImage(id, parse(addProjectImageBody, req.body)) });
}

export async function updateImage(req: Request, res: Response) {
  const { id, imageId } = parse(imageParams, req.params);
  const input = parse(updateProjectImageBody, req.body);
  res.json({ data: await projectsService.updateImage(id, imageId, input) });
}

export async function removeImage(req: Request, res: Response) {
  const { id, imageId } = parse(imageParams, req.params);
  await projectsService.removeImage(id, imageId);
  res.status(204).end();
}

export async function reorderImages(req: Request, res: Response) {
  const { id } = parse(idParams, req.params);
  res.json({
    data: await projectsService.reorderImages(id, parse(reorderProjectImagesBody, req.body)),
  });
}
