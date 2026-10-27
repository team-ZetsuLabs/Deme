import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import type { AppNotification } from '../../api/types';
import { Avatar } from '../../components/Avatar';
import { Icon, type IconName } from '../../components/Icon';
import { RelativeTime } from '../../components/RelativeTime';
import { notificationLink } from './notificationsApi';
import styles from './NotificationItem.module.css';

const SYSTEM_ICONS: Partial<Record<AppNotification['type'], IconName>> = {
  JOB_MATCH: 'jobs',
  MISSION_MATCH: 'mission',
  CHALLENGE_STARTED: 'trophy',
  SUBMISSION_REVIEWED: 'trophy',
  APPLICATION_RECEIVED: 'jobs',
  APPLICATION_DECIDED: 'jobs',
  JOB_REVIEWED: 'jobs',
  PROJECT_REQUEST_DECIDED: 'user',
  COMMUNITY_PROPOSAL_DECISION: 'users',
  CONTENT_HIDDEN: 'flag',
  CONTENT_RESTORED: 'flag',
  ACCOUNT_WARNED: 'flag',
};

export type NotificationItemProps = {
  notification: AppNotification;
  onOpen: () => void;
};

export function NotificationItem({ notification: n, onOpen }: NotificationItemProps) {
  const { t } = useTranslation();
  const text = t(`notifications.types.${n.type}`, {
    // Vote anonyme : le contrat n'envoie pas d'auteur.
    actor: n.actor?.displayName ?? t('notifications.someone'),
    decision: n.outcome
      ? t(`notifications.decisions.${n.outcome}`, { defaultValue: n.outcome.toLowerCase() })
      : '',
  });

  return (
    <li className={n.read ? styles.item : `${styles.item} ${styles.unread}`}>
      {n.actor ? (
        <Avatar name={n.actor.displayName} photoUrl={n.actor.avatarUrl ?? null} size={36} />
      ) : (
        <span className={styles.system} aria-hidden="true">
          <Icon name={SYSTEM_ICONS[n.type] ?? 'bell'} size={18} />
        </span>
      )}
      <div className={styles.body}>
        <p>
          {text} :{' '}
          <Link to={notificationLink(n.target)} onClick={onOpen}>
            {n.target.title}
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
