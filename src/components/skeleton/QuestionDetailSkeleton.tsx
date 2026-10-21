import { LoadingRegion } from './LoadingRegion';
import { Skeleton } from './Skeleton';
import styles from './Skeletons.module.css';

/** Squelette de la page d'une question : en-tête, corps, code, puis deux réponses. */
export function QuestionDetailSkeleton() {
  return (
    <LoadingRegion>
      <div className={styles.row}>
        <Skeleton width={48} height={12} />
        <Skeleton width={90} height={12} />
      </div>
      <div className={`${styles.panel} ${styles.padded} ${styles.gapTop}`}>
        <div className={styles.stack}>
          <Skeleton width="82%" height={26} />
          <Skeleton width="48%" height={26} />
          <div className={styles.row}>
            <Skeleton width={120} height={12} />
            <Skeleton width={70} height={12} />
            <Skeleton width={90} height={12} />
          </div>
          <div className={styles.row}>
            <Skeleton width={96} height={24} />
            <Skeleton width={112} height={24} />
            <Skeleton width={84} height={24} />
          </div>
        </div>
        <div className={styles.post}>
          <div className={styles.voteCol}>
            <Skeleton width={40} height={36} />
            <Skeleton width={22} height={16} />
          </div>
          <div className={styles.stack}>
            <Skeleton height={13} />
            <Skeleton height={13} />
            <Skeleton width="70%" height={13} />
            <Skeleton height={110} radius="md" />
          </div>
        </div>
      </div>
      <div className={`${styles.panel} ${styles.padded} ${styles.gapTop}`}>
        {[0, 1].map((i) => (
          <div key={i} className={styles.post}>
            <div className={styles.voteCol}>
              <Skeleton width={40} height={36} />
              <Skeleton width={22} height={16} />
            </div>
            <div className={styles.stack}>
              <Skeleton height={13} />
              <Skeleton width={i ? '62%' : '85%'} height={13} />
              <div className={styles.between}>
                <span />
                <Skeleton width={180} height={44} radius="md" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </LoadingRegion>
  );
}
