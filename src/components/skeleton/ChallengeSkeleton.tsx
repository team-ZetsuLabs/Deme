import { LoadingRegion } from './LoadingRegion';
import { Skeleton } from './Skeleton';
import styles from './Skeletons.module.css';

const NAMES = [140, 120, 160, 110, 130];

/** Squelette de la page des défis : défi en cours, puis classement, comme la page. */
export function ChallengeSkeleton() {
  return (
    <LoadingRegion>
      <div className={`${styles.panel} ${styles.padded} ${styles.challenge}`}>
        <div className={styles.stack}>
          <Skeleton width="60%" height={24} />
          <Skeleton width={220} height={12} />
          <Skeleton height={14} />
          <Skeleton width="85%" height={14} />
          <Skeleton width="30%" height={14} />
          <div className={`${styles.stack} ${styles.gapTop}`}>
            {['72%', '64%', '70%', '66%'].map((w, i) => (
              <div key={i} className={styles.row}>
                <Skeleton width={44} height={14} />
                <Skeleton width={w} height={14} />
              </div>
            ))}
          </div>
        </div>
        <div className={styles.stack}>
          <Skeleton width={90} height={12} />
          <div className={styles.row}>
            <Skeleton width={68} height={74} radius="md" />
            <Skeleton width={68} height={74} radius="md" />
            <Skeleton width={68} height={74} radius="md" />
          </div>
          <Skeleton height={40} radius="md" />
          <Skeleton width={150} height={12} />
        </div>
      </div>

      <div className={styles.toolbar}>
        <Skeleton width={110} height={18} />
        <Skeleton width={150} height={40} radius="md" />
      </div>

      <div className={styles.panel}>
        <div className={styles.line}>
          <Skeleton width={260} height={12} />
          <Skeleton width={40} height={12} />
        </div>
        {NAMES.map((width, i) => (
          <div key={i} className={styles.line}>
            <div className={styles.row}>
              <Skeleton width={24} height={14} />
              <Skeleton width={32} height={32} radius="full" />
              <div className={styles.stack}>
                <Skeleton width={width} height={14} />
                <Skeleton width={70} height={11} />
              </div>
            </div>
            <Skeleton width={56} height={14} />
          </div>
        ))}
      </div>
    </LoadingRegion>
  );
}
