import { env } from '@/lib/env';

/*
 * Media `url`s are absolute (CDN) or backend-relative (`/uploads/…`). With a relative API URL the
 * admin shares the backend origin (Vite proxies `/uploads` in dev), so relative paths work as-is.
 */
const apiOrigin = /^https?:\/\//.test(env.apiUrl) ? new URL(env.apiUrl).origin : null;

export function mediaSrc(url: string) {
  if (/^https?:\/\//.test(url) || !apiOrigin) return url;
  return new URL(url, apiOrigin).toString();
}

/** Pixel size of an image file, read in the browser before upload. */
export async function readImageSize(file: File): Promise<{ width: number; height: number } | null> {
  try {
    const bitmap = await createImageBitmap(file);
    const size = { width: bitmap.width, height: bitmap.height };
    bitmap.close();
    return size;
  } catch {
    return null;
  }
}
