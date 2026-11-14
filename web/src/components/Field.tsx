import type { ReactNode } from 'react';
import { errorId, hintId } from './fieldIds';
import styles from './Field.module.css';

export type FieldProps = {
  /** id du contrôle, relié au libellé. */
  id: string;
  label: ReactNode;
  hint?: ReactNode;
  error?: string | null;
  /** Élément placé à droite du libellé (lien, compteur). */
  labelAside?: ReactNode;
  /** Le contrôle doit porter id, aria-invalid et aria-describedby (voir describedBy). */
  children: ReactNode;
};

export function Field({ id, label, hint, error, labelAside, children }: FieldProps) {
  return (
    <div className={styles.field}>
      <div className={styles.labelRow}>
        <label htmlFor={id} className={styles.label}>
          {label}
        </label>
        {labelAside}
      </div>
      {children}
      {hint && (
        <p id={hintId(id)} className={styles.hint}>
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId(id)} className={styles.error}>
          {error}
        </p>
      )}
    </div>
  );
}
