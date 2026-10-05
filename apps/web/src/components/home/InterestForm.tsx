'use client';

import {
  Fragment,
  Suspense,
  useCallback,
  useEffect,
  useRef,
  useState,
  type FormEvent,
} from 'react';

import { CloseIcon } from '@/components/ui/icons';
import { Chip } from '@/components/ui/Chip';
import { Pill } from '@/components/ui/Pill';
import { Reveal } from '@/components/ui/Reveal';
import { SectionLabel } from '@/components/ui/SectionLabel';
import type { CityKey, InterestContent, InterestKey } from '@/content/types';
import { cx } from '@/lib/cx';
import { useLocale } from '@/lib/i18n/locale-provider';
import { type LeadSource, submitLead } from '@/lib/leads';
import { gsap } from '@/lib/motion/gsap';
import { useMotion } from '@/lib/motion/motion-provider';

import { InterestPrefill, type InterestPrefillParams } from './InterestPrefill';

const FLASH_DELAY_MS = 750;
const FLASH_MS = 1300;

/** Projects the form can be pre-filled with from `?project=` (slug → name, city). */
export type InterestProjectOption = { slug: string; name: string; city: CityKey };

/**
 * Register-interest form (legacy `lead()`): floating-label fields, single-select chips,
 * inline validation, animated success state. Any `#interest` link flashes the card and may
 * pre-select an interest via `data-k`; project pages deep-link with `?project=&interest=`, which
 * pre-selects the project, its city and the interest. Submissions are posted to the CMS as leads.
 */
