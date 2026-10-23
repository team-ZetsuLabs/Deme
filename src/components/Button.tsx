import type { AnchorHTMLAttributes, ButtonHTMLAttributes } from 'react'
import { Link } from 'react-router-dom'
import type { LinkProps } from 'react-router-dom'
import styles from './Button.module.css'

type Look = {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'dangerLine'
  size?: 'md' | 'sm' | 'icon'
  block?: boolean
}

export type ButtonProps = Look & ButtonHTMLAttributes<HTMLButtonElement> & { busy?: boolean }

export type ButtonLinkProps = Look & LinkProps
export type ExternalLinkProps = Look & AnchorHTMLAttributes<HTMLAnchorElement>

export function buttonClass({ variant = 'secondary', size = 'md', block }: Look, extra?: string) {
  return [styles.btn, styles[variant], size !== 'md' && styles[size], block && styles.block, extra]
    .filter(Boolean)
    .join(' ')
}

export default function Button({
  variant,
  size,
  block,
  busy,
  type = 'button',
  className,
  children,
  ...rest
}: ButtonProps) {
  return (
    <button
      type={type}
      className={buttonClass({ variant, size, block }, className)}
      aria-busy={busy || undefined}
      {...rest}
    >
      {busy && <span className={styles.spinner} aria-hidden="true" />}
      {children}
    </button>
  )
}

export function ButtonLink({ variant, size, block, className, ...rest }: ButtonLinkProps) {
  return <Link className={buttonClass({ variant, size, block }, className)} {...rest} />
}

export function ExternalButtonLink({
  variant,
  size,
  block,
  className,
  ...rest
}: ExternalLinkProps) {
  return <a className={buttonClass({ variant, size, block }, className)} {...rest} />
}
