import { accessSync, constants } from 'node:fs';

import { createApp } from './app.js';
import { env } from './config/env.js';
import { logger } from './lib/logger.js';
import { prisma } from './lib/prisma.js';
import { uploadDir } from './lib/upload.js';

const SHUTDOWN_TIMEOUT_MS = 10_000;

try {
  accessSync(uploadDir, constants.R_OK | constants.W_OK);
} catch {
  logger.fatal('The upload directory is not writable by the API process (check UPLOAD_DIR)');
  process.exit(1);
}

const app = createApp();

const server = app.listen(env.PORT, env.HOST, () => {
  logger.info(`API listening on http://${env.HOST}:${env.PORT}/api/v1`);
  // PM2 `wait_ready`: the new process only takes over once it is accepting connections.
  process.send?.('ready');
});

// Longer than Nginx's upstream keepalive so the proxy never reuses a socket the API just closed.
server.keepAliveTimeout = 65_000;
server.headersTimeout = 66_000;

let shuttingDown = false;

function shutdown(signal: string, code = 0) {
  if (shuttingDown) return;
  shuttingDown = true;
  logger.info(`${signal} received, shutting down`);
  setTimeout(() => process.exit(1), SHUTDOWN_TIMEOUT_MS).unref();
  server.close(async () => {
    await prisma.$disconnect().catch(() => undefined);
    process.exit(code);
  });
  server.closeIdleConnections();
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('unhandledRejection', (reason) => {
  logger.error({ err: reason }, 'unhandled promise rejection');
});
process.on('uncaughtException', (error) => {
  logger.fatal({ err: error }, 'uncaught exception');
  shutdown('uncaughtException', 1);
});
