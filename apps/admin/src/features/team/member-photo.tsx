import { UserRound } from 'lucide-react';

import type { MediaSummary } from '@/features/media/types';
import { mediaSrc } from '@/lib/media-url';
import { cn } from '@/lib/utils';

/** Member portrait cropped like the website's leadership track; an icon when there is none. */
export function MemberPhoto({
  photo,
  alt = '',
  className,
}: {
  photo: MediaSummary | null;
  alt?: string;
  className?: string;
}) {
  return (
    <span
      className={cn(
        'flex shrink-0 items-center justify-center overflow-hidden rounded-lg border bg-muted',
        className,
      )}
    >
      {photo ? (
        <img src={mediaSrc(photo.url)} alt={alt} className="size-full object-cover" />
      ) : (
        <UserRound className="size-1/2 text-muted-foreground/60" />
      )}
    </span>
  );
}
