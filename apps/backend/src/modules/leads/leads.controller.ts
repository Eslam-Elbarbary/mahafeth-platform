import type { Request, Response } from 'express';

import { idParams } from '../../lib/schemas.js';
import { parse } from '../../lib/validate.js';
import { listLeadsQuery, submitLeadBody, updateLeadBody } from './leads.schema.js';
import * as leadsService from './leads.service.js';

export async function submit(req: Request, res: Response) {
  const lead = await leadsService.submit(parse(submitLeadBody, req.body), {
    ipAddress: req.ip ?? null,
    userAgent: req.get('user-agent') ?? null,
  });
  res.status(201).json({ data: lead });
}

export async function list(req: Request, res: Response) {
  res.json(await leadsService.list(parse(listLeadsQuery, req.query)));
}

export async function stats(_req: Request, res: Response) {
  res.json({ data: await leadsService.stats() });
}

export async function assignees(_req: Request, res: Response) {
  res.json({ data: await leadsService.assignees() });
}

export async function getById(req: Request, res: Response) {
  const { id } = parse(idParams, req.params);
  res.json({ data: await leadsService.getById(id) });
}

export async function update(req: Request, res: Response) {
  const { id } = parse(idParams, req.params);
  res.json({ data: await leadsService.update(id, parse(updateLeadBody, req.body)) });
}

export async function remove(req: Request, res: Response) {
  const { id } = parse(idParams, req.params);
  await leadsService.remove(id);
  res.status(204).end();
}
