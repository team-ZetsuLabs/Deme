import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { buttonClass } from '../components/buttonClass';
import { Icon } from '../components/Icon';
import { useUnread } from '../features/notifications/useUnread';
import styles from './NotificationBell.module.css';

/** Cloche de la barre du haut, avec le nombre de notifications non lues (NOT-1). */
export function NotificationBell() {
  const { t } = useTranslation();
  const { count } = useUnread();
  return (
    <Link
      to="/notifications"
      className={buttonClass({ variant: 'ghost', iconOnly: true })}
      aria-label={t('notifications.bellLabel', { count })}
    >
      <Icon name="bell" size={18} />
      {count > 0 && (
        <span className={styles.badge} aria-hidden="true">
          {count > 99 ? '99+' : count}
        </span>
      )}
    </Link>
  );
}
