import type { Request, Response } from 'express';

import { forbidden } from '../../lib/http-error.js';
import { type Action, can } from '../../lib/permissions.js';
import { parse } from '../../lib/validate.js';
import { currentUser } from '../../middleware/auth.js';
import { contentKeys } from './settings.catalog.js';
import {
  bulkUpsertSettingsBody,
  keyParams,
  listSettingsQuery,
  publicSettingsQuery,
  upsertSettingBody,
} from './settings.schema.js';
import * as settingsService from './settings.service.js';

/**
 * Global Content copy (`contentKeys`) is page content and follows the `pages` permission; every
 * other setting is site configuration (`settings`). Returns whether access is limited to content.
 */
function access(req: Request, action: Action, keys?: string[]): { contentOnly: boolean } {
  const { role } = currentUser(req);
  if (can(role, 'settings', action)) return { contentOnly: false };
  const onlyContent = !keys || keys.every((key) => contentKeys.has(key));
  if (
    onlyContent &&
    action !== 'delete' &&
    can(role, 'pages', action === 'read' ? 'read' : 'update')
  ) {
    return { contentOnly: true };
  }
  throw forbidden();
}

export async function getPublic(req: Request, res: Response) {
  const { format } = parse(publicSettingsQuery, req.query);
  res.json({
    data:
      format === 'flat' ? await settingsService.getPublicFlat() : await settingsService.getPublic(),
  });
}

export async function list(req: Request, res: Response) {
  const { contentOnly } = access(req, 'read');
  const settings = await settingsService.list(parse(listSettingsQuery, req.query));
  res.json({ data: contentOnly ? settings.filter((s) => contentKeys.has(s.key)) : settings });
}

export async function getByKey(req: Request, res: Response) {
  const { key } = parse(keyParams, req.params);
  access(req, 'read', [key]);
  res.json({ data: await settingsService.getByKey(key) });
}

export async function upsert(req: Request, res: Response) {
  const { key } = parse(keyParams, req.params);
  access(req, 'update', [key]);
  res.json({ data: await settingsService.upsert(key, parse(upsertSettingBody, req.body)) });
}

export async function bulkUpsert(req: Request, res: Response) {
  const input = parse(bulkUpsertSettingsBody, req.body);
  access(
    req,
    'update',
    input.items.map((item) => item.key),
  );
  res.json({ data: await settingsService.bulkUpsert(input) });
}

export async function remove(req: Request, res: Response) {
  const { key } = parse(keyParams, req.params);
  access(req, 'delete', [key]);
  await settingsService.remove(key);
  res.status(204).end();
}
