import { Suspense, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { BottomTabs } from './BottomTabs';
import { EmailVerifyBanner } from './EmailVerifyBanner';
import { OfflineBanner } from './OfflineBanner';
import { SideNav } from './SideNav';
import { Topbar } from './Topbar';
import { PageLoader } from './PageLoader';
import { RouteErrorBoundary } from './RouteErrorBoundary';
import styles from './AppLayout.module.css';

export function AppLayout() {
  const { t } = useTranslation();
  const { pathname } = useLocation();

  // Nouvelle page : on repart du haut. Les filtres (?tag=…) ne changent pas le chemin.
  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [pathname]);

  return (
    <>
      <a href="#main" className={styles.skip}>
        {t('app.skipToContent')}
      </a>
      <Topbar />
      <OfflineBanner />
      <EmailVerifyBanner />
      <div className={styles.layout}>
        <div className={styles.rail}>
          <SideNav />
        </div>
        <main id="main" tabIndex={-1} className={styles.main}>
          {/* La clé relance l'animation d'entrée à chaque changement de page. */}
          <div key={pathname} className="page-enter">
            <RouteErrorBoundary>
              <Suspense fallback={<PageLoader />}>
                <Outlet />
              </Suspense>
            </RouteErrorBoundary>
          </div>
        </main>
      </div>
      <BottomTabs />
    </>
  );
}
