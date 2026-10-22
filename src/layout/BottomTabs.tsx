import { NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Icon } from '../components/Icon';
import { useSession } from '../features/auth/useSession';
import { ACCOUNT_ITEM, ACCOUNT_ITEM_SIGNED_IN, NAV_ITEMS } from './navItems';
import styles from './BottomTabs.module.css';

/** Barre d'onglets en bas de l'écran, sous 768 px. */
export function BottomTabs() {
  const { t } = useTranslation();
  const { user } = useSession();
  const account = user ? { ...ACCOUNT_ITEM_SIGNED_IN, to: `/users/${user.id}` } : ACCOUNT_ITEM;

  return (
    <nav className={styles.tabs} aria-label={t('nav.label')}>
      {[...NAV_ITEMS, account].map((item) => (
        <NavLink key={item.labelKey} to={item.to} className={styles.tab}>
          <Icon name={item.icon} size={20} />
          <span>{t(item.labelKey)}</span>
        </NavLink>
      ))}
    </nav>
  );
}
