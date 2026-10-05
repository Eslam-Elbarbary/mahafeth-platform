'use client';

import { useSearchParams } from 'next/navigation';
import { useEffect } from 'react';

export type InterestPrefillParams = { project: string | null; interest: string | null };

/**
 * Reads `?project=&interest=` (project-page deep links) and hands them to the form. Kept in its
 * own component so the page can stay static — it renders inside a Suspense boundary.
 */
export function InterestPrefill({ onPrefill }: { onPrefill: (p: InterestPrefillParams) => void }) {
  const params = useSearchParams();
  const project = params.get('project');
  const interest = params.get('interest');

  useEffect(() => {
    if (project || interest) onPrefill({ project, interest });
  }, [project, interest, onPrefill]);

  return null;
}
