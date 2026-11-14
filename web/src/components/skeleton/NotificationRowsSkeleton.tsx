import { LoadingRegion } from './LoadingRegion';
import { Skeleton } from './Skeleton';
import styles from './Skeletons.module.css';

const WIDTHS = ['82%', '68%', '90%', '60%', '75%'];

export type NotificationRowsSkeletonProps = { count?: number };

/** Squelette de la liste des notifications. */
export function NotificationRowsSkeleton({ count = 5 }: NotificationRowsSkeletonProps) {
  return (
    <LoadingRegion>
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className={styles.notif}>
          <Skeleton width={36} height={36} radius="full" />
          <div className={styles.stack}>
            <Skeleton width={WIDTHS[i % WIDTHS.length]} height={14} />
            <Skeleton width={80} height={11} />
          </div>
        </div>
      ))}
    </LoadingRegion>
  );
}
