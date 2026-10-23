import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ErrorState } from '../../components/ErrorState';
import { RelativeTime } from '../../components/RelativeTime';
import { LoadingRegion } from '../../components/skeleton/LoadingRegion';
import { Skeleton } from '../../components/skeleton/Skeleton';
import { useApiQuery } from '../../hooks/useApiQuery';
import { usersApi } from './usersApi';
import styles from './ActivityList.module.css';

export type ActivityListProps = {
  username: string;
  /** Message et action quand l'historique est vide. */
  empty: ReactNode;
};

/** Historique de réputation du membre (REP-1), avec les points de chaque action. */
export function ActivityList({ username, empty }: ActivityListProps) {
  const { t } = useTranslation();
  const query = useApiQuery(() => usersApi.reputation(username), [username]);

  if (query.loading) {
    return (
      <LoadingRegion>
        <div className={styles.list}>
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className={styles.item}>
              <Skeleton width={110} height={12} />
              <Skeleton width="60%" height={14} />
              <Skeleton width={28} height={14} />
            </div>
          ))}
        </div>
      </LoadingRegion>
    );
  }
  if (query.error) return <ErrorState error={query.error} onRetry={query.reload} />;
  if (!query.data?.items.length) return <>{empty}</>;

  return (
    <ul className={styles.list}>
      {query.data.items.map((item, i) => (
        <li key={`${item.reason}-${item.createdAt}-${i}`} className={styles.item}>
          <span className={styles.kind}>{t(`profile.reputation.${item.reason}`)}</span>
          <span className={styles.title}>
            {item.questionId ? (
              <Link
                to={`/questions/${item.questionId}${item.answerId ? `#answer-${item.answerId}` : ''}`}
              >
                {t(
                  item.answerId ? 'profile.reputation.seeAnswer' : 'profile.reputation.seeQuestion',
                )}
              </Link>
            ) : (
              t('profile.reputation.noLink')
            )}
            <small>
              <RelativeTime iso={item.createdAt} />
            </small>
          </span>
          <span className={item.delta < 0 ? `${styles.points} ${styles.minus}` : styles.points}>
            {item.delta > 0 ? `+${item.delta}` : item.delta}
          </span>
        </li>
      ))}
    </ul>
  );
}
