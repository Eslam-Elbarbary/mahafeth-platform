import type { CSSProperties } from 'react';

export function cx(...parts: (string | false | null | undefined)[]): string {
  return parts.filter(Boolean).join(' ');
}

/** Adds the legacy `--d` transition-delay custom property used by `.rv` / `.fig` / `.svc__it`. */
export function withDelay(
  style: CSSProperties | undefined,
  delay: number | undefined,
): CSSProperties | undefined {
  if (!delay) return style;
  return { ...style, '--d': `${delay}ms` } as CSSProperties;
}