export function InterestForm({
  content,
  projects = [],
  source = 'WEBSITE',
}: {
  content: InterestContent;
  projects?: InterestProjectOption[];
  /** Lead source when no project is attached (a selected project always reports `PROJECT_PAGE`). */
  source?: Exclude<LeadSource, 'PROJECT_PAGE'>;
}) {
  const { locale } = useLocale();
  const submitting = useRef(false);
  const [project, setProject] = useState<InterestProjectOption | null>(null);
  const { reducedMotion } = useMotion();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [city, setCity] = useState<CityKey | null>(null);
  const [interest, setInterest] = useState<InterestKey | null>(null);
  const [errors, setErrors] = useState({ name: false, phone: false });
  const [message, setMessage] = useState('');
  const [sent, setSent] = useState(false);
  const [okOn, setOkOn] = useState(false);
  const [flash, setFlash] = useState(false);
  const hdRef = useRef<HTMLDivElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const okRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timers = new Set<ReturnType<typeof setTimeout>>();
    let raf = 0;
    const later = (fn: () => void, ms: number) => {
      const t = setTimeout(() => {
        timers.delete(t);
        fn();
      }, ms);
      timers.add(t);
    };
    const onClick = (e: MouseEvent) => {
      const a = (e.target as Element | null)?.closest<HTMLAnchorElement>('a[href="#interest"]');
      if (!a) return;
      const k = a.dataset.k as InterestKey | undefined;
      if (k) setInterest(k);
      later(() => {
        setFlash(false);
        cancelAnimationFrame(raf);
        raf = requestAnimationFrame(() => {
          raf = requestAnimationFrame(() => {
            setFlash(true);
            later(() => setFlash(false), FLASH_MS);
          });
        });
      }, FLASH_DELAY_MS);
    };
    document.addEventListener('click', onClick);
    return () => {
      document.removeEventListener('click', onClick);
      timers.forEach(clearTimeout);
      cancelAnimationFrame(raf);
    };
  }, []);

  const prefill = useCallback(
    ({ project: slug, interest: key }: InterestPrefillParams) => {
      const match = projects.find((p) => p.slug === slug) ?? null;
      setProject(match);
      if (match) setCity(match.city);
      const k = content.interests.find((it) => it.key === key)?.key;
      if (k) setInterest(k);
      if (match || k) {
        setFlash(false);
        requestAnimationFrame(() => requestAnimationFrame(() => setFlash(true)));
        setTimeout(() => setFlash(false), FLASH_DELAY_MS + FLASH_MS);
      }
    },
    [projects, content.interests],
  );

  useEffect(() => {
    if (!sent) return;
    const raf = requestAnimationFrame(() => {
      setOkOn(true);
      if (!reducedMotion)
        gsap.fromTo(
          okRef.current,
          { opacity: 0, y: 10 },
          { opacity: 1, y: 0, duration: 0.5, ease: 'power3.out' },
        );
    });
    return () => cancelAnimationFrame(raf);
  }, [sent, reducedMotion]);

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const nameOk = name.trim().length >= 2;
    const digits = phone.replace(/[^\d]/g, '');
    const phoneOk = digits.length >= 9 && digits.length <= 14;
    setErrors({ name: !nameOk, phone: !phoneOk });
    if (!nameOk || !phoneOk) {
      setMessage(!nameOk ? content.errors.name : content.errors.phone);
      return;
    }
    if (!city) {
      setMessage(content.errors.city);
      return;
    }
    if (submitting.current) return;
    submitting.current = true;
    setMessage('');
    const result = await submitLead({
      name: name.trim(),
      phone: phone.trim(),
      city,
      interest,
      project: project?.slug ?? null,
      source: project ? 'PROJECT_PAGE' : source,
      locale,
    });
    submitting.current = false;
    if (!result.ok) {
      setMessage(content.errors.submit);
      return;
    }
    if (reducedMotion) setSent(true);
    else
      gsap.to([hdRef.current, formRef.current], {
        opacity: 0,
        y: -8,
        duration: 0.35,
        ease: 'power2.in',
        onComplete: () => setSent(true),
      });
  };

  const again = () => {
    setOkOn(false);
    setSent(false);
    setName('');
    setPhone('');
    setCity(null);
    setInterest(null);
    setProject(null);
    setErrors({ name: false, phone: false });
    gsap.set([hdRef.current, formRef.current], { clearProps: 'all' });
  };

  return (
    <section className="sec intr" id="interest">
      <Suspense fallback={null}>
        <InterestPrefill onPrefill={prefill} />
      </Suspense>
      <div className="wrap intr__g">
        <div className="intr__c">
          <SectionLabel>{content.label}</SectionLabel>
          <Reveal as="h2" className="big" delay={90}>
            {content.titleLines.map((line, i) => (
              <Fragment key={i}>
                {i > 0 && <br />}
                {line}
              </Fragment>
            ))}
          </Reveal>
          <Reveal as="p" className="lede" delay={150}>
            {content.lede}
          </Reveal>
          <Reveal className="intr__pts" delay={210}>
            {content.points.map((point) => (
              <p key={point} className="intr__pt">
                <s />
                {point}
              </p>
            ))}
          </Reveal>
        </div>
        <aside className="lead" aria-labelledby="leadT">
          <Reveal
            className={cx('lead__card', flash && 'is-flash')}
            variant="s"
            delay={180}
            id="leadCard"
          >
            <div className="lead__hd" ref={hdRef} hidden={sent}>
              <h2 id="leadT">{content.card.title}</h2>
              <p>{content.card.body}</p>
            </div>
            <form
              className="lead__f"
              id="leadForm"
              ref={formRef}
              noValidate
              hidden={sent}
              onSubmit={onSubmit}
            >
              {project && (
                <div className="lead__proj">
                  <span>{content.project.label}</span>
                  <b>{project.name}</b>
                  <button
                    type="button"
                    aria-label={content.project.clear}
                    onClick={() => setProject(null)}
                  >
                    <CloseIcon />
                  </button>
                </div>
              )}
              <div className={cx('fld', errors.name && 'is-err')}>
                <input
                  id="fName"
                  name="name"
                  type="text"
                  autoComplete="name"
                  placeholder=" "
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
                <label htmlFor="fName">{content.fields.name}</label>
              </div>
              <div className={cx('fld', errors.phone && 'is-err')}>
                <input
                  id="fTel"
                  name="tel"
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel"
                  placeholder=" "
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
                <label htmlFor="fTel">{content.fields.phone}</label>
              </div>
              <div className="fld fld--g">
                <span className="fld__lb">{content.fields.city}</span>
                <div
                  className="chips"
                  data-name="city"
                  role="group"
                  aria-label={content.fields.city}
                >
                  {content.cities.map((c) => (
                    <Chip
                      key={c.key}
                      pressed={city === c.key}
                      onClick={() => setCity(city === c.key ? null : c.key)}
                    >
                      {c.label}
                    </Chip>
                  ))}
                </div>
              </div>
              <div className="fld fld--g">
                <span className="fld__lb">{content.fields.interest}</span>
                <div
                  className="chips"
                  data-name="interest"
                  id="interestChips"
                  role="group"
                  aria-label={content.fields.interest}
                >
                  {content.interests.map((it) => (
                    <Chip
                      key={it.key}
                      data-k={it.key}
                      pressed={interest === it.key}
                      onClick={() => setInterest(interest === it.key ? null : it.key)}
                    >
                      {it.label}
                    </Chip>
                  ))}
                </div>
              </div>
              <Pill fill block type="submit">
                {content.submit}
              </Pill>
              <p className="lead__note">{content.note}</p>
              <p className="lead__msg" id="leadMsg" role="status" aria-live="polite">
                {message}
              </p>
            </form>
            <div className={cx('lead__ok', okOn && 'is-on')} id="leadOk" ref={okRef} hidden={!sent}>
              <svg viewBox="0 0 64 64" aria-hidden="true">
                <circle cx="32" cy="32" r="29" pathLength={1} />
                <path d="M20 33.5 28.5 42 45 24" pathLength={1} />
              </svg>
              <h3>{content.success.title}</h3>
              <p>{content.success.body}</p>
              <Pill id="leadAgain" onClick={again}>
                {content.success.again}
              </Pill>
            </div>
          </Reveal>
        </aside>
      </div>
    </section>
  );
}
