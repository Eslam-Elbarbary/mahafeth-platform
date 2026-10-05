/* Inline SVG glyphs from the design source. */

export function ArrowIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M20 12H5M11 5l-7 7 7 7" />
    </svg>
  );
}

export function ChevronDownIcon() {
  return (
    <svg className="nav__dn" viewBox="0 0 12 12" aria-hidden="true">
      <path d="M2 4l4 4 4-4" />
    </svg>
  );
}

export function PlayIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M8 5.5v13l11-6.5z" />
    </svg>
  );
}

export function ArrowUpRightIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M7 17 17 7M8 7h9v9" />
    </svg>
  );
}

export function ExpandIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" />
    </svg>
  );
}

export function CloseIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M6 6l12 12M18 6 6 18" />
    </svg>
  );
}

/** Line glyphs for project features (`ProjectFeatureIcon`). */
const FEATURE_PATHS: Record<string, string> = {
  plan: 'M4 4h16v16H4zM4 12h7M11 4v10M15 12v8M15 16h5',
  key: 'M14.5 9.5a4.5 4.5 0 1 1-1.3-3.2 4.5 4.5 0 0 1 1.3 3.2zM11 13 4 20M7 17l2 2M5 19l1.5 1.5',
  shield: 'M12 3l7 3v6c0 4.4-3 7.7-7 9-4-1.3-7-4.6-7-9V6zM9 12l2 2 4-4',
  pin: 'M12 21s-6.5-5.6-6.5-11a6.5 6.5 0 0 1 13 0c0 5.4-6.5 11-6.5 11zM12 12.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z',
  service: 'M4 14v-2a8 8 0 0 1 16 0v2M4 14h3v5H4zM17 14h3v5h-3zM20 19c0 1.5-2 2.5-5 2.5',
  calendar: 'M4 6h16v14H4zM4 10h16M8 3v5M16 3v5',
};

export function FeatureIcon({ name }: { name: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d={FEATURE_PATHS[name] ?? FEATURE_PATHS.plan} />
    </svg>
  );
}

export function ThemeIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle className="theme__sun" cx="12" cy="12" r="4.2" />
      <g className="theme__rays">
        <path d="M12 2.5v2.4M12 19.1v2.4M2.5 12h2.4M19.1 12h2.4M5.3 5.3l1.7 1.7M17 17l1.7 1.7M5.3 18.7 7 17M17 7l1.7-1.7" />
      </g>
      <path className="theme__moon" d="M15.5 3.6a8.6 8.6 0 1 0 5 15.3A9.4 9.4 0 0 1 15.5 3.6z" />
    </svg>
  );
}
