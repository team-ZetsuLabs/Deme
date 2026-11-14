import { LoadingRegion } from './LoadingRegion';
import { Skeleton } from './Skeleton';
import styles from './Skeletons.module.css';

/** Squelette de la page d'une question, dans l'ordre de la page : question, tri, réponses, formulaire. */
export function QuestionDetailSkeleton() {
  return (
    <LoadingRegion>
      <div className={styles.crumbs}>
        <Skeleton width={36} height={14} />
        <Skeleton width={96} height={14} />
        <Skeleton width={64} height={14} />
      </div>
      <div className={`${styles.panel} ${styles.padded}`}>
        <div className={styles.headRow}>
          <div className={styles.stack}>
            <Skeleton width="92%" height={26} />
            <Skeleton width="40%" height={26} />
          </div>
          <Skeleton width={172} height={40} radius="md" />
        </div>
        <div className={`${styles.row} ${styles.gapTop}`}>
          <Skeleton width={180} height={13} />
          <Skeleton width={80} height={13} />
        </div>
        <div className={`${styles.row} ${styles.gapTop}`}>
          <Skeleton width={84} height={26} />
          <Skeleton width={104} height={26} />
          <Skeleton width={88} height={26} />
        </div>
        <div className={styles.post}>
          <div className={styles.voteCol}>
            <Skeleton width={40} height={36} />
            <Skeleton width={22} height={16} />
          </div>
          <div className={styles.stack}>
            <Skeleton height={13} />
            <Skeleton width="60%" height={13} />
            <Skeleton height={112} radius="md" />
            <Skeleton width="45%" height={13} />
            <div className={styles.between}>
              <div className={styles.row}>
                <Skeleton width={110} height={26} />
                <Skeleton width={96} height={26} />
                <Skeleton width={76} height={26} />
              </div>
              <Skeleton width={230} height={52} radius="md" />
            </div>
          </div>
        </div>
      </div>

      <div className={styles.toolbar}>
        <Skeleton width={110} height={18} />
        <Skeleton width={270} height={38} radius="md" />
      </div>

      <div className={`${styles.panel} ${styles.padded}`}>
        {[0, 1].map((i) => (
          <div key={i} className={styles.post}>
            <div className={styles.voteCol}>
              <Skeleton width={40} height={36} />
              <Skeleton width={22} height={16} />
            </div>
            <div className={styles.stack}>
              <Skeleton width={130} height={13} />
              <Skeleton height={13} />
              <Skeleton width={i ? '62%' : '85%'} height={13} />
              <div className={styles.between}>
                <Skeleton width={150} height={30} radius="md" />
                <Skeleton width={230} height={52} radius="md" />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className={`${styles.panel} ${styles.padded} ${styles.gapTop}`}>
        <div className={styles.stack}>
          <Skeleton width={140} height={18} />
          <Skeleton height={140} radius="md" />
          <Skeleton width={160} height={40} radius="md" />
        </div>
      </div>
    </LoadingRegion>
  );
}
