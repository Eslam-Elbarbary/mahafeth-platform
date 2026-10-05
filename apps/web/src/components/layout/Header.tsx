'use client';

import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';

import { ChevronDownIcon } from '@/components/ui/icons';
import { SmartLink } from '@/components/ui/SmartLink';
import type { MegaPanel, SiteContent } from '@/content/types';
import { cx } from '@/lib/cx';
import { useDictionary } from '@/lib/i18n/dictionary-provider';
import { isHomePath } from '@/lib/i18n/href';
import { useLocale } from '@/lib/i18n/locale-provider';
import { useMagnetic } from '@/lib/motion/magnetic';
import { useMotion } from '@/lib/motion/motion-provider';
import { useScrollFrame } from '@/lib/motion/scroll-frame';

import { LanguageToggle } from './LanguageToggle';
import { MegaMenu } from './MegaMenu';
import { MobileMenu } from './MobileMenu';
import { ThemeToggle } from './ThemeToggle';

const MEGA_HIDE_DELAY = 140;

/**
 * Fixed header: transparent glass bar at the top (brand, centred nav, actions), floating glass
 * capsule after 24px, sliding active indicator, desktop mega menus (fine pointers) and the burger
 * menu. Nav items link to routes; on home the active item follows the visible section (`section`),
 * elsewhere it follows the current route. `.is-solid` marks every page except home.
 */
