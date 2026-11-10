import { useCallback, useEffect, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, NavLink, Navigate, Outlet, useLocation, useNavigate } from 'react-router-dom'
import Avatar from '../components/Avatar'
import Button, { ExternalButtonLink } from '../components/Button'
import Icon from '../components/Icon'
import type { IconName } from '../components/Icon'
import Logo from '../components/Logo'
import { LanguageSwitch, ThemeToggle } from '../components/Preferences'
import StateMessage from '../components/StateMessage'
import { useCounts } from './counts'
import { useAuth } from '../hooks/useAuth'
import { CrumbsContext } from './crumbs'
import type { Crumb } from './crumbs'
import styles from './AdminLayout.module.css'
import utils from '../styles/utils.module.css'

type NavItem = {
  to: string
  key: string
  icon: IconName
  count?: 'reports' | 'jobs' | 'proposals'
  referent?: boolean
}

const NAV: { group: string; items: NavItem[] }[] = [
  { group: 'pilotage', items: [{ to: '/tableau-de-bord', key: 'dashboard', icon: 'home' }] },
  {
    group: 'moderation',
    items: [
      { to: '/signalements', key: 'reports', icon: 'flag', count: 'reports' },
      { to: '/referent', key: 'referent', icon: 'shield', referent: true },
      { to: '/tags', key: 'tags', icon: 'tag' },
    ],
  },
  {
    group: 'community',
    items: [
      { to: '/utilisateurs', key: 'users', icon: 'users' },
      { to: '/offres', key: 'jobs', icon: 'jobs', count: 'jobs' },
      { to: '/challenges', key: 'challenges', icon: 'trophy' },
      { to: '/communautes', key: 'communities', icon: 'globe', count: 'proposals' },
    ],
  },
]

export default function AdminLayout() {
  const { t } = useTranslation()
  const { status, me, access, signOut } = useAuth()
  const counts = useCounts()
  const location = useLocation()
  const navigate = useNavigate()
  const [openAt, setOpenAt] = useState<string | null>(null)
  const navOpen = openAt === location.pathname
  const setNavOpen = useCallback(
    (open: boolean) => setOpenAt(open ? location.pathname : null),
    [location.pathname],
  )
  const [crumbs, setCrumbsState] = useState<Crumb[]>([])
  const searchRef = useRef<HTMLInputElement>(null)

  const setCrumbs = useCallback((next: Crumb[]) => setCrumbsState(next), [])

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') setNavOpen(false)
      const target = event.target as HTMLElement
      const typing = /INPUT|TEXTAREA|SELECT/.test(target.tagName)
      if (event.key === '/' && !typing && !document.querySelector('dialog[open]')) {
        event.preventDefault()
        searchRef.current?.focus()
      }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [setNavOpen])

  if (status === 'loading') return <StateMessage kind="loading" />
  if (!me || !access)
    return <Navigate to="/connexion" replace state={{ from: location.pathname }} />
  if (access === 'referent' && location.pathname !== '/referent') {
    return <Navigate to="/referent" replace />
  }

  function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const q = searchRef.current?.value.trim() ?? ''
    navigate(q ? `/utilisateurs?q=${encodeURIComponent(q)}` : '/utilisateurs')
  }

  return (
    <CrumbsContext.Provider value={setCrumbs}>
      <div className={styles.shell}>
        <aside
          id="navigation"
          className={`${styles.sidebar} ${navOpen ? styles.open : ''}`}
          aria-label={t('shell.navLabel')}
        >
          <div className={styles.sidebarHead}>
            <Link to="/tableau-de-bord" className={styles.logoLink}>
              <Logo height={32} />
            </Link>
            <span className={styles.env}>admin</span>
          </div>
          <nav>
            {NAV.map((group) => ({
              ...group,
              items: group.items.filter((item) => access === 'staff' || item.referent),
            }))
              .filter((group) => group.items.length > 0)
              .map((group) => (
                <div key={group.group} className={styles.navGroup}>
                  <p className={styles.navLabel}>{t(`shell.groups.${group.group}`)}</p>
                  {group.items.map((item) => {
                    const n = item.count ? counts[item.count] : 0
                    return (
                      <NavLink key={item.to} to={item.to} className={styles.navLink}>
                        {({ isActive }) => (
                          <span className={`${styles.navInner} ${isActive ? styles.active : ''}`}>
                            <Icon name={item.icon} size={18} />
                            {t(`nav.${item.key}`)}
                            {n > 0 && (
                              <span
                                className={`${styles.count} ${item.count === 'reports' ? styles.alert : ''}`}
                                aria-label={t('shell.pending', { count: n })}
                              >
                                {n}
                              </span>
                            )}
                          </span>
                        )}
                      </NavLink>
                    )
                  })}
                </div>
              ))}
          </nav>
          <div className={styles.sidebarFoot}>
            <div className={styles.langSide}>
              <LanguageSwitch />
            </div>
            <div className={styles.me}>
              <Avatar name={me.displayName} size={32} />
              <div>
                <b>{me.displayName}</b>
                <small>{t(`roles.${me.role}`)}</small>
              </div>
              <Button
                variant="ghost"
                size="icon"
                aria-label={t('shell.logout')}
                onClick={async () => {
                  await signOut()
                  navigate('/connexion')
                }}
              >
                <Icon name="out" size={17} />
              </Button>
            </div>
          </div>
        </aside>
        {navOpen && <div className={styles.scrim} onClick={() => setNavOpen(false)} />}

        <div className={styles.column}>
          <header className={styles.topbar}>
            <Button
              variant="ghost"
              size="icon"
              className={styles.burger}
              aria-label={t('shell.openMenu')}
              aria-controls="navigation"
              aria-expanded={navOpen}
              onClick={() => setNavOpen(true)}
            >
              <Icon name="menu" size={18} />
            </Button>
            <nav className={styles.crumbs} aria-label={t('shell.breadcrumbs')}>
              {crumbs.map((crumb, i) =>
                i < crumbs.length - 1 && crumb.to ? (
                  <span key={crumb.label} className={styles.crumb}>
                    <Link to={crumb.to}>{crumb.label}</Link>
                    <span aria-hidden="true">/</span>
                  </span>
                ) : (
                  <b key={crumb.label}>{crumb.label}</b>
                ),
              )}
            </nav>
            <div className={styles.right}>
              <form className={styles.gsearch} onSubmit={handleSearch} role="search">
                <Icon name="search" size={15} />
                <span className={utils.srOnly}>{t('shell.searchUser')}</span>
                <input ref={searchRef} type="search" placeholder={t('shell.searchUser')} />
                <span className={styles.kbd} aria-hidden="true">
                  /
                </span>
              </form>
              <div className={styles.langTop}>
                <LanguageSwitch />
              </div>
              <ThemeToggle />
              <ExternalButtonLink
                size="sm"
                className={styles.hideSm}
                href="/"
                target="_blank"
                rel="noopener"
              >
                {t('shell.viewSite')}
                <Icon name="ext" size={13} />
              </ExternalButtonLink>
            </div>
          </header>
          <main className={styles.content} id="main" tabIndex={-1}>
            <Outlet />
          </main>
        </div>
      </div>
    </CrumbsContext.Provider>
  )
}
