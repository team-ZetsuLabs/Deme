import type { ComponentPropsWithoutRef } from 'react';
import styles from './Tag.module.css';

export type TagProps = ComponentPropsWithoutRef<'button'> & {
  /** Tag actif (filtre appliqué). */
  pressed?: boolean;
};

/** Tag cliquable, en police mono. Pour un tag non cliquable, utiliser <span className={tagClass}>. */
export function Tag({ pressed, className, type = 'button', ...rest }: TagProps) {
  return (
    <button
      {...rest}
      type={type}
      aria-pressed={pressed}
      className={className ? `${styles.tag} ${className}` : styles.tag}
    />
  );
}
