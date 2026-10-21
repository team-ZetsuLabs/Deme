import { useTranslation } from 'react-i18next';
import { errorMessage } from '../api/errorMessage';
import { Button } from './Button';
import { StateMessage } from './StateMessage';

export type ErrorStateProps = { error: unknown; onRetry?: () => void };

/** Erreur réseau ou API : message traduit à partir du code, et bouton Réessayer. */
export function ErrorState({ error, onRetry }: ErrorStateProps) {
  const { t } = useTranslation();
  return (
    <StateMessage
      role="alert"
      action={onRetry && <Button onClick={onRetry}>{t('common.retry')}</Button>}
    >
      {errorMessage(t, error)}
    </StateMessage>
  );
}
