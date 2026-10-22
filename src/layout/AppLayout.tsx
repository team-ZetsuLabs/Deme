import { Suspense } from 'react';
import { Outlet } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { BottomTabs } from './BottomTabs';
import { OfflineBanner } from './OfflineBanner';
import { SideNav } from './SideNav';
import { Topbar } from './Topbar';
import { PageLoader } from './PageLoader';
import styles from './AppLayout.module.css';

export function AppLayout() {
  const { t } = useTranslation();
  return (
    <>
      <a href="#main" className={styles.skip}>
        {t('app.skipToContent')}
      </a>
      <Topbar />
      <OfflineBanner />
      <div className={styles.layout}>
        <div className={styles.rail}>
          <SideNav />
        </div>
        <main id="main" tabIndex={-1} className={styles.main}>
          <Suspense fallback={<PageLoader />}>
            <Outlet />
          </Suspense>
        </main>
      </div>
      <BottomTabs />
    </>
  );
}
