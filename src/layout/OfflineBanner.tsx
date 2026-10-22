import { useTranslation } from 'react-i18next';
import { Icon } from '../components/Icon';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import styles from './OfflineBanner.module.css';

export function OfflineBanner() {
  const { t } = useTranslation();
  const online = useOnlineStatus();
  return (
    <div role="status" aria-live="polite">
      {!online && (
        <p className={styles.banner}>
          <Icon name="offline" size={16} />
          {t('network.offline')}
        </p>
      )}
    </div>
  );
}
