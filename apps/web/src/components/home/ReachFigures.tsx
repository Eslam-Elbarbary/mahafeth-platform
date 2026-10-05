import type { ReactNode } from 'react';

import type { InterestKey } from '@/content/types';

/* Line illustrations drawn with `pathLength="1"` so CSS can animate `stroke-dashoffset` 1 → 0. */
export const REACH_FIGURES: Record<InterestKey, ReactNode> = {
  own: (
    <>
      <path pathLength={1} d="M38 102 100 48l62 54" />
      <path pathLength={1} d="M56 90v62h88V90" />
      <path pathLength={1} d="M90 152v-32h20v32" />
      <path pathLength={1} d="M118 100h18v18h-18z" />
      <path pathLength={1} d="M134 64V50h12v26" />
      <path pathLength={1} d="M26 164h148" />
    </>
  ),
  invest: (
    <>
      <path pathLength={1} d="M30 162V96h30v66" />
      <path pathLength={1} d="M72 162V66h36v96" />
      <path pathLength={1} d="M120 162v-54h32v54" />
      <path pathLength={1} d="M20 162h160" />
      <path pathLength={1} d="M42 78 78 44l30 26 60-46" />
      <path pathLength={1} d="M152 24h16v16" />
      <path pathLength={1} d="M84 84h12M84 100h12M84 116h12M84 132h12" />
    </>
  ),
  owner: (
    <>
      <path pathLength={1} d="M28 150 62 116h110l-34 34z" />
      <path pathLength={1} d="M86 132v-22h30v22" />
      <path pathLength={1} d="M100 100c0-2-30-26-30-50a30 30 0 0 1 60 0c0 24-30 48-30 50z" />
      <circle pathLength={1} cx="100" cy="50" r="11" />
      <path pathLength={1} d="M24 164h152" />
    </>
  ),
  partner: (
    <>
      <circle pathLength={1} cx="78" cy="100" r="42" />
      <circle pathLength={1} cx="122" cy="100" r="42" />
      <path pathLength={1} d="M100 70v60" />
      <path pathLength={1} d="M90 100h20" />
      <path pathLength={1} d="M60 150h80" />
    </>
  ),
  job: (
    <>
      <rect pathLength={1} x="58" y="52" width="84" height="112" rx="10" />
      <path pathLength={1} d="M88 52V38h24v14" />
      <path pathLength={1} d="M100 38V22" />
      <circle pathLength={1} cx="100" cy="92" r="15" />
      <path pathLength={1} d="M74 136c4-20 48-20 52 0" />
      <path pathLength={1} d="M76 148h48" />
    </>
  ),
};