export function Header({ site }: { site: SiteContent }) {
  const { locale } = useLocale();
  const dict = useDictionary();
  const pathname = usePathname();
  const { finePointer } = useMotion();
  const solid = !isHomePath(pathname, locale);

  const [scrolled, setScrolled] = useState(false);
  const [megaId, setMegaId] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState<string | null>(null);

  const hideTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const burgerRef = useRef<HTMLButtonElement>(null);
  const ctaRef = useRef<HTMLAnchorElement>(null);
  const navRef = useRef<HTMLElement>(null);
  const indRef = useRef<HTMLSpanElement>(null);
  useMagnetic(ctaRef);

  /* The header stays docked (brand always visible) and turns into a floating capsule after 24px. */
  useScrollFrame((y) => setScrolled(y > 24));

  /* Sliding pill behind the hovered / active nav item — written imperatively, no re-render. */
  const moveIndicator = useCallback((item: Element | null) => {
    const ind = indRef.current;
    if (!ind) return;
    if (!(item instanceof HTMLElement)) {
      ind.style.opacity = '0';
      return;
    }
    ind.style.opacity = '1';
    ind.style.width = `${item.offsetWidth}px`;
    ind.style.transform = `translate3d(${item.offsetLeft}px,-50%,0)`;
  }, []);
  const indicateActive = useCallback(
    () => moveIndicator(navRef.current?.querySelector('.nav__it.is-on') ?? null),
    [moveIndicator],
  );

  useEffect(() => {
    indicateActive();
    addEventListener('resize', indicateActive, { passive: true });
    void document.fonts?.ready.then(indicateActive);
    return () => removeEventListener('resize', indicateActive);
  }, [indicateActive, activeSection, megaId, scrolled, pathname]);

  /* Mega menu */
  const showMega = useCallback((id: string) => {
    clearTimeout(hideTimer.current);
    setMegaId(id);
  }, []);
  const hideMega = useCallback(() => {
    clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(() => setMegaId(null), MEGA_HIDE_DELAY);
  }, []);
  const keepMega = useCallback(() => clearTimeout(hideTimer.current), []);

  useEffect(() => {
    if (!megaId) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') hideMega();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [megaId, hideMega]);

  useEffect(() => () => clearTimeout(hideTimer.current), []);

  /* Mobile menu */
  const setMenu = useCallback((on: boolean) => {
    setMenuOpen(on);
    document.body.classList.toggle('menu-open', on);
    document.documentElement.classList.toggle('no-scroll', on);
  }, []);

  useEffect(() => {
    if (!menuOpen) return;
    const onResize = () => {
      if (burgerRef.current && getComputedStyle(burgerRef.current).display === 'none')
        setMenu(false);
    };
    addEventListener('resize', onResize);
    return () => removeEventListener('resize', onResize);
  }, [menuOpen, setMenu]);

  useEffect(
    () => () => {
      document.body.classList.remove('menu-open');
    },
    [],
  );

  /* Active section (legacy `activeNav`) */
  useEffect(() => {
    if (solid) return;
    const ids = site.nav.map((item) => item.section).filter((id): id is string => !!id);
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) setActiveSection(entry.target.id);
        });
      },
      { rootMargin: '-40% 0px -50% 0px' },
    );
    ids.forEach((id) => {
      const el = document.getElementById(id);
      if (el) io.observe(el);
    });
    return () => io.disconnect();
  }, [solid, site.nav]);

  const panels = site.nav.map((item) => item.menu).filter((m): m is MegaPanel => !!m);
  const onRoute = (href: string) => {
    const base = `/${locale}${href}`;
    return pathname === base || pathname.startsWith(`${base}/`);
  };

  return (
    <>
      <header
        className={cx(
          'hdr',
          solid && 'is-solid',
          (scrolled || menuOpen) && 'is-scrolled',
          megaId && 'is-mega',
        )}
        id="hdr"
      >
        <div className="hdr__bar">
          <SmartLink
            className="brand is-on"
            id="brand"
            href="#top"
            aria-label={site.brand.homeLabel}
          >
            <Image src={site.brand.logo.src} alt="" width={42} height={42} />
            <span className="brand__t">{site.brand.name}</span>
          </SmartLink>

          <nav
            className="nav"
            id="nav"
            ref={navRef}
            aria-label={site.navLabel}
            onPointerOver={(e) => moveIndicator((e.target as Element).closest('.nav__it'))}
            onPointerLeave={indicateActive}
          >
            <span className="nav__ind" ref={indRef} aria-hidden="true" />
            {site.nav.map((item) => {
              const menuId = item.menu?.id;
              const current = solid
                ? onRoute(item.href)
                : !!item.section && activeSection === item.section;
              const on = menuId && megaId ? megaId === menuId : current;
              return (
                <div
                  key={item.href}
                  className={cx('nav__it', on && 'is-on')}
                  data-menu={menuId}
                  onMouseEnter={
                    finePointer ? () => (menuId ? showMega(menuId) : hideMega()) : undefined
                  }
                  onMouseLeave={finePointer && menuId ? hideMega : undefined}
                >
                  <SmartLink
                    href={item.href}
                    onFocus={finePointer && menuId ? () => showMega(menuId) : undefined}
                  >
                    {item.label}
                    {menuId && <ChevronDownIcon />}
                  </SmartLink>
                </div>
              );
            })}
          </nav>

          <div className="hdr__end" onMouseEnter={finePointer ? hideMega : undefined}>
            <LanguageToggle />
            <span className="sep" />
            <ThemeToggle />
            <a className="hdr__tel ltr" href={`tel:${site.contact.phone}`}>
              {site.contact.phone}
            </a>
            <span className="sep" />
            <SmartLink ref={ctaRef} className="hdr__cta" href={site.cta.href}>
              {site.cta.label}
            </SmartLink>
            <button
              ref={burgerRef}
              className={cx('burger', menuOpen && 'is-on')}
              id="burger"
              type="button"
              aria-label={menuOpen ? dict.menu.close : dict.menu.open}
              aria-expanded={menuOpen}
              aria-controls="mmenu"
              onClick={() => setMenu(!menuOpen)}
            >
              <i />
              <i />
              <i />
            </button>
          </div>
        </div>

        {finePointer && (
          <MegaMenu
            panels={panels}
            openId={megaId}
            onEnter={keepMega}
            onLeave={hideMega}
            onLinkClick={hideMega}
          />
        )}
      </header>

      <MobileMenu
        open={menuOpen}
        label={site.mobileNav.label}
        links={site.mobileNav.links}
        sub={site.mobileNav.sub}
        cta={site.cta}
        phone={site.contact.phone}
        onNavigate={() => setMenu(false)}
      />
    </>
  );
}
