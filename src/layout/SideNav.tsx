import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Icon } from '../components/Icon';
import { isSpaceActive, NAV_ITEMS } from './navItems';
import styles from './SideNav.module.css';

/**
 * Menu latéral, affiché à partir de 768 px : les espaces seulement. Le compte est dans le
 * menu du membre (barre du haut), les notifications sous la cloche.
 */
export function SideNav() {
  const { t } = useTranslation();
  const { pathname } = useLocation();

  return (
    <nav aria-label={t('nav.label')}>
      <p className={styles.label}>{t('nav.spaces')}</p>
      {NAV_ITEMS.map((item) => {
        const active = isSpaceActive(item, pathname);
        return (
          <Link
            key={item.to}
            to={item.to}
            className={styles.space}
            aria-current={active ? 'page' : undefined}
          >
            <Icon name={item.icon} size={18} />
            {t(item.labelKey)}
          </Link>
        );
      })}
    </nav>
  );
}
