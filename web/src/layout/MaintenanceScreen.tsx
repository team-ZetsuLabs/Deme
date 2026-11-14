import { useTranslation } from 'react-i18next';
import { Button } from '../components/Button';
import { StatusScreen } from '../components/StatusScreen';
import { usePageTitle } from '../hooks/usePageTitle';
import { Logo } from './Logo';
import styles from './MaintenanceScreen.module.css';

/** Remplace tous les écrans quand le back-end annonce une maintenance (503 MAINTENANCE). */
export function MaintenanceScreen() {
  const { t } = useTranslation();
  usePageTitle(t('maintenance.title'));
  return (
    <div className={styles.page}>
      <header className={styles.head}>
        <Logo />
      </header>
      <main id="main" className={styles.main}>
        <StatusScreen
          code={t('maintenance.code')}
          title={t('maintenance.title')}
          text={t('maintenance.text')}
          actions={
            <Button variant="primary" onClick={() => window.location.reload()}>
              {t('common.retry')}
            </Button>
          }
        />
      </main>
    </div>
  );
}
