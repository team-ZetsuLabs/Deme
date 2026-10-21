import { LoadingRegion } from './LoadingRegion';
import { Skeleton } from './Skeleton';
import styles from './Skeletons.module.css';

/** Squelette du défi en cours : énoncé, spécifications et compte à rebours. */
export function ChallengeSkeleton() {
  return (
    <LoadingRegion className={`${styles.panel} ${styles.padded} ${styles.challenge}`}>
      <div className={styles.stack}>
        <Skeleton width="70%" height={24} />
        <Skeleton width={180} height={12} />
        <Skeleton height={13} />
        <Skeleton width="75%" height={13} />
        <div className={`${styles.stack} ${styles.gapTop}`}>
          {['82%', '68%', '74%'].map((w) => (
            <div key={w} className={styles.row}>
              <Skeleton width={44} height={14} />
              <Skeleton width={w} height={14} />
            </div>
          ))}
        </div>
      </div>
      <div className={styles.stack}>
        <Skeleton width={90} height={12} />
        <div className={styles.row}>
          <Skeleton width={68} height={58} radius="md" />
          <Skeleton width={68} height={58} radius="md" />
          <Skeleton width={68} height={58} radius="md" />
        </div>
        <Skeleton height={40} radius="md" />
      </div>
    </LoadingRegion>
  );
}
