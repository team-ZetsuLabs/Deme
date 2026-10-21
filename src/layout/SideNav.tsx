import { NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Icon } from '../components/Icon';
import { useSession } from '../features/auth/useSession';
import { useUnread } from '../features/notifications/useUnread';
import { ACCOUNT_LINKS, NAV_ITEMS, type NavItem } from './navItems';
import styles from './SideNav.module.css';

/** Menu latéral, affiché à partir de 768 px. */
export function SideNav() {
  const { t } = useTranslation();
  const { user } = useSession();
  const { count } = useUnread();

  const link = (item: NavItem) => (
    <NavLink
      key={item.to}
      // /users/me redirige vers /users/:id : on pointe directement vers le bon profil.
      to={item.to === '/users/me' && user ? `/users/${user.id}` : item.to}
      className={styles.space}
    >
      <Icon name={item.icon} size={18} />
      {t(item.labelKey)}
      {item.to === '/notifications' && count > 0 && (
        <span className={styles.count}>
          {count}
          <span className="sr-only"> {t('notifications.unreadShort')}</span>
        </span>
      )}
    </NavLink>
  );

  return (
    <nav className={styles.rail} aria-label={t('nav.label')}>
      <p className={styles.label}>{t('nav.spaces')}</p>
      {NAV_ITEMS.map(link)}
      {user && (
        <>
          <p className={`${styles.label} ${styles.labelSpaced}`}>{t('nav.myAccount')}</p>
          {ACCOUNT_LINKS.map(link)}
        </>
      )}
    </nav>
  );
}
