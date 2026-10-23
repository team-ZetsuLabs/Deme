import { LoadingRegion } from './LoadingRegion';
import { Skeleton } from './Skeleton';
import styles from './Skeletons.module.css';

/** Squelette de la page d'une communauté : en-tête, onglets, premières questions. */
export function CommunitySkeleton() {
  return (
    <LoadingRegion className={`${styles.panel} ${styles.padded}`}>
      <div className={styles.row}>
        <Skeleton width={64} height={64} radius="md" />
        <div className={styles.stack}>
          <Skeleton width={220} height={24} />
          <Skeleton width={120} height={12} />
        </div>
      </div>
      <div className={`${styles.stack} ${styles.gapTop}`}>
        <Skeleton width="85%" height={13} />
        <Skeleton width="60%" height={13} />
        <Skeleton width={200} height={12} />
      </div>
      <div className={`${styles.row} ${styles.gapTop}`}>
        <Skeleton width={90} height={32} />
        <Skeleton width={90} height={32} />
        <Skeleton width={90} height={32} />
      </div>
      <div className={`${styles.stack} ${styles.gapTop}`}>
        <Skeleton width="70%" height={16} />
        <Skeleton width="90%" height={13} />
        <Skeleton width="55%" height={16} />
        <Skeleton width="80%" height={13} />
      </div>
    </LoadingRegion>
  );
}
