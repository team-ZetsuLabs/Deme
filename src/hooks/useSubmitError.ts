import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ApiError } from '../api/api';
import { errorMessage } from '../api/errorMessage';

/**
 * Message d'erreur général d'un formulaire, affiché dans une alerte qui prend le focus.
 * Les erreurs de champ (`fields`) sont transmises à onFields.
 */
export function useSubmitError(onFields: (fields: Record<string, string>) => void) {
  const { t } = useTranslation();
  const [message, setMessage] = useState<string | null>(null);
  const alertRef = useRef<HTMLDivElement>(null);

  const report = (error: unknown) => {
    if (error instanceof ApiError && error.fields) onFields(error.fields);
    setMessage(errorMessage(t, error));
    requestAnimationFrame(() => alertRef.current?.focus());
  };

  return { message, alertRef, report, clear: () => setMessage(null) };
}
