import type { ReactNode } from 'react';
import styles from './StateMessage.module.css';

export type StateMessageProps = {
  children: ReactNode;
  action?: ReactNode;
  role?: 'alert' | 'status';
};

/** Message centré pour une liste vide ou une erreur, avec une action facultative. */
export function StateMessage({ children, action, role }: StateMessageProps) {
  return (
    <div className={styles.box} role={role}>
      <p>{children}</p>
      {action && <div className={styles.action}>{action}</div>}
    </div>
  );
}
