import { ImageOff } from 'lucide-react';

import type { MediaSummary } from '@/features/media/types';
import { mediaSrc } from '@/lib/media-url';
import { cn } from '@/lib/utils';

/**
 * Partner logo on the website's marquee card colour — the supplied logos are white artwork, so a
 * light background would hide them.
 */
export function LogoTile({
  logo,
  alt = '',
  className,
}: {
  logo: MediaSummary | null;
  alt?: string;
  className?: string;
}) {
  return (
    <span
      className={cn(
        'flex shrink-0 items-center justify-center overflow-hidden rounded-lg border border-[#1f4022]/30 bg-[#1f4022] p-2',
        className,
      )}
    >
      {logo ? (
        <img src={mediaSrc(logo.url)} alt={alt} className="size-full object-contain" />
      ) : (
        <ImageOff className="size-4 text-white/60" />
      )}
    </span>
  );
}
