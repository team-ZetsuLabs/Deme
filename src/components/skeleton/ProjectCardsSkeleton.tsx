import { LoadingRegion } from './LoadingRegion';
import { Skeleton } from './Skeleton';
import styles from './Skeletons.module.css';

const TITLES = ['68%', '80%', '56%', '74%'];

export type ProjectCardsSkeletonProps = { count?: number };

/** Squelette de la liste des projets, mêmes colonnes que ProjectCard. */
export function ProjectCardsSkeleton({ count = 4 }: ProjectCardsSkeletonProps) {
  return (
    <LoadingRegion>
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className={styles.job}>
          <Skeleton width={44} height={44} radius="md" />
          <div className={styles.stack}>
            <Skeleton width={TITLES[i % TITLES.length]} height={16} />
            <Skeleton width={150} height={12} />
            <div className={styles.row}>
              <Skeleton width={80} height={24} />
              <Skeleton width={70} height={20} />
              <Skeleton width={90} height={20} />
            </div>
            <div className={styles.row}>
              <Skeleton width={64} height={20} />
              <Skeleton width={80} height={20} />
              <Skeleton width={56} height={20} />
            </div>
          </div>
          <Skeleton width={72} height={26} radius="md" />
        </div>
      ))}
    </LoadingRegion>
  );
}
