import { LoadingRegion } from './LoadingRegion';
import { Skeleton } from './Skeleton';
import styles from './Skeletons.module.css';

const ROWS = ['34%', '28%', '40%', '30%'];

/** Squelette du profil public : en-tête, trois chiffres, niveau, onglets et activité. */
export function ProfileSkeleton() {
  return (
    <LoadingRegion className={`${styles.panel} ${styles.padded}`}>
      <div className={styles.profileHead}>
        <Skeleton width={88} height={88} radius="full" />
        <div className={styles.headRow}>
          <div className={styles.stack}>
            <Skeleton width="45%" height={26} />
            <Skeleton width={110} height={13} />
            <Skeleton width="70%" height={14} />
            <div className={styles.row}>
              <Skeleton width={110} height={13} />
              <Skeleton width={170} height={13} />
            </div>
          </div>
          <Skeleton width={96} height={32} radius="md" />
        </div>
      </div>
      <div className={styles.stats}>
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} height={80} radius="md" />
        ))}
      </div>
      <div className={`${styles.stack} ${styles.gapTop}`}>
        <Skeleton width={90} height={16} />
        <Skeleton height={4} />
      </div>
      <div className={`${styles.row} ${styles.gapTop}`}>
        <Skeleton width={70} height={20} />
        <Skeleton width={100} height={20} />
        <Skeleton width={60} height={20} />
      </div>
      <div className={styles.gapTop}>
        {ROWS.map((w, i) => (
          <div key={i} className={`${styles.between} ${styles.activityRow}`}>
            <div className={styles.row}>
              <Skeleton width={120} height={12} />
              <div className={styles.stack}>
                <Skeleton width={120} height={14} />
                <Skeleton width={w === '40%' ? 90 : 110} height={11} />
              </div>
            </div>
            <Skeleton width={28} height={13} />
          </div>
        ))}
      </div>
    </LoadingRegion>
  );
}
