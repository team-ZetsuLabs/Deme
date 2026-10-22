import { NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Icon } from '../components/Icon';
import { NAV_ITEMS } from './navItems';
import styles from './SideNav.module.css';

/** Menu latéral, affiché à partir de 768 px. */
export function SideNav() {
  const { t } = useTranslation();
  return (
    <nav className={styles.rail} aria-label={t('nav.label')}>
      <p className={styles.label}>{t('nav.spaces')}</p>
      {NAV_ITEMS.map((item) => (
        <NavLink key={item.to} to={item.to} className={styles.space}>
          <Icon name={item.icon} size={18} />
          {t(item.labelKey)}
        </NavLink>
      ))}
    </nav>
  );
}
