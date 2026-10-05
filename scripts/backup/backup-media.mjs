#!/usr/bin/env node
/**
 * Media backup: the uploads folder (UPLOAD_DIR) as a .tar.gz archive with a SHA-256 checksum.
 * Keeps the newest N archives. Uses the system `tar` (bundled with Linux, macOS and Windows 10+).
 *
 *   pnpm backup:media [--out=<dir>] [--keep=14]
 *
 * Env: UPLOAD_DIR (relative to apps/backend), BACKUP_DIR (default ./backups), BACKUP_KEEP.
 */
import { spawn } from 'node:child_process';
import { existsSync, mkdirSync, readdirSync, rmSync, statSync } from 'node:fs';
import { join } from 'node:path';

import {
  backupDir,
  env,
  fail,
  finished,
  formatSize,
  parseArgs,
  prune,
  timestamp,
  uploadDir,
  writeChecksum,
} from './common.mjs';

const args = parseArgs();
const source = uploadDir();
const dir = backupDir('media', args.out);
const keep = Number(args.keep ?? env.BACKUP_KEEP ?? 14);

if (!existsSync(source)) fail(`Upload folder not found: ${source}`);
mkdirSync(dir, { recursive: true });

const fileCount = readdirSync(source).filter((name) => !name.startsWith('.')).length;
const file = join(dir, `uploads-${timestamp()}.tar.gz`);
console.log(`Archiving ${fileCount} file(s) from ${source} → ${file}`);

// Relative paths inside the archive (`./<file>`), so it can be extracted into any upload folder.
const tar = spawn('tar', ['-czf', file, '-C', source, '.'], {
  stdio: ['ignore', 'ignore', 'pipe'],
});
tar.on('error', (error) => fail(`Could not run tar: ${error.message}`));
const { code, stderr } = await finished(tar);
if (code !== 0) {
  rmSync(file, { force: true });
  fail(`tar exited with code ${code}${stderr ? `:\n${stderr}` : ''}`);
}

const digest = await writeChecksum(file);
console.log(`✔ ${formatSize(statSync(file).size)} · sha256 ${digest.slice(0, 16)}…`);
const removed = prune(dir, 'uploads-', keep);
if (removed.length) console.log(`  Removed ${removed.length} old archive(s), keeping ${keep}`);
