import { LoadingRegion } from './LoadingRegion';
import { Skeleton } from './Skeleton';
import styles from './Skeletons.module.css';

/** Squelette du détail d'un projet : fil d'Ariane, description, puis rôles et équipe à côté. */
export function ProjectDetailSkeleton() {
  return (
    <LoadingRegion className={styles.split}>
      <div className={`${styles.panel} ${styles.padded}`}>
        <div className={styles.crumbs}>
          <Skeleton width={60} height={13} />
          <Skeleton width={120} height={13} />
        </div>
        <div className={styles.row}>
          <Skeleton width={56} height={56} radius="md" />
          <div className={`${styles.stack} ${styles.fill}`}>
            <Skeleton width="78%" height={24} />
            <Skeleton width={210} height={13} />
          </div>
        </div>
        <div className={`${styles.row} ${styles.gapTop}`}>
          <Skeleton width={90} height={24} />
          <Skeleton width={70} height={24} />
          <Skeleton width={110} height={24} />
        </div>
        {[
          ['92%', '70%'],
          ['78%', '66%', '74%'],
        ].map((lines, i) => (
          <div key={i} className={`${styles.stack} ${styles.gapTop}`}>
            {lines.map((w, j) => (
              <Skeleton key={j} width={w} height={13} />
            ))}
          </div>
        ))}
      </div>
      <div className={styles.sideStack}>
        <div className={`${styles.panel} ${styles.padded}`}>
          <div className={styles.stack}>
            <Skeleton width="60%" height={16} />
            <Skeleton height={40} radius="md" />
            <Skeleton height={40} radius="md" />
          </div>
        </div>
        <div className={`${styles.panel} ${styles.padded}`}>
          <div className={styles.stack}>
            <Skeleton width="50%" height={16} />
            <Skeleton width="80%" height={13} />
            <Skeleton width="70%" height={13} />
          </div>
        </div>
      </div>
    </LoadingRegion>
  );
}
