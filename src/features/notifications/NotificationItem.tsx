import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import type { AppNotification } from '../../api/provisional-types';
import { Avatar } from '../../components/Avatar';
import { Icon, type IconName } from '../../components/Icon';
import { RelativeTime } from '../../components/RelativeTime';
import { notificationLink } from './notificationsApi';
import styles from './NotificationItem.module.css';

const SYSTEM_ICONS: Partial<Record<AppNotification['type'], IconName>> = {
  JOB_MATCH: 'jobs',
  MISSION_MATCH: 'mission',
  NEW_CHALLENGE: 'trophy',
  APPLICATION_DECISION: 'jobs',
  PROJECT_REQUEST_DECISION: 'user',
};

export type NotificationItemProps = {
  notification: AppNotification;
  onOpen: () => void;
};

export function NotificationItem({ notification: n, onOpen }: NotificationItemProps) {
  const { t } = useTranslation();
  const text = t(`notifications.types.${n.type}`, {
    actor: n.actor?.name ?? '',
    decision: n.decision ? t(`notifications.decisions.${n.decision}`) : '',
  });

  return (
    <li className={n.read ? styles.item : `${styles.item} ${styles.unread}`}>
      {n.actor ? (
        <Avatar name={n.actor.name} photoUrl={n.actor.photoUrl} size={36} />
      ) : (
        <span className={styles.system} aria-hidden="true">
          <Icon name={SYSTEM_ICONS[n.type] ?? 'bell'} size={18} />
        </span>
      )}
      <div className={styles.body}>
        <p>
          {text} :{' '}
          <Link to={notificationLink(n.targetType, n.targetId)} onClick={onOpen}>
            {n.targetTitle}
          </Link>
        </p>
        <small>
          <RelativeTime iso={n.createdAt} />
        </small>
      </div>
      {!n.read && (
        <span className={styles.dot}>
          <span className="sr-only">{t('notifications.unread')}</span>
        </span>
      )}
    </li>
  );
}
