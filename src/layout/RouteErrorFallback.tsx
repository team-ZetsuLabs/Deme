import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '../components/Button';
import { StateMessage } from '../components/StateMessage';
import { useConnectionQuality } from '../hooks/useConnectionQuality';

/** Affiché quand une page n'a pas pu être chargée ; elle se recharge seule au retour du réseau. */
export function RouteErrorFallback() {
  const { t } = useTranslation();
  const quality = useConnectionQuality();

  useEffect(() => {
    const onOnline = () => window.location.reload();
    window.addEventListener('online', onOnline);
    return () => window.removeEventListener('online', onOnline);
  }, []);

  return (
    <StateMessage
      role="alert"
      action={<Button onClick={() => window.location.reload()}>{t('common.retry')}</Button>}
    >
      {quality === 'offline' ? t('network.pageOffline') : t('network.pageFailed')}
    </StateMessage>
  );
}
