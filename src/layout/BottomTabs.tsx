import { useEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Icon } from '../components/Icon';
import { useSession } from '../features/auth/useSession';
import {
  ACCOUNT_ITEM,
  ACCOUNT_ITEM_SIGNED_IN,
  isSpaceActive,
  MORE_NAV_ITEMS,
  PRIMARY_NAV_ITEMS,
} from './navItems';
import styles from './BottomTabs.module.css';

/** Barre d'onglets en bas de l'écran, sous 768 px : espaces mis en avant + « Plus ». */
export function BottomTabs() {
  const { t } = useTranslation();
  const { user } = useSession();
  const { pathname } = useLocation();
  const [moreOpen, setMoreOpen] = useState(false);
  const moreRef = useRef<HTMLDivElement>(null);
  const account = user
    ? { ...ACCOUNT_ITEM_SIGNED_IN, to: `/users/${user.username}` }
    : ACCOUNT_ITEM;
  const moreActive = MORE_NAV_ITEMS.some((item) => isSpaceActive(item, pathname));

  // On ferme le panneau au changement de page.
  useEffect(() => setMoreOpen(false), [pathname]);

  // On ferme au clic en dehors et sur Échap.
  useEffect(() => {
    if (!moreOpen) return;
    const onDown = (e: PointerEvent) => {
      if (moreRef.current && !moreRef.current.contains(e.target as Node)) setMoreOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMoreOpen(false);
    };
    document.addEventListener('pointerdown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [moreOpen]);

  return (
    <nav className={styles.tabs} aria-label={t('nav.label')}>
      {PRIMARY_NAV_ITEMS.map((item) => (
        <Link
          key={item.labelKey}
          to={item.to}
          className={styles.tab}
          aria-current={isSpaceActive(item, pathname) ? 'page' : undefined}
        >
          <Icon name={item.icon} size={20} />
          <span>{t(item.shortLabelKey ?? item.labelKey)}</span>
        </Link>
      ))}

      <div className={styles.more} ref={moreRef}>
        {moreOpen && (
          <div className={styles.sheet} id="more-nav" aria-label={t('nav.more')}>
            {MORE_NAV_ITEMS.map((item) => (
              <Link
                key={item.labelKey}
                to={item.to}
                className={styles.sheetItem}
                aria-current={isSpaceActive(item, pathname) ? 'page' : undefined}
              >
                <Icon name={item.icon} size={18} />
                {t(item.labelKey)}
              </Link>
            ))}
          </div>
        )}
        <button
          type="button"
          className={styles.tab}
          aria-controls="more-nav"
          aria-expanded={moreOpen}
          aria-current={moreActive ? 'page' : undefined}
          onClick={() => setMoreOpen((o) => !o)}
        >
          <Icon name="more" size={20} />
          <span>{t('nav.more')}</span>
        </button>
      </div>

      <Link
        to={account.to}
        className={styles.tab}
        aria-current={isSpaceActive(account, pathname) ? 'page' : undefined}
      >
        <Icon name={account.icon} size={20} />
        <span>{t(account.shortLabelKey ?? account.labelKey)}</span>
      </Link>
    </nav>
  );
}
