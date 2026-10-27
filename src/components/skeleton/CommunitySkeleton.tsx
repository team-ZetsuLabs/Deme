import { LoadingRegion } from './LoadingRegion';
import { Skeleton } from './Skeleton';
import styles from './Skeletons.module.css';

/** Squelette de la page d'une communauté : fil d'Ariane, en-tête et boutons, onglets, questions. */
export function CommunitySkeleton() {
  return (
    <LoadingRegion>
      <div className={styles.crumbs}>
        <Skeleton width={90} height={14} />
        <Skeleton width={70} height={14} />
      </div>
      <div className={styles.panel}>
        <div className={styles.padded}>
          <div className={styles.headRow}>
            <div className={styles.row}>
              <Skeleton width={64} height={64} radius="md" />
              <div className={`${styles.stack} ${styles.fill}`}>
                <Skeleton width={200} height={26} />
                <Skeleton width={130} height={12} />
                <Skeleton width="90%" height={14} />
                <Skeleton width="60%" height={14} />
                <Skeleton width={190} height={12} />
              </div>
            </div>
            <div className={styles.stack}>
              <Skeleton width={170} height={32} radius="md" />
              <Skeleton width={170} height={32} radius="md" />
            </div>
          </div>
          <div className={`${styles.row} ${styles.gapTop}`}>
            <Skeleton width={84} height={20} />
            <Skeleton width={74} height={20} />
            <Skeleton width={60} height={20} />
          </div>
        </div>
        {[0, 1, 2].map((i) => (
          <div key={i} className={styles.question}>
            <div className={styles.statCol}>
              <Skeleton width={22} height={18} />
              <Skeleton width={34} height={10} />
            </div>
            <Skeleton width={64} height={62} radius="md" />
            <div className={styles.stack}>
              <Skeleton width={['72%', '58%', '66%'][i]} height={16} />
              <Skeleton height={12} />
              <Skeleton width="80%" height={12} />
              <div className={styles.between}>
                <div className={styles.row}>
                  <Skeleton width={90} height={24} />
                  <Skeleton width={80} height={24} />
                </div>
                <Skeleton width={150} height={20} />
              </div>
            </div>
          </div>
        ))}
      </div>
    </LoadingRegion>
  );
}
