import 'dotenv/config';
import { z } from 'zod';

const emptyToUndefined = (value: unknown) => (value === '' ? undefined : value);

const list = (value: string) =>
  value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);

/** Placeholders shipped in `.env.example`; refused in production. */
const PLACEHOLDER = /replace-with|change-me/i;

const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1', '[::1]', '0.0.0.0']);
const isLocalUrl = (value: string) => {
  try {
    return LOCAL_HOSTS.has(new URL(value).hostname);
  } catch {
    return false;
  }
};

/** Credentials of the development database in docker-compose.yml. */
const DEV_DB_PASSWORDS = new Set(['mahafeth', 'mahafeth-root', 'root', 'password', '']);

const envSchema = z
  .object({
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
    HOST: z.string().default('0.0.0.0'),
    PORT: z.coerce.number().int().positive().default(4000),
    LOG_LEVEL: z
      .enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent'])
      .default('info'),
    DATABASE_URL: z.string().startsWith('mysql://'),
    CORS_ORIGINS: z
      .string()
      .default('http://localhost:3000,http://localhost:5173')
      .transform(list)
      .pipe(
        z.array(
          z.url({ protocol: /^https?$/, error: 'CORS_ORIGINS must be http(s) origins, no "*"' }),
        ),
      )
      .transform((origins) => origins.map((origin) => new URL(origin).origin)),
    /**
     * Express `trust proxy`: which hops may set X-Forwarded-For (the client IP used for rate limits
     * and the audit log). `loopback` = a reverse proxy on the same machine; a number = that many
     * proxies in front; `false` = no proxy.
     */
    TRUST_PROXY: z
      .string()
      .default('loopback')
      .transform((value): boolean | number | string => {
        if (value === 'true') return true;
        if (value === 'false') return false;
        return /^\d+$/.test(value) ? Number(value) : value;
      }),
    /** Requests per minute per IP for the whole API (0 disables). */
    RATE_LIMIT_PER_MINUTE: z.coerce.number().int().min(0).default(600),
    /** IPs exempt from the global limit, e.g. the website server that renders pages. */
    RATE_LIMIT_ALLOWLIST: z.string().default('').transform(list),

    JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters'),
    JWT_EXPIRES_IN: z
      .string()
      .regex(/^\d+(m|h|d)$/, 'JWT_EXPIRES_IN must look like 30m, 12h or 1d')
      .default('12h'),

    UPLOAD_DIR: z.string().default('uploads'),
    MEDIA_BASE_URL: z.string().default('/uploads'),
    MAX_UPLOAD_MB: z.coerce.number().positive().max(200).default(20),

    /** Swagger UI at /api/docs; defaults to on outside production. */
    API_DOCS: z.stringbool().optional(),

    // Website on-demand revalidation (`apps/web` `/api/revalidate`). Both unset = disabled.
    WEB_REVALIDATE_URL: z.preprocess(emptyToUndefined, z.url().optional()),
    REVALIDATE_SECRET: z.preprocess(emptyToUndefined, z.string().min(16).optional()),
  })
  .superRefine((value, ctx) => {
    if (value.NODE_ENV !== 'production') return;
    const refuse = (path: string, message: string) =>
      ctx.addIssue({ code: 'custom', path: [path], message });
    if (PLACEHOLDER.test(value.JWT_SECRET)) refuse('JWT_SECRET', 'Set a real random secret');
    if (value.REVALIDATE_SECRET && PLACEHOLDER.test(value.REVALIDATE_SECRET)) {
      refuse('REVALIDATE_SECRET', 'Set a real random secret');
    }
    if (value.CORS_ORIGINS.length === 0)
      refuse('CORS_ORIGINS', 'List the website and admin origins');
    for (const origin of value.CORS_ORIGINS) {
      if (!origin.startsWith('https://') || isLocalUrl(origin)) {
        refuse(
          'CORS_ORIGINS',
          `Only public https origins are allowed in production (got ${origin})`,
        );
      }
    }
    const db = new URL(value.DATABASE_URL);
    if (db.username === 'root' || DEV_DB_PASSWORDS.has(decodeURIComponent(db.password))) {
      refuse('DATABASE_URL', 'Use a dedicated database user with a strong password');
    }
    if (/^https?:/.test(value.MEDIA_BASE_URL) && isLocalUrl(value.MEDIA_BASE_URL)) {
      refuse('MEDIA_BASE_URL', 'Use /uploads or the public media origin');
    }
    // The website is called server-to-server, so a loopback WEB_REVALIDATE_URL is expected here.
    if (Boolean(value.WEB_REVALIDATE_URL) !== Boolean(value.REVALIDATE_SECRET)) {
      refuse('REVALIDATE_SECRET', 'Set both WEB_REVALIDATE_URL and REVALIDATE_SECRET, or neither');
    }
  })
  .transform((value) => ({
    ...value,
    API_DOCS: value.API_DOCS ?? value.NODE_ENV !== 'production',
  }));

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error(`Invalid environment variables:\n${z.prettifyError(parsed.error)}`);
  process.exit(1);
}

export const env = parsed.data;
export const isProduction = env.NODE_ENV === 'production';
