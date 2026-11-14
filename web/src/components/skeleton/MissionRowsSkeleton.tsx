import { LoadingRegion } from './LoadingRegion';
import { Skeleton } from './Skeleton';
import styles from './Skeletons.module.css';

const TITLES = ['74%', '60%', '82%', '66%'];

export type MissionRowsSkeletonProps = { count?: number };

/** Squelette de la liste des missions, mêmes blocs que MissionRow. */
export function MissionRowsSkeleton({ count = 4 }: MissionRowsSkeletonProps) {
  return (
    <LoadingRegion>
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className={styles.line}>
          <div className={styles.stack} style={{ flex: 1 }}>
            <div className={styles.row}>
              <Skeleton width={92} height={24} />
              <Skeleton width={130} height={24} />
              <Skeleton width={70} height={24} />
            </div>
            <Skeleton width={TITLES[i % TITLES.length]} height={16} />
            <Skeleton height={12} />
            <Skeleton width="50%" height={12} />
            <div className={styles.between}>
              <div className={styles.row}>
                <Skeleton width={64} height={20} />
                <Skeleton width={80} height={20} />
              </div>
              <div className={styles.row}>
                <Skeleton width={24} height={24} radius="full" />
                <Skeleton width={110} height={12} />
              </div>
            </div>
          </div>
          <Skeleton width={84} height={14} />
        </div>
      ))}
    </LoadingRegion>
  );
}
