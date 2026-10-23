import type { ButtonHTMLAttributes } from 'react'
import styles from './Button.module.css'

export type ButtonProps = {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost'
} & ButtonHTMLAttributes<HTMLButtonElement>

export default function Button({
  variant = 'secondary',
  type = 'button',
  className,
  ...rest
}: ButtonProps) {
  const classes = [styles.button, styles[variant], className].filter(Boolean).join(' ')
  return <button type={type} className={classes} {...rest} />
}
