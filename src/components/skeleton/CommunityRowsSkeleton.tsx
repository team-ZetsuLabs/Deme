import { LoadingRegion } from './LoadingRegion';
import { Skeleton } from './Skeleton';
import styles from './Skeletons.module.css';

const TITLES = ['40%', '55%', '35%', '48%'];

export type CommunityRowsSkeletonProps = { count?: number };

/** Squelette de la liste des communautés, mêmes colonnes que CommunityRow. */
export function CommunityRowsSkeleton({ count = 4 }: CommunityRowsSkeletonProps) {
  return (
    <LoadingRegion>
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className={styles.job}>
          <Skeleton width={44} height={44} radius="md" />
          <div className={styles.stack}>
            <Skeleton width={TITLES[i % TITLES.length]} height={16} />
            <Skeleton width={110} height={12} />
            <Skeleton width="90%" height={13} />
            <Skeleton width={180} height={12} />
          </div>
          <Skeleton width={88} height={32} radius="md" />
        </div>
      ))}
    </LoadingRegion>
  );
}
