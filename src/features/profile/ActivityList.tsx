import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import type { ActivityItem } from '../../api/provisional-types';
import { RelativeTime } from '../../components/RelativeTime';
import styles from './ActivityList.module.css';

export type ActivityListProps = { items: ActivityItem[] };

/** Activité récente, avec les points gagnés pour chaque action (REP-1). */
export function ActivityList({ items }: ActivityListProps) {
  const { t } = useTranslation();
  return (
    <ul className={styles.list}>
      {items.map((item, i) => (
        <li key={`${item.type}-${item.createdAt}-${i}`} className={styles.item}>
          <span className={styles.kind}>{t(`profile.activity.${item.type}`)}</span>
          <span className={styles.title}>
            {item.questionId ? (
              <Link to={`/questions/${item.questionId}`}>{item.title}</Link>
            ) : (
              item.title
            )}
            <small>
              <RelativeTime iso={item.createdAt} />
            </small>
          </span>
          <span className={styles.points}>
            {item.points > 0 ? `+${item.points}` : item.points || ''}
          </span>
        </li>
      ))}
    </ul>
  );
}
