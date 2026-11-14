import { LoadingRegion } from './LoadingRegion';
import { Skeleton } from './Skeleton';
import styles from './Skeletons.module.css';

// Largeurs variées : un squelette trop régulier fait « faux ».
const TITLES = ['78%', '64%', '86%', '58%', '72%'];

export type QuestionRowsSkeletonProps = { count?: number };

/** Squelette du fil des questions, mêmes colonnes que QuestionRow. */
export function QuestionRowsSkeleton({ count = 5 }: QuestionRowsSkeletonProps) {
  return (
    <LoadingRegion>
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className={styles.question}>
          <div className={styles.statCol}>
            <Skeleton width={28} height={18} />
            <Skeleton width={36} height={10} />
          </div>
          <Skeleton width={64} height={46} radius="md" />
          <div className={styles.stack}>
            <Skeleton width={TITLES[i % TITLES.length]} height={16} />
            <Skeleton height={12} />
            <Skeleton width="55%" height={12} />
            <div className={styles.between}>
              <div className={styles.row}>
                <Skeleton width={84} height={24} />
                <Skeleton width={64} height={24} />
              </div>
              <div className={styles.row}>
                <Skeleton width={24} height={24} radius="full" />
                <Skeleton width={110} height={12} />
              </div>
            </div>
          </div>
        </div>
      ))}
    </LoadingRegion>
  );
}
