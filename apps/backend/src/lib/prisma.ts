import { PrismaMariaDb } from '@prisma/adapter-mariadb';

import { env, isProduction } from '../config/env.js';
import { PrismaClient } from '../generated/prisma/client.js';

const url = new URL(env.DATABASE_URL);

const socketPath = url.searchParams.get('socket') ?? undefined;
const isLoopback = ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname);

/*
 * The MariaDB driver adapter talks to MySQL 8 as well. MySQL 8.4 defaults to
 * caching_sha2_password, which over plain TCP needs the server's RSA key. Fetching it is only
 * safe when nothing can sit in between, so production allows it for loopback hosts only; a remote
 * database should use the Unix socket (`?socket=`) or TLS.
 */
const adapter = new PrismaMariaDb({
  ...(socketPath
    ? { socketPath }
    : { host: url.hostname.replace(/^\[|\]$/g, ''), port: Number(url.port || 3306) }),
  user: decodeURIComponent(url.username),
  password: decodeURIComponent(url.password),
  database: url.pathname.slice(1),
  connectionLimit: Number(url.searchParams.get('connection_limit') ?? 10),
  allowPublicKeyRetrieval: !isProduction || isLoopback,
});

export const prisma = new PrismaClient({
  adapter,
  log: isProduction ? ['error'] : ['warn', 'error'],
});
