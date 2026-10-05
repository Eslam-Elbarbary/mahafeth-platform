import type { ProjectStatus } from '@/content/types';
import { cx } from '@/lib/cx';

/** Backend `ProjectStatus` → legacy modifier (`av` available, `cn` construction, `sn` soon, `sd` sold out). */
const STATUS_CLASS: Record<ProjectStatus, string> = {
  AVAILABLE: 'st--av',
  UNDER_CONSTRUCTION: 'st--cn',
  COMING_SOON: 'st--sn',
  SOLD_OUT: 'st--sd',
};

/** `.st` — project status with a coloured dot. */
export function StatusBadge({
  status,
  label,
  className,
}: {
  status: ProjectStatus;
  label: string;
  className?: string;
}) {
  return (
    <span className={cx('st', STATUS_CLASS[status], className)}>
      <s />
      {label}
    </span>
  );
}
