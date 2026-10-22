import type { ComponentPropsWithoutRef } from 'react';
import { buttonClass, spinnerClass, type ButtonStyle } from './buttonClass';

export type ButtonProps = ComponentPropsWithoutRef<'button'> &
  ButtonStyle & {
    /** Affiche un indicateur et bloque les clics pendant un envoi. */
    busy?: boolean;
  };

export function Button({
  variant,
  size,
  iconOnly,
  block,
  busy = false,
  className,
  type = 'button',
  children,
  ...rest
}: ButtonProps) {
  const classes = [buttonClass({ variant, size, iconOnly, block }), className]
    .filter(Boolean)
    .join(' ');
  return (
    <button {...rest} type={type} className={classes} aria-busy={busy || undefined}>
      {busy && <span className={spinnerClass} aria-hidden="true" />}
      {children}
    </button>
  );
}
