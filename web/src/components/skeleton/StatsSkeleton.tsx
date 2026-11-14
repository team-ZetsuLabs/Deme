import { LoadingRegion } from './LoadingRegion';
import { Skeleton } from './Skeleton';
import styles from './Skeletons.module.css';

/** Squelette de la bande de chiffres de l'accueil. */
export function StatsSkeleton() {
  return (
    <LoadingRegion className={styles.stats}>
      {[0, 1, 2, 3].map((i) => (
        <div key={i} className={styles.stack}>
          <Skeleton width={90} height={28} />
          <Skeleton width={120} height={12} />
        </div>
      ))}
    </LoadingRegion>
  );
}
