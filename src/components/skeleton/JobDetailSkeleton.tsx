import { LoadingRegion } from './LoadingRegion';
import { Skeleton } from './Skeleton';
import styles from './Skeletons.module.css';

/** Squelette du détail d'une offre, avec la colonne « Postuler ». */
export function JobDetailSkeleton() {
  return (
    <LoadingRegion className={styles.split}>
      <div className={`${styles.panel} ${styles.padded}`}>
        <div className={styles.row}>
          <Skeleton width={56} height={56} radius="md" />
          <div className={styles.stack} style={{ flex: 1 }}>
            <Skeleton width="75%" height={24} />
            <Skeleton width={200} height={12} />
          </div>
        </div>
        <div className={`${styles.row} ${styles.gapTop}`}>
          <Skeleton width={120} height={24} />
          <Skeleton width={56} height={24} />
          <Skeleton width={170} height={24} />
        </div>
        <div className={`${styles.stack} ${styles.gapTop}`}>
          <Skeleton width={110} height={16} />
          <Skeleton height={13} />
          <Skeleton width="80%" height={13} />
          <Skeleton width={130} height={16} />
          <Skeleton width="90%" height={13} />
          <Skeleton width="65%" height={13} />
        </div>
      </div>
      <div className={`${styles.panel} ${styles.padded}`}>
        <div className={styles.stack}>
          <Skeleton width="70%" height={16} />
          <Skeleton height={12} />
          <Skeleton width="80%" height={12} />
          <Skeleton height={40} radius="md" />
        </div>
      </div>
    </LoadingRegion>
  );
}
