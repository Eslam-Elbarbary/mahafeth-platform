#!/usr/bin/env node
/**
 * Restores a `backup-db` dump into DATABASE_URL. Every table in the dump is dropped and recreated,
 * so this REPLACES the current data. Verifies the checksum first when a .sha256 file is present.
 *
 *   pnpm restore:db <backups/db/mahafeth-YYYYMMDD-HHMMSS.sql.gz> --yes
 *
 * Env: DATABASE_URL, MYSQL_DOCKER_CONTAINER (run mysql inside that container).
 */
import { createReadStream, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { pipeline } from 'node:stream/promises';
import { createGunzip } from 'node:zlib';

import { database, fail, finished, mysqlTool, parseArgs, verifyChecksum } from './common.mjs';

const args = parseArgs();
const [input] = args._;
if (!input) fail('Usage: pnpm restore:db <backup.sql.gz> --yes');
const file = resolve(input);
if (!existsSync(file)) fail(`Backup not found: ${file}`);

const db = database();
if (args.yes !== true) {
  fail(
    `This replaces the data in "${db.name}" on ${db.host}:${db.port} with ${file}.\n  Stop the backend first, then re-run with --yes.`,
  );
}

await verifyChecksum(file);
console.log(`Restoring ${file} → "${db.name}"…`);

const client = mysqlTool('mysql', ['--default-character-set=utf8mb4', db.name], {
  stdio: ['pipe', 'inherit', 'pipe'],
});
const exit = finished(client);
try {
  if (file.endsWith('.gz')) await pipeline(createReadStream(file), createGunzip(), client.stdin);
  else await pipeline(createReadStream(file), client.stdin);
} catch (error) {
  const { stderr } = await exit;
  fail(`Restore failed: ${stderr || error.message}`);
}

const { code, stderr } = await exit;
if (code !== 0) fail(`mysql exited with code ${code}${stderr ? `:\n${stderr}` : ''}`);
console.log(
  '✔ Database restored. Run `pnpm db:deploy` to apply any newer migrations, then start the backend.',
);
