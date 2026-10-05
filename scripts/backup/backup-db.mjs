#!/usr/bin/env node
/**
 * Database backup: a consistent `mysqldump` of DATABASE_URL, gzip-compressed, with a SHA-256
 * checksum. Keeps the newest N backups.
 *
 *   pnpm backup:db [--out=<dir>] [--keep=14]
 *
 * Env: DATABASE_URL, BACKUP_DIR (default ./backups), BACKUP_KEEP (default 14),
 *      MYSQL_DOCKER_CONTAINER (run mysqldump inside that container instead of locally).
 */
import { createWriteStream, mkdirSync, rmSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { pipeline } from 'node:stream/promises';
import { createGzip } from 'node:zlib';

import {
  backupDir,
  database,
  env,
  fail,
  finished,
  formatSize,
  mysqlTool,
  parseArgs,
  prune,
  timestamp,
  writeChecksum,
} from './common.mjs';

const args = parseArgs();
const db = database();
const dir = backupDir('db', args.out);
const keep = Number(args.keep ?? env.BACKUP_KEEP ?? 14);
mkdirSync(dir, { recursive: true });

const file = join(dir, `${db.name}-${timestamp()}.sql.gz`);
console.log(`Backing up database "${db.name}" → ${file}`);

const dump = mysqlTool(
  'mysqldump',
  [
    '--single-transaction', // consistent InnoDB snapshot without locking the site
    '--quick',
    '--triggers',
    '--hex-blob',
    '--no-tablespaces',
    '--default-character-set=utf8mb4',
    db.name,
  ],
  { stdio: ['ignore', 'pipe', 'pipe'] },
);
const exit = finished(dump);

try {
  await pipeline(dump.stdout, createGzip({ level: 9 }), createWriteStream(file));
} catch (error) {
  rmSync(file, { force: true });
  fail(`Writing the backup failed: ${error.message}`);
}

const { code, stderr } = await exit;
if (code !== 0) {
  rmSync(file, { force: true });
  fail(`mysqldump exited with code ${code}${stderr ? `:\n${stderr}` : ''}`);
}
if (statSync(file).size < 100) {
  rmSync(file, { force: true });
  fail('The dump is empty; check the database credentials and name');
}

const digest = await writeChecksum(file);
console.log(`✔ ${formatSize(statSync(file).size)} · sha256 ${digest.slice(0, 16)}…`);
const removed = prune(dir, `${db.name}-`, keep);
if (removed.length) console.log(`  Removed ${removed.length} old backup(s), keeping ${keep}`);
