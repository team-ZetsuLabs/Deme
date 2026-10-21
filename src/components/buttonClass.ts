import styles from './Button.module.css';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'dark';

export type ButtonStyle = {
  variant?: ButtonVariant;
  size?: 'md' | 'sm';
  iconOnly?: boolean;
  block?: boolean;
};

/** Classes d'un bouton, aussi utilisables sur un <Link> qui a l'apparence d'un bouton. */
export function buttonClass({
  variant = 'secondary',
  size = 'md',
  iconOnly,
  block,
}: ButtonStyle = {}) {
  return [
    styles.btn,
    styles[variant],
    size === 'sm' && styles.sm,
    iconOnly && styles.icon,
    block && styles.block,
  ]
    .filter(Boolean)
    .join(' ');
}

export const spinnerClass = styles.spinner;
