/* Tiny cross-tree channels for global overlays rendered once in the locale layout. */

const FILM_OPEN = 'mhf:film-open';

export function openFilm() {
  document.dispatchEvent(new Event(FILM_OPEN));
}

export function onFilmOpen(fn: () => void): () => void {
  document.addEventListener(FILM_OPEN, fn);
  return () => document.removeEventListener(FILM_OPEN, fn);
}
