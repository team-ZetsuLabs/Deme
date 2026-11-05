import { LoadingRegion } from '../../components/skeleton/LoadingRegion';
import { Skeleton } from '../../components/skeleton/Skeleton';
import styles from './AuthFormSkeleton.module.css';

/**
 * Squelette aux formes du formulaire de compte (onglets, boutons OAuth, champs),
 * le temps de lire la session. Évite un squelette générique sur la page de connexion.
 */
export function AuthFormSkeleton() {
  return (
    <LoadingRegion>
      <Skeleton height={42} radius="md" className={styles.tabs} />
      <div className={styles.oauth}>
        <Skeleton height={44} radius="md" />
        <Skeleton height={44} radius="md" />
      </div>
      <Skeleton width="30%" height={12} className={styles.or} />
      <div className={styles.field}>
        <Skeleton width="32%" height={12} className={styles.label} />
        <Skeleton height={44} radius="md" />
      </div>
      <div className={styles.field}>
        <Skeleton width="32%" height={12} className={styles.label} />
        <Skeleton height={44} radius="md" />
      </div>
      <Skeleton height={44} radius="md" className={styles.submit} />
    </LoadingRegion>
  );
}
