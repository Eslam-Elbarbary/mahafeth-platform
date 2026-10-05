import type { ReactNode } from 'react';

import { Reveal } from './Reveal';

/** `.lbl` — seal bullet + section name. */
export function SectionLabel({
  children,
  reveal = true,
}: {
  children: ReactNode;
  reveal?: boolean;
}) {
  const content = (
    <>
      <i className="lbl__i" />
      <span>{children}</span>
    </>
  );
  return reveal ? <Reveal className="lbl">{content}</Reveal> : <div className="lbl">{content}</div>;
}
