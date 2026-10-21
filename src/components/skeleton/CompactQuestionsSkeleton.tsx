import { LoadingRegion } from './LoadingRegion';
import { Skeleton } from './Skeleton';
import styles from './Skeletons.module.css';

/** Squelette de l'aperçu « résolu récemment » de la page d'accueil. */
export function CompactQuestionsSkeleton() {
  return (
    <LoadingRegion>
      {['88%', '74%', '82%'].map((w) => (
        <div key={w} className={styles.compact}>
          <Skeleton width={32} height={32} radius="full" />
          <div className={styles.stack}>
            <Skeleton width={w} height={15} />
            <div className={styles.row}>
              <Skeleton width={90} height={22} />
              <Skeleton width={110} height={22} />
            </div>
            <Skeleton width={150} height={11} />
          </div>
        </div>
      ))}
    </LoadingRegion>
  );
}
