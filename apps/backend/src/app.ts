import compression from 'compression';
import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import { pinoHttp } from 'pino-http';
import swaggerUi from 'swagger-ui-express';

import { env, isProduction } from './config/env.js';
import { openApiDocument } from './docs/openapi.js';
import { logger } from './lib/logger.js';
import { uploadDir, uploadHeaders } from './lib/upload.js';
import { errorHandler } from './middleware/error-handler.js';
import { notFound } from './middleware/not-found.js';
import { rateLimit } from './middleware/rate-limit.js';
import { healthCheck } from './modules/health/health.routes.js';
import { apiRouter } from './routes/index.js';

const allowedOrigins = new Set(env.CORS_ORIGINS);
const rateLimitAllowlist = new Set(env.RATE_LIMIT_ALLOWLIST);

export function createApp() {
  const app = express();

  app.set('trust proxy', env.TRUST_PROXY);
  app.use(
    helmet({
      // JSON API: nothing may be framed, scripted or embedded from its responses.
      contentSecurityPolicy: {
        useDefaults: false,
        directives: {
          defaultSrc: ["'none'"],
          frameAncestors: ["'none'"],
          baseUri: ["'none'"],
          formAction: ["'none'"],
        },
      },
      frameguard: { action: 'deny' },
      referrerPolicy: { policy: 'no-referrer' },
      strictTransportSecurity: isProduction
        ? { maxAge: 31_536_000, includeSubDomains: true }
        : false,
    }),
  );
  app.use(
    cors({
      // Requests without an Origin (website server, curl, health checks) are not CORS requests.
      origin: (origin, callback) => callback(null, !origin || allowedOrigins.has(origin)),
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
      allowedHeaders: ['Content-Type', 'Authorization'],
      maxAge: 600,
    }),
  );
  app.use(compression());
  app.get('/health', healthCheck);
  app.use(express.json({ limit: '1mb' }));
  app.use(pinoHttp({ logger }));

  app.use(
    '/uploads',
    express.static(uploadDir, {
      immutable: true,
      maxAge: '365d',
      index: false,
      dotfiles: 'deny',
      setHeaders: uploadHeaders,
    }),
  );

  if (env.API_DOCS) {
    app.get('/api/docs.json', (_req, res) => res.json(openApiDocument));
    // Swagger UI needs its own scripts and styles.
    app.use(
      '/api/docs',
      helmet.contentSecurityPolicy({ useDefaults: true }),
      swaggerUi.serve,
      swaggerUi.setup(openApiDocument),
    );
  }

  if (env.RATE_LIMIT_PER_MINUTE > 0) {
    app.use(
      '/api/v1',
      rateLimit({
        max: env.RATE_LIMIT_PER_MINUTE,
        windowMs: 60_000,
        key: (req) => {
          const ip = req.ip ?? 'unknown';
          return rateLimitAllowlist.has(ip) || req.path.startsWith('/health') ? null : ip;
        },
      }),
    );
  }
  app.use('/api/v1', apiRouter);

  app.use(notFound);
  app.use(errorHandler);

  return app;
}
