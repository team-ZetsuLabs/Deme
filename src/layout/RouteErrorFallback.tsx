import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '../components/Button';
import { buttonClass } from '../components/buttonClass';
import { StatusScreen } from '../components/StatusScreen';
import { useConnectionQuality } from '../hooks/useConnectionQuality';

/** Affiché quand une page n'a pas pu être chargée ; elle se recharge seule au retour du réseau. */
export function RouteErrorFallback() {
  const { t } = useTranslation();
  const offline = useConnectionQuality() === 'offline';

  useEffect(() => {
    const onOnline = () => window.location.reload();
    window.addEventListener('online', onOnline);
    return () => window.removeEventListener('online', onOnline);
  }, []);

  return (
    <div role="alert">
      <StatusScreen
        code={offline ? t('errorPage.codeOffline') : t('errorPage.code')}
        title={offline ? t('errorPage.titleOffline') : t('errorPage.title')}
        text={offline ? t('network.pageOffline') : t('network.pageFailed')}
        actions={
          <>
            <Button variant="primary" onClick={() => window.location.reload()}>
              {t('common.retry')}
            </Button>
            {/* Lien classique : après une erreur, on repart d'une page neuve. */}
            <a href="/questions" className={buttonClass({ variant: 'secondary' })}>
              {t('notFound.back')}
            </a>
          </>
        }
      />
    </div>
  );
}
