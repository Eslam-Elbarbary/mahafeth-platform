import { type RequestHandler, Router } from 'express';

import { prisma } from '../../lib/prisma.js';

const DB_TIMEOUT_MS = 2000;

async function databaseReachable() {
  let timer: NodeJS.Timeout | undefined;
  const timeout = new Promise<false>((resolve) => {
    timer = setTimeout(() => resolve(false), DB_TIMEOUT_MS);
  });
  try {
    return await Promise.race([prisma.$queryRaw`SELECT 1`.then(() => true), timeout]);
  } catch {
    return false;
  } finally {
    clearTimeout(timer);
  }
}

/**
 * `GET /health` — for PM2, Nginx and uptime monitors. Operational status only: no versions,
 * configuration, hostnames or paths. 503 when the database is unreachable.
 */
export const healthCheck: RequestHandler = async (_req, res) => {
  const database = (await databaseReachable()) ? 'ok' : 'unavailable';
  res
    .status(database === 'ok' ? 200 : 503)
    .set('Cache-Control', 'no-store')
    .json({
      status: database === 'ok' ? 'ok' : 'degraded',
      uptime: Math.round(process.uptime()),
      database,
      timestamp: new Date().toISOString(),
    });
};

export const healthRouter = Router();

healthRouter.get('/', (_req, res) => {
  res.json({ status: 'ok', uptime: process.uptime() });
});

healthRouter.get('/db', async (_req, res) => {
  if (await databaseReachable()) res.json({ status: 'ok' });
  else res.status(503).json({ status: 'unavailable' });
});
