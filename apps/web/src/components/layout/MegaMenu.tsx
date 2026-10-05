'use client';

import Image from 'next/image';
import type { MouseEvent } from 'react';

import { ArrowButton } from '@/components/ui/ArrowButton';
import { SmartLink } from '@/components/ui/SmartLink';
import type { MegaPanel } from '@/content/types';
import { cx } from '@/lib/cx';

type MegaMenuProps = {
  panels: MegaPanel[];
  openId: string | null;
  onEnter: () => void;
  onLeave: () => void;
  onLinkClick: () => void;
};

/** Desktop dropdown panels (`.mega`) — visibility is driven by `.hdr.is-mega` on the header. */
export function MegaMenu({ panels, openId, onEnter, onLeave, onLinkClick }: MegaMenuProps) {
  const handleClick = (e: MouseEvent<HTMLDivElement>) => {
    if ((e.target as Element).closest('a')) onLinkClick();
  };

  return (
    <div
      className="mega"
      id="mega"
      onMouseEnter={onEnter}
      onMouseLeave={onLeave}
      onClick={handleClick}
    >
      {panels.map((panel) => (
        <div key={panel.id} className={cx('mega__p', openId === panel.id && 'is-on')} id={panel.id}>
          <div className="mega__g">
            <div className="mega__lead">
              <h3>{panel.title}</h3>
              <p>{panel.body}</p>
              <ArrowButton size="sm" href={panel.cta.href}>
                {panel.cta.label}
              </ArrowButton>
            </div>
            <ul className="mega__ls">
              {panel.links.map((link) => (
                <li key={`${link.href}-${link.label}`}>
                  <SmartLink href={link.href} go={link.go} interest={link.interest}>
                    {link.image ? (
                      <span className="mega__lk">
                        <Image
                          className="mega__th"
                          src={link.image.src}
                          alt=""
                          width={44}
                          height={32}
                          sizes="88px"
                          style={
                            link.image.position
                              ? { objectPosition: link.image.position }
                              : undefined
                          }
                        />
                        <span>{link.label}</span>
                      </span>
                    ) : (
                      link.label
                    )}
                  </SmartLink>
                </li>
              ))}
            </ul>
          </div>
        </div>
      ))}
    </div>
  );
}
