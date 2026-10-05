'use client';

import Link from 'next/link';
import type { ComponentPropsWithRef } from 'react';

import type { InterestKey } from '@/content/types';
import { isInternalRoute, useResolveHref } from '@/lib/i18n/href';

export type SmartLinkProps = Omit<ComponentPropsWithRef<'a'>, 'href'> & {
  /** Content href (`#section`, `/route`, `tel:` …) — resolved against the current locale/page. */
  href: string;
  go?: number;
  interest?: InterestKey;
};

/** Anchor that renders `next/link` for routes and a plain `<a>` for in-page anchors and external URLs. */
export function SmartLink({ href, go, interest, ...rest }: SmartLinkProps) {
  const resolve = useResolveHref();
  const url = resolve(href);
  const data = { 'data-go': go, 'data-k': interest };
  if (isInternalRoute(url)) return <Link href={url} {...data} {...rest} />;
  return <a href={url} {...data} {...rest} />;
}
