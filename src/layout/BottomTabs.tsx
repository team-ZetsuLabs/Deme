import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Icon } from '../components/Icon';
import { useSession } from '../features/auth/useSession';
import { ACCOUNT_ITEM, ACCOUNT_ITEM_SIGNED_IN, isSpaceActive, NAV_ITEMS } from './navItems';
import styles from './BottomTabs.module.css';

/** Barre d'onglets en bas de l'écran, sous 768 px. */
export function BottomTabs() {
  const { t } = useTranslation();
  const { user } = useSession();
  const { pathname } = useLocation();
  const account = user
    ? { ...ACCOUNT_ITEM_SIGNED_IN, to: `/users/${user.username}` }
    : ACCOUNT_ITEM;

  return (
    <nav className={styles.tabs} aria-label={t('nav.label')}>
      {[...NAV_ITEMS, account].map((item) => (
        <Link
          key={item.labelKey}
          to={item.to}
          className={styles.tab}
          aria-current={isSpaceActive(item, pathname) ? 'page' : undefined}
          aria-label={item.shortLabelKey ? t(item.labelKey) : undefined}
        >
          <Icon name={item.icon} size={20} />
          <span>{t(item.shortLabelKey ?? item.labelKey)}</span>
        </Link>
      ))}
    </nav>
  );
}
