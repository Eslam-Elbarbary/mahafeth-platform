'use client';

import { createContext, use, type ReactNode } from 'react';

import type { Dictionary } from './types';

const DictionaryContext = createContext<Dictionary | null>(null);

export function DictionaryProvider({
  dictionary,
  children,
}: {
  dictionary: Dictionary;
  children: ReactNode;
}) {
  return <DictionaryContext value={dictionary}>{children}</DictionaryContext>;
}

export function useDictionary(): Dictionary {
  const ctx = use(DictionaryContext);
  if (!ctx) throw new Error('useDictionary must be used inside <DictionaryProvider>');
  return ctx;
}
