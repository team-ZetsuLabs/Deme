import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { NavLink, Outlet } from 'react-router-dom'
import Button from '../components/Button'
import { useTheme } from '../hooks/useTheme'
import styles from './AdminLayout.module.css'

const NAV_ITEMS = [
  { to: '/reports', key: 'reports' },
  { to: '/jobs', key: 'jobs' },
  { to: '/users', key: 'users' },
  { to: '/tags', key: 'tags' },
  { to: '/challenges', key: 'challenges' },
  { to: '/referent', key: 'referent' },
]

export default function AdminLayout() {
  const { t, i18n } = useTranslation()
  const { theme, toggleTheme } = useTheme()
  const [menuOpen, setMenuOpen] = useState(false)
  const nextLanguage = i18n.language === 'fr' ? 'en' : 'fr'

  return (
    <div className={styles.shell}>
      <a href="#contenu" className={styles.skip}>
        {t('shell.skip')}
      </a>
      <aside className={styles.sidebar}>
        <div className={styles.top}>
          <p className={styles.brand}>
            <span className={styles.brandName}>Zetsu</span>
            <span className={styles.brandSub}>{t('shell.brandSub')}</span>
          </p>
          <Button
            variant="secondary"
            className={styles.menuButton}
            aria-expanded={menuOpen}
            aria-controls="navigation"
            onClick={() => setMenuOpen((open) => !open)}
          >
            {menuOpen ? t('shell.closeMenu') : t('shell.menu')}
          </Button>
        </div>
        <div id="navigation" className={`${styles.panel} ${menuOpen ? styles.panelOpen : ''}`}>
          <nav aria-label={t('shell.navLabel')}>
            <ul className={styles.nav}>
              {NAV_ITEMS.map((item) => (
                <li key={item.key}>
                  <NavLink
                    to={item.to}
                    className={({ isActive }) =>
                      `${styles.link} ${isActive ? styles.linkActive : ''}`
                    }
                    onClick={() => setMenuOpen(false)}
                  >
                    {t(`nav.${item.key}`)}
                  </NavLink>
                </li>
              ))}
            </ul>
          </nav>
          <div className={styles.tools}>
            <Button variant="ghost" onClick={toggleTheme}>
              {theme === 'light' ? t('shell.themeDark') : t('shell.themeLight')}
            </Button>
            <Button
              variant="ghost"
              lang={nextLanguage}
              aria-label={t('shell.switchLanguage')}
              onClick={() => i18n.changeLanguage(nextLanguage)}
            >
              {nextLanguage.toUpperCase()}
            </Button>
            <NavLink to="/login" className={styles.logout}>
              {t('shell.logout')}
            </NavLink>
          </div>
        </div>
      </aside>
      <main id="contenu" className={styles.main}>
        <Outlet />
      </main>
    </div>
  )
}
