'use client';

import Image from 'next/image';
import { useRef, type CSSProperties, type ReactNode } from 'react';

import { ArrowButton } from '@/components/ui/ArrowButton';
import { ArrowIcon } from '@/components/ui/icons';
import { SmartLink } from '@/components/ui/SmartLink';
import { SplitHeading } from '@/components/ui/SplitHeading';
import type { SiteContent, SocialLink } from '@/content/types';
import { cx } from '@/lib/cx';
import { useInViewOnce } from '@/lib/motion/in-view';
import { useMagnetic } from '@/lib/motion/magnetic';

const SOCIAL_ICONS: Record<SocialLink['network'], ReactNode> = {
  linkedin: (
    <path d="M4.5 3.5a2 2 0 1 1 0 4 2 2 0 0 1 0-4zM3 9h3v11H3zM10 9h3v1.6c.6-1 1.8-1.9 3.6-1.9 3.4 0 4.4 2.2 4.4 5.2V20h-3v-5.4c0-1.6-.4-2.8-2-2.8s-2.3 1.2-2.3 2.8V20h-3z" />
  ),
  x: <path d="M3 3h4.6l4.7 6.6L18 3h2.4l-7 8.2L21 21h-4.6l-5-7-6.2 7H2.8l7.5-8.6z" />,
  instagram: (
    <path d="M7.5 2.5h9A5 5 0 0 1 21.5 7.5v9a5 5 0 0 1-5 5h-9a5 5 0 0 1-5-5v-9a5 5 0 0 1 5-5zm0 2A3 3 0 0 0 4.5 7.5v9a3 3 0 0 0 3 3h9a3 3 0 0 0 3-3v-9a3 3 0 0 0-3-3zM12 8a4 4 0 1 1 0 8 4 4 0 0 1 0-8zm0 2a2 2 0 1 0 0 4 2 2 0 0 0 0-4zm5-3.2a1.1 1.1 0 1 1 0 2.2 1.1 1.1 0 0 1 0-2.2z" />
  ),
  snapchat: (
    <path d="M12 2.5c3 0 5 2.2 5 5.2v2.1c.5.1 1-.1 1.5-.3.5-.2.9.4.6.8-.5.7-1.4 1-2 1.3.6 1.6 2.1 3 3.9 3.5.5.1.6.6.2.9-.7.5-1.6.6-2.3.9-.2.4-.2 1-.7 1.1-.7.1-1.5-.2-2.2.1-1.2.5-2 1.7-4 1.7s-2.8-1.2-4-1.7c-.7-.3-1.5 0-2.2-.1-.5-.1-.5-.7-.7-1.1-.7-.3-1.6-.4-2.3-.9-.4-.3-.3-.8.2-.9 1.8-.5 3.3-1.9 3.9-3.5-.6-.3-1.5-.6-2-1.3-.3-.4.1-1 .6-.8.5.2 1 .4 1.5.3V7.7c0-3 2-5.2 5-5.2z" />
  ),
};

const FOOTER_REVEAL: IntersectionObserverInit = { rootMargin: '0px 0px -10% 0px', threshold: 0.08 };

const stagger = (i: number) => ({ '--i': i }) as CSSProperties;

function SocialButton({ link }: { link: SocialLink }) {
  const ref = useRef<HTMLAnchorElement>(null);
  useMagnetic(ref, 0.35);
  return (
    <a ref={ref} className="foot__soc" href={link.href} aria-label={link.label}>
      <svg viewBox="0 0 24 24" aria-hidden="true">
        {SOCIAL_ICONS[link.network]}
      </svg>
    </a>
  );
}

/**
 * Corporate footer. Brand column first in the DOM, so the grid places it on the inline start
 * (right in Arabic, left in English) with the link columns after it. The main block gains `.is-in`
 * on first view: the seal scales in, columns rise with a stagger (`--i`) and the dividers draw.
 */
export function Footer({ site }: { site: SiteContent }) {
  const { footer, brand } = site;
  const { contact } = footer;
  const year = new Date().getFullYear();
  const mainRef = useRef<HTMLDivElement>(null);
  const shown = useInViewOnce(mainRef, { options: FOOTER_REVEAL });

  return (
    <footer className="foot" id="footer">
      <div className="wrap foot__cta">
        <SplitHeading className="foot__huge" lines={[footer.heading]} />
        <ArrowButton size="lg" reveal={150} href={footer.cta.href}>
          {footer.cta.label}
        </ArrowButton>
      </div>

      <div className={cx('wrap foot__main', shown && 'is-in')} ref={mainRef}>
        <i className="foot__rule" aria-hidden="true" />

        <div className="foot__brand">
          <SmartLink className="foot__seal" href="#top" aria-label={brand.homeLabel}>
            <Image src={brand.seal.src} alt="" width={120} height={120} sizes="120px" />
          </SmartLink>
          <p className="foot__name">{brand.name}</p>
          <p className="foot__tag">{footer.tagline}</p>
          <div className="foot__social">
            <p>{footer.socialLabel}</p>
            <div className="foot__socs">
              {footer.social.map((s) => (
                <SocialButton key={s.network} link={s} />
              ))}
            </div>
          </div>
        </div>

        <div className="foot__cols">
          {footer.columns.map((col, i) => (
            <nav key={col.id} className="foot__col" aria-label={col.title} style={stagger(i + 1)}>
              <h3 className="foot__h">
                <i>{String(i + 1).padStart(2, '0')}</i>
                {col.title}
              </h3>
              <ul>
                {col.links.map((link) => (
                  <li key={`${link.href}-${link.label}`}>
                    <SmartLink href={link.href} interest={link.interest}>
                      {link.label}
                    </SmartLink>
                  </li>
                ))}
              </ul>
            </nav>
          ))}

          <div
            className="foot__col foot__contact"
            id="branches"
            style={stagger(footer.columns.length + 1)}
          >
            <h3 className="foot__h">
              <i>{String(footer.columns.length + 1).padStart(2, '0')}</i>
              {contact.title}
            </h3>
            <span className="foot__k">{contact.phoneLabel}</span>
            <a className="foot__tel ltr" href={`tel:${contact.phone}`}>
              {contact.phone}
            </a>
            <a
              className="foot__wa"
              href={`https://wa.me/${site.contact.whatsapp}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              {contact.whatsappLabel}
            </a>
            <span className="foot__k">{contact.branchesLabel}</span>
            <ul className="foot__branches">
              {contact.branches.map((branch) => (
                <li key={`${branch.city}-${branch.address}`}>
                  <span className="foot__bcity">{branch.city}</span>
                  {branch.address && <span className="foot__baddr">{branch.address}</span>}
                  {branch.phone && (
                    <a className="foot__bphone ltr" href={`tel:${branch.phone}`}>
                      {branch.phone}
                    </a>
                  )}
                </li>
              ))}
            </ul>
            <SmartLink className="foot__more" href={contact.cta.href}>
              {contact.cta.label}
              <ArrowIcon />
            </SmartLink>
          </div>
        </div>
      </div>

      <div className="wrap foot__bt">
        <div className="foot__meta">
          <span className="foot__copy">
            <bdi dir="ltr">
              © {year}{' '}
              <a href={footer.copyright.href} target="_blank" rel="noopener noreferrer">
                {footer.copyright.holder}
              </a>
              .
            </bdi>{' '}
            {footer.copyright.rights}
          </span>
        </div>
        <nav className="foot__legal">
          {footer.legal.map((link) => (
            <SmartLink key={link.label} href={link.href}>
              {link.label}
            </SmartLink>
          ))}
        </nav>
      </div>
    </footer>
  );
}
