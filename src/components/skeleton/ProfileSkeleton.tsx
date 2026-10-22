import { LoadingRegion } from './LoadingRegion';
import { Skeleton } from './Skeleton';
import styles from './Skeletons.module.css';

/** Squelette du profil public : en-tête, chiffres, niveau et activité. */
export function ProfileSkeleton() {
  return (
    <LoadingRegion className={`${styles.panel} ${styles.padded}`}>
      <div className={styles.profileHead}>
        <Skeleton width={88} height={88} radius="full" />
        <div className={styles.stack}>
          <Skeleton width="45%" height={26} />
          <Skeleton width={110} height={12} />
          <Skeleton width="80%" height={13} />
          <Skeleton width="60%" height={13} />
          <div className={styles.row}>
            <Skeleton width={140} height={12} />
            <Skeleton width={150} height={12} />
          </div>
        </div>
      </div>
      <div className={styles.stats}>
        {[0, 1, 2, 3].map((i) => (
          <Skeleton key={i} height={62} radius="md" />
        ))}
      </div>
      <div className={`${styles.stack} ${styles.gapTop}`}>
        <Skeleton width={180} height={14} />
        <Skeleton height={4} />
      </div>
      <div className={`${styles.row} ${styles.gapTop}`}>
        <Skeleton width={80} height={20} />
        <Skeleton width={100} height={20} />
        <Skeleton width={70} height={20} />
      </div>
      <div className={`${styles.stack} ${styles.gapTop}`}>
        {['85%', '70%', '78%'].map((w) => (
          <Skeleton key={w} width={w} height={14} />
        ))}
      </div>
    </LoadingRegion>
  );
}
