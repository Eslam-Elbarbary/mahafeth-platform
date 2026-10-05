import type { ReactNode } from 'react';

import { Reveal } from '@/components/ui/Reveal';
import { SectionLabel } from '@/components/ui/SectionLabel';
import { SplitHeading } from '@/components/ui/SplitHeading';
import { cx } from '@/lib/cx';

type SectionHeaderProps = {
  label: string;
  titleLines: string[];
  lede?: string;
  /** Button/link aligned to the inline end on wide screens. */
  action?: ReactNode;
  /** `serif` = statement heading (`.stmt`), default = light sans (`.big`). */
  tone?: 'serif';
  className?: string;
};

/** Section label + split-word heading + optional lede and action, with the site's reveal timings. */
export function SectionHeader({
  label,
  titleLines,
  lede,
  action,
  tone,
  className,
}: SectionHeaderProps) {
  return (
    <header className={cx('shd', action != null && 'shd--act', className)}>
      <div className="shd__main">
        <SectionLabel>{label}</SectionLabel>
        <SplitHeading className={tone === 'serif' ? 'stmt' : 'big'} lines={titleLines} />
        {lede && (
          <Reveal as="p" className="lede shd__lede" delay={160}>
            {lede}
          </Reveal>
        )}
      </div>
      {action && <div className="shd__act">{action}</div>}
    </header>
  );
}
