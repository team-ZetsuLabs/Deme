import { LoadingRegion } from './LoadingRegion';
import { Skeleton } from './Skeleton';
import styles from './Skeletons.module.css';

const TITLES = ['70%', '52%', '64%', '80%'];

export type JobRowsSkeletonProps = { count?: number };

/** Squelette de la liste des offres, mêmes colonnes que JobRow. */
export function JobRowsSkeleton({ count = 4 }: JobRowsSkeletonProps) {
  return (
    <LoadingRegion>
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className={styles.job}>
          <Skeleton width={44} height={44} radius="md" />
          <div className={styles.stack}>
            <Skeleton width={TITLES[i % TITLES.length]} height={16} />
            <Skeleton width={160} height={12} />
            <div className={styles.row}>
              <Skeleton width={120} height={14} />
              <Skeleton width={48} height={24} />
              <Skeleton width={150} height={24} />
            </div>
            <div className={styles.row}>
              <Skeleton width={78} height={20} />
              <Skeleton width={56} height={20} />
              <Skeleton width={84} height={20} />
            </div>
          </div>
          <Skeleton width={96} height={32} radius="md" />
        </div>
      ))}
    </LoadingRegion>
  );
}
