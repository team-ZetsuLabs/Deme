import { NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Icon } from '../components/Icon';
import { ACCOUNT_ITEM, NAV_ITEMS } from './navItems';
import styles from './BottomTabs.module.css';

/** Barre d'onglets en bas de l'écran, sous 768 px. */
export function BottomTabs() {
  const { t } = useTranslation();
  return (
    <nav className={styles.tabs} aria-label={t('nav.label')}>
      {[...NAV_ITEMS, ACCOUNT_ITEM].map((item) => (
        <NavLink key={item.to} to={item.to} className={styles.tab}>
          <Icon name={item.icon} size={20} />
          <span>{t(item.labelKey)}</span>
        </NavLink>
      ))}
    </nav>
  );
}
