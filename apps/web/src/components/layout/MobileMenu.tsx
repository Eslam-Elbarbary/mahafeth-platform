'use client';

import { ArrowButton } from '@/components/ui/ArrowButton';
import { SmartLink } from '@/components/ui/SmartLink';
import type { NavLink } from '@/content/types';
import { cx } from '@/lib/cx';

type MobileMenuProps = {
  open: boolean;
  label: string;
  links: NavLink[];
  sub: NavLink;
  cta: NavLink;
  phone: string;
  onNavigate: () => void;
};

/** Full-screen menu (`.mmenu`) revealed with a clip-path wipe; links stagger in. */
export function MobileMenu({ open, label, links, sub, cta, phone, onNavigate }: MobileMenuProps) {
  return (
    <div className={cx('mmenu', open && 'is-on')} id="mmenu" aria-hidden={!open}>
      <nav className="mmenu__nav" aria-label={label}>
        {links.map((link) => (
          <SmartLink key={link.href} href={link.href} onClick={onNavigate}>
            {link.label}
          </SmartLink>
        ))}
        <SmartLink className="mmenu__sub" href={sub.href} onClick={onNavigate}>
          {sub.label}
        </SmartLink>
      </nav>
      <div className="mmenu__ft">
        <ArrowButton size="sm" href={cta.href} onClick={onNavigate}>
          {cta.label}
        </ArrowButton>
        <a className="ltr mmenu__tel" href={`tel:${phone}`} onClick={onNavigate}>
          {phone}
        </a>
      </div>
    </div>
  );
}
