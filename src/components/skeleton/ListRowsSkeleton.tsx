import { LoadingRegion } from './LoadingRegion';
import { Skeleton } from './Skeleton';
import styles from './Skeletons.module.css';

const WIDTHS = ['60%', '72%', '50%', '66%'];

export type ListRowsSkeletonProps = { count?: number };

/** Squelette d'une liste simple : un titre, une ligne d'information et un statut. */
export function ListRowsSkeleton({ count = 4 }: ListRowsSkeletonProps) {
  return (
    <LoadingRegion>
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className={styles.line}>
          <div className={styles.stack} style={{ flex: 1 }}>
            <Skeleton width={50} height={10} />
            <Skeleton width={WIDTHS[i % WIDTHS.length]} height={15} />
            <Skeleton width={180} height={11} />
          </div>
          <Skeleton width={72} height={26} />
        </div>
      ))}
    </LoadingRegion>
  );
}
