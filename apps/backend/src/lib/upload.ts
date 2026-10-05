import { randomUUID } from 'node:crypto';
import { mkdirSync } from 'node:fs';
import { open, readFile, rm } from 'node:fs/promises';
import type { ServerResponse } from 'node:http';
import { resolve } from 'node:path';

import multer from 'multer';

import { env } from '../config/env.js';
import { HttpError } from './http-error.js';

export const uploadDir = resolve(env.UPLOAD_DIR);
mkdirSync(uploadDir, { recursive: true });

/**
 * Accepted types → stored extension. The extension comes from this map, never from the client's
 * file name, so a file can't be served back as HTML or script.
 */
const EXTENSIONS: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'image/avif': '.avif',
  'image/gif': '.gif',
  'image/svg+xml': '.svg',
  'image/x-icon': '.ico',
  'image/vnd.microsoft.icon': '.ico',
  'video/mp4': '.mp4',
  'video/webm': '.webm',
  'application/pdf': '.pdf',
};

const SVG_MAX_BYTES = 2 * 1024 * 1024;

export const upload = multer({
  storage: multer.diskStorage({
    destination: uploadDir,
    filename: (_req, file, cb) => cb(null, `${randomUUID()}${EXTENSIONS[file.mimetype]}`),
  }),
  limits: {
    fileSize: env.MAX_UPLOAD_MB * 1024 * 1024,
    files: 1,
    fields: 10,
    fieldSize: 16 * 1024,
  },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype in EXTENSIONS) cb(null, true);
    else
      cb(new HttpError(415, `Unsupported file type: ${file.mimetype}`, 'UNSUPPORTED_MEDIA_TYPE'));
  },
});

const ascii = (bytes: Buffer, start: number, end: number) =>
  bytes.subarray(start, end).toString('latin1');

/** Whether the first bytes of a file match its declared binary type. */
function matchesSignature(mimeType: string, head: Buffer) {
  switch (mimeType) {
    case 'image/jpeg':
      return head[0] === 0xff && head[1] === 0xd8 && head[2] === 0xff;
    case 'image/png':
      return head
        .subarray(0, 8)
        .equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
    case 'image/gif':
      return ascii(head, 0, 6) === 'GIF87a' || ascii(head, 0, 6) === 'GIF89a';
    case 'image/webp':
      return ascii(head, 0, 4) === 'RIFF' && ascii(head, 8, 12) === 'WEBP';
    case 'image/avif':
      return ascii(head, 4, 8) === 'ftyp' && /avi[fs]|mif1|msf1/.test(ascii(head, 8, 32));
    case 'video/mp4':
      return ascii(head, 4, 8) === 'ftyp';
    case 'video/webm':
      return head.subarray(0, 4).equals(Buffer.from([0x1a, 0x45, 0xdf, 0xa3]));
    case 'image/x-icon':
    case 'image/vnd.microsoft.icon':
      return head.subarray(0, 4).equals(Buffer.from([0x00, 0x00, 0x01, 0x00]));
    case 'application/pdf':
      return ascii(head, 0, 5) === '%PDF-';
    default:
      return false;
  }
}

/** Scriptable SVG content: refused rather than sanitized. */
const UNSAFE_SVG =
  /<script|<foreignObject|<iframe|<embed|<object|<!ENTITY|\son[a-z]+\s*=|(?:href|src)\s*=\s*["']?\s*(?:javascript|data:text\/html)/i;

function isSafeSvg(text: string) {
  const body = text.replace(/^\uFEFF/, '').trimStart();
  return (
    /^(<\?xml[^>]*>\s*)?(<!--[\s\S]*?-->\s*)*(<!DOCTYPE svg[^>]*>\s*)?<svg[\s>]/i.test(body) &&
    !UNSAFE_SVG.test(body)
  );
}

/**
 * Checks an uploaded file's content against its declared type (magic bytes; SVG markup is scanned
 * for scripts). Deletes the file and throws 415 when it does not match.
 */
export async function assertFileContent(file: Express.Multer.File) {
  let valid: boolean;
  if (file.mimetype === 'image/svg+xml') {
    valid = file.size <= SVG_MAX_BYTES && isSafeSvg(await readFile(file.path, 'utf8'));
  } else {
    const handle = await open(file.path, 'r');
    try {
      const head = Buffer.alloc(32);
      await handle.read(head, 0, head.length, 0);
      valid = matchesSignature(file.mimetype, head);
    } finally {
      await handle.close();
    }
  }
  if (!valid) {
    await rm(file.path, { force: true });
    throw new HttpError(
      415,
      'File content does not match its type or contains unsafe markup',
      'INVALID_FILE_CONTENT',
    );
  }
}

/** Response headers for files served from `/uploads` (embedded by the website on another origin). */
export function uploadHeaders(res: ServerResponse, path: string) {
  res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  if (path.endsWith('.svg')) {
    // An SVG opened directly is a document: no scripts, no plugins, no same-origin access.
    res.setHeader(
      'Content-Security-Policy',
      "default-src 'none'; style-src 'unsafe-inline'; sandbox",
    );
  } else {
    // The API's strict policy would stop browsers' built-in PDF/video viewers.
    res.removeHeader('Content-Security-Policy');
  }
}

export const publicUrlFor = (filename: string) =>
  `${env.MEDIA_BASE_URL.replace(/\/$/, '')}/${filename}`;
