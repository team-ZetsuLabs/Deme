import { LoadingRegion } from './LoadingRegion';
import { Skeleton } from './Skeleton';
import styles from './Skeletons.module.css';

/** Squelette du détail d'une mission, avec la colonne budget et « Se proposer ». */
export function MissionDetailSkeleton() {
  return (
    <LoadingRegion className={styles.split}>
      <div className={`${styles.panel} ${styles.padded}`}>
        <div className={styles.row}>
          <Skeleton width={96} height={24} />
          <Skeleton width={140} height={24} />
          <Skeleton width={72} height={24} />
        </div>
        <div className={`${styles.stack} ${styles.gapTop}`}>
          <Skeleton width="80%" height={24} />
          <Skeleton width="45%" height={24} />
          <div className={styles.row}>
            <Skeleton width={28} height={28} radius="full" />
            <Skeleton width={160} height={12} />
          </div>
        </div>
        <div className={`${styles.stack} ${styles.gapTop}`}>
          <Skeleton height={13} />
          <Skeleton width="88%" height={13} />
          <Skeleton width="72%" height={13} />
          <Skeleton width="60%" height={13} />
        </div>
        <div className={`${styles.row} ${styles.gapTop}`}>
          <Skeleton width={70} height={22} />
          <Skeleton width={90} height={22} />
        </div>
      </div>
      <div className={`${styles.panel} ${styles.padded}`}>
        <div className={styles.stack}>
          <Skeleton width="55%" height={12} />
          <Skeleton width="70%" height={22} />
          <Skeleton width="40%" height={12} />
          <Skeleton height={40} radius="md" />
        </div>
      </div>
    </LoadingRegion>
  );
}
