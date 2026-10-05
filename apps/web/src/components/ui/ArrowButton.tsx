'use client';

import { useRef, type ComponentPropsWithoutRef, type ReactNode, type Ref } from 'react';

import type { InterestKey } from '@/content/types';
import { cx, withDelay } from '@/lib/cx';
import { useInViewOnce } from '@/lib/motion/in-view';
import { useMagnetic } from '@/lib/motion/magnetic';

import { ArrowIcon } from './icons';
import { SmartLink } from './SmartLink';

type CommonProps = {
  children: ReactNode;
  size?: 'sm' | 'lg';
  /** White pill (`.abtn--w`) used on the hero. */
  tone?: 'white';
  /** `.is-on` — pressed/expanded state (story toggle). */
  active?: boolean;
  /** Adds `.rv` scroll reveal; a number is the `--d` delay in ms. */
  reveal?: boolean | number;
  magnetic?: boolean;
};

type LinkProps = CommonProps &
  Omit<ComponentPropsWithoutRef<'a'>, 'href' | 'children'> & {
    href: string;
    go?: number;
    interest?: InterestKey;
  };

type ButtonProps = CommonProps &
  Omit<ComponentPropsWithoutRef<'button'>, 'children'> & { href?: undefined };

export type ArrowButtonProps = LinkProps | ButtonProps;

/** `.abtn` — circular arrow that slides across the pill on hover (legacy markup and timings). */
export function ArrowButton(props: ArrowButtonProps) {
  const {
    children,
    size,
    tone,
    active,
    reveal,
    magnetic = true,
    className,
    style,
    ...rest
  } = props;
  const ref = useRef<HTMLElement>(null);
  useMagnetic(ref, 0.2, magnetic);
  const shown = useInViewOnce(ref, { enabled: reveal !== undefined && reveal !== false });

  const classes = cx(
    'abtn',
    size && `abtn--${size}`,
    tone === 'white' && 'abtn--w',
    reveal !== undefined && reveal !== false && 'rv',
    shown && 'is-in',
    active && 'is-on',
    className,
  );
  const styles = withDelay(style, typeof reveal === 'number' ? reveal : undefined);
  const content = (
    <>
      <span className="abtn__c">
        <ArrowIcon />
      </span>
      <span className="abtn__t">{children}</span>
      <span className="abtn__c abtn__c--e">
        <ArrowIcon />
      </span>
    </>
  );

  if (rest.href !== undefined) {
    return (
      <SmartLink
        ref={ref as Ref<HTMLAnchorElement>}
        className={classes}
        style={styles}
        {...(rest as Omit<LinkProps, keyof CommonProps>)}
      >
        {content}
      </SmartLink>
    );
  }
  const {
    href: _href,
    type = 'button',
    ...buttonRest
  } = rest as Omit<ButtonProps, keyof CommonProps>;
  return (
    <button
      ref={ref as Ref<HTMLButtonElement>}
      type={type}
      className={classes}
      style={styles}
      {...buttonRest}
    >
      {content}
    </button>
  );
}
