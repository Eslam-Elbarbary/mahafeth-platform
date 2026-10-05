/*
 * Coordination between <IntroOverlay> and <Hero> (siblings): the intro asks the hero to reveal
 * (`fast` = skip the staggered tween) and needs the hero logo slot to fly the coin into.
 * The last request is retained because the intro's effects run before the hero subscribes.
 */
type RevealFn = (fast: boolean) => void;

const listeners = new Set<RevealFn>();
let pending: boolean | null = null;
let heroSlot: HTMLElement | null = null;

export function requestHeroReveal(fast: boolean) {
  pending = fast;
  listeners.forEach((fn) => fn(fast));
}

export function onHeroReveal(fn: RevealFn): () => void {
  listeners.add(fn);
  if (pending !== null) fn(pending);
  return () => {
    listeners.delete(fn);
    if (!listeners.size) pending = null;
  };
}

export function registerHeroSlot(el: HTMLElement | null) {
  heroSlot = el;
}

export function getHeroSlot(): HTMLElement | null {
  return heroSlot;
}
