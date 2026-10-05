'use client';

import { useRef } from 'react';

import { ThemeIcon } from '@/components/ui/icons';
import { useDictionary } from '@/lib/i18n/dictionary-provider';
import { useTheme } from '@/lib/theme/theme-provider';

/** Sun/moon toggle — circular View Transition reveal centred on the button. */
export function ThemeToggle() {
  const { toggleTheme } = useTheme();
  const dict = useDictionary();
  const ref = useRef<HTMLButtonElement>(null);
  return (
    <button
      ref={ref}
      className="theme"
      id="theme"
      type="button"
      aria-label={dict.theme.toggleLabel}
      title={dict.theme.title}
      onClick={() => toggleTheme(ref.current)}
    >
      <ThemeIcon />
    </button>
  );
}
