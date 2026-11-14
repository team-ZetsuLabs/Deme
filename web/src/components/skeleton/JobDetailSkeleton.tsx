import { LoadingRegion } from './LoadingRegion';
import { Skeleton } from './Skeleton';
import styles from './Skeletons.module.css';

/** Squelette du détail d'une offre : fil d'Ariane, offre complète, puis Postuler et Correspondance. */
export function JobDetailSkeleton() {
  return (
    <LoadingRegion className={styles.split}>
      <div className={`${styles.panel} ${styles.padded}`}>
        <div className={styles.crumbs}>
          <Skeleton width={50} height={13} />
          <Skeleton width={110} height={13} />
        </div>
        <div className={styles.row}>
          <Skeleton width={56} height={56} radius="md" />
          <div className={`${styles.stack} ${styles.fill}`}>
            <Skeleton width="80%" height={24} />
            <Skeleton width={230} height={13} />
          </div>
        </div>
        <div className={`${styles.row} ${styles.gapTop}`}>
          <Skeleton width={160} height={24} />
          <Skeleton width={44} height={24} />
          <Skeleton width={150} height={24} />
          <Skeleton width={140} height={24} />
        </div>
        {[
          ['92%', '70%'],
          ['78%', '66%', '74%'],
          ['60%', '72%', '58%'],
        ].map((lines, i) => (
          <div key={i} className={`${styles.stack} ${styles.gapTop}`}>
            <Skeleton width={120} height={16} />
            {lines.map((w, j) => (
              <Skeleton key={j} width={w} height={13} />
            ))}
          </div>
        ))}
        <div className={`${styles.stack} ${styles.gapTop}`}>
          <Skeleton width={110} height={16} />
          <div className={styles.row}>
            <Skeleton width={90} height={22} />
            <Skeleton width={50} height={22} />
            <Skeleton width={84} height={22} />
            <Skeleton width={60} height={22} />
          </div>
        </div>
      </div>
      <div className={styles.sideStack}>
        <div className={`${styles.panel} ${styles.padded}`}>
          <div className={styles.stack}>
            <Skeleton width="75%" height={16} />
            <Skeleton height={12} />
            <Skeleton width="85%" height={12} />
            <Skeleton height={40} radius="md" />
          </div>
        </div>
        <div className={`${styles.panel} ${styles.padded}`}>
          <div className={styles.stack}>
            <Skeleton width="70%" height={16} />
            <Skeleton height={12} />
            <Skeleton width="60%" height={12} />
          </div>
        </div>
      </div>
    </LoadingRegion>
  );
}
