import { LoadingRegion } from './LoadingRegion';
import { Skeleton } from './Skeleton';
import styles from './Skeletons.module.css';

/** Squelette du détail d'une mission : fil d'Ariane, mission complète, budget et « Se proposer ». */
export function MissionDetailSkeleton() {
  return (
    <LoadingRegion className={styles.split}>
      <div className={`${styles.panel} ${styles.padded}`}>
        <div className={styles.crumbs}>
          <Skeleton width={60} height={13} />
          <Skeleton width={80} height={13} />
        </div>
        <div className={styles.row}>
          <Skeleton width={84} height={24} />
          <Skeleton width={130} height={24} />
          <Skeleton width={70} height={24} />
        </div>
        <div className={`${styles.stack} ${styles.gapTop}`}>
          <Skeleton width="70%" height={24} />
          <div className={styles.row}>
            <Skeleton width={24} height={24} radius="full" />
            <Skeleton width={170} height={12} />
          </div>
        </div>
        <div className={`${styles.stack} ${styles.gapTop}`}>
          <Skeleton height={13} />
          <Skeleton width="70%" height={13} />
          <Skeleton width={130} height={16} />
          <Skeleton width="55%" height={13} />
          <Skeleton width="60%" height={13} />
          <Skeleton width="62%" height={13} />
          <Skeleton width="58%" height={13} />
        </div>
        <div className={`${styles.stack} ${styles.gapTop}`}>
          <Skeleton width={110} height={16} />
          <div className={styles.row}>
            <Skeleton width={80} height={22} />
            <Skeleton width={40} height={22} />
            <Skeleton width={100} height={22} />
          </div>
        </div>
      </div>
      <div className={styles.sideStack}>
        <div className={`${styles.panel} ${styles.padded}`}>
          <div className={styles.stack}>
            <Skeleton width="50%" height={12} />
            <Skeleton width="65%" height={22} />
            <Skeleton width="55%" height={12} />
            <Skeleton height={40} radius="md" />
          </div>
        </div>
        <div className={styles.stack}>
          <Skeleton width="90%" height={11} />
          <Skeleton width="80%" height={11} />
          <Skeleton width="50%" height={11} />
        </div>
      </div>
    </LoadingRegion>
  );
}
