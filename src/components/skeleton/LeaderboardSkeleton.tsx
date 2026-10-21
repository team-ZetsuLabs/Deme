import { LoadingRegion } from './LoadingRegion';
import { Skeleton } from './Skeleton';
import styles from './Skeletons.module.css';

const NAMES = [140, 120, 160, 110, 130];

/** Squelette du classement d'un défi. */
export function LeaderboardSkeleton() {
  return (
    <LoadingRegion>
      {NAMES.map((width, i) => (
        <div key={i} className={styles.line}>
          <div className={styles.row}>
            <Skeleton width={24} height={14} />
            <Skeleton width={32} height={32} radius="full" />
            <div className={styles.stack}>
              <Skeleton width={width} height={14} />
              <Skeleton width={80} height={11} />
            </div>
          </div>
          <Skeleton width={44} height={14} />
        </div>
      ))}
    </LoadingRegion>
  );
}
