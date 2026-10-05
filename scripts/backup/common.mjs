/**
 * Shared helpers for the backup / restore scripts. Configuration comes from the environment, falling
 * back to `apps/backend/.env` (DATABASE_URL, UPLOAD_DIR) so the scripts work from the repo root.
 */
import { spawn } from 'node:child_process';
import { createHash } from 'node:crypto';
import {
  createReadStream,
  existsSync,
  readdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { basename, dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
const BACKEND = join(ROOT, 'apps', 'backend');

function readDotenv(file) {
  if (!existsSync(file)) return {};
  return Object.fromEntries(
    readFileSync(file, 'utf8')
      .split(/\r?\n/)
      .map((line) => line.match(/^\s*([A-Z0-9_]+)\s*=\s*"?(.*?)"?\s*$/))
      .filter(Boolean)
      .map((m) => [m[1], m[2]]),
  );
}

export const env = { ...readDotenv(join(BACKEND, '.env')), ...process.env };

/** `--name=value` / `--flag` arguments, plus positional ones under `_`. */
export function parseArgs(argv = process.argv.slice(2)) {
  const args = { _: [] };
  for (const arg of argv) {
    const match = arg.match(/^--([^=]+)(?:=(.*))?$/);
    if (match) args[match[1]] = match[2] ?? true;
    else args._.push(arg);
  }
  return args;
}

export function database() {
  if (!env.DATABASE_URL) fail('DATABASE_URL is not set (environment or apps/backend/.env)');
  const url = new URL(env.DATABASE_URL);
  return {
    host: url.hostname,
    port: url.port || '3306',
    user: decodeURIComponent(url.username),
    password: decodeURIComponent(url.password),
    name: url.pathname.replace(/^\//, ''),
  };
}

/** The backend resolves UPLOAD_DIR from its own folder (`pnpm --filter @mahafeth/backend start`). */
export const uploadDir = () => resolve(BACKEND, env.UPLOAD_DIR ?? 'uploads');

export const backupDir = (kind, override) =>
  resolve(override ?? env.BACKUP_DIR ?? join(ROOT, 'backups'), kind);

/** `20261001-134502` (UTC), sortable. */
export const timestamp = () =>
  new Date().toISOString().replace(/[-:]/g, '').replace('T', '-').slice(0, 15);

export function fail(message) {
  console.error(`✖ ${message}`);
  process.exit(1);
}

export async function sha256(file) {
  const hash = createHash('sha256');
  for await (const chunk of createReadStream(file)) hash.update(chunk);
  return hash.digest('hex');
}

/** Writes `<file>.sha256` in the `sha256sum` format, so `sha256sum -c` can verify it. */
export async function writeChecksum(file) {
  const digest = await sha256(file);
  writeFileSync(`${file}.sha256`, `${digest}  ${basename(file)}\n`);
  return digest;
}

/** Fails when `<file>.sha256` exists and does not match. */
export async function verifyChecksum(file) {
  const sumFile = `${file}.sha256`;
  if (!existsSync(sumFile)) {
    console.warn(`! No ${basename(sumFile)} next to the backup; skipping checksum verification`);
    return;
  }
  const expected = readFileSync(sumFile, 'utf8').trim().split(/\s+/)[0];
  if ((await sha256(file)) !== expected) fail(`Checksum mismatch for ${basename(file)}`);
  console.log('✔ Checksum verified');
}

/** Deletes the oldest backups (and their checksums) beyond the newest `keep`. */
export function prune(dir, prefix, keep) {
  if (!keep || keep < 1) return [];
  const files = readdirSync(dir)
    .filter((name) => name.startsWith(prefix) && !name.endsWith('.sha256'))
    .sort()
    .reverse();
  const removed = files.slice(keep);
  for (const name of removed) {
    rmSync(join(dir, name), { force: true });
    rmSync(join(dir, `${name}.sha256`), { force: true });
  }
  return removed;
}

/**
 * A MySQL client tool (`mysqldump` / `mysql`) run natively, or inside the MySQL container when
 * MYSQL_DOCKER_CONTAINER is set. The password travels in MYSQL_PWD, never on the command line.
 */
export function mysqlTool(tool, args, { stdio }) {
  const db = database();
  const container = env.MYSQL_DOCKER_CONTAINER;
  const childEnv = { ...process.env, MYSQL_PWD: db.password };
  // Inside the container the server is local; outside, use the DATABASE_URL host.
  const connection = container
    ? ['--host=127.0.0.1', '--port=3306', `--user=${db.user}`]
    : [`--host=${db.host}`, `--port=${db.port}`, `--user=${db.user}`];
  const [command, commandArgs] = container
    ? ['docker', ['exec', '-i', '-e', 'MYSQL_PWD', container, tool, ...connection, ...args]]
    : [tool, [...connection, ...args]];
  const child = spawn(command, commandArgs, { env: childEnv, stdio });
  child.on('error', (error) => {
    fail(
      error.code === 'ENOENT'
        ? `"${command}" not found. Install the MySQL client tools, or set MYSQL_DOCKER_CONTAINER=<container> to run them inside the database container.`
        : error.message,
    );
  });
  return child;
}

/** Resolves with the exit code; collects stderr for error messages. */
export function finished(child) {
  let stderr = '';
  child.stderr?.on('data', (chunk) => (stderr += chunk));
  return new Promise((resolvePromise) =>
    child.on('close', (code) => resolvePromise({ code, stderr: stderr.trim() })),
  );
}

export const formatSize = (bytes) =>
  bytes < 1024 * 1024
    ? `${(bytes / 1024).toFixed(1)} KB`
    : `${(bytes / 1024 / 1024).toFixed(1)} MB`;
