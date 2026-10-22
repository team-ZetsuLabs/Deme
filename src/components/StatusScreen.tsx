import type { ReactNode } from 'react';
import styles from './StatusScreen.module.css';

export type StatusScreenProps = {
  /** Repère court au-dessus du titre, décoratif : « 404 », « Erreur »… */
  code: string;
  title: string;
  text: string;
  actions?: ReactNode;
};

/** Écran plein pour une page introuvable, une erreur ou la maintenance. */
export function StatusScreen({ code, title, text, actions }: StatusScreenProps) {
  return (
    <section className={styles.panel}>
      <p className={styles.code} aria-hidden="true">
        {code}
      </p>
      <h1 className={styles.title}>{title}</h1>
      <p className={styles.text}>{text}</p>
      {actions && <div className={styles.actions}>{actions}</div>}
    </section>
  );
}
