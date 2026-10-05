import type { Bilingual } from './localize';
import type { MediaAsset } from './types';

/** Local stand-ins for backend `Media` rows (files live in `public/images`). */
export function media(
  src: string,
  width: number,
  height: number,
  alt: Bilingual<string> = '',
  position?: string,
): Bilingual<MediaAsset> {
  return position ? { src, width, height, alt, position } : { src, width, height, alt };
}

export const brandImages = {
  logo192: media('/images/brand/logo-seal-192.png', 192, 192),
  logo512: media('/images/brand/logo-seal-512.png', 512, 512),
};
