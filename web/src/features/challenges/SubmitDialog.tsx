import { useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import type { MySubmission } from '../../api/types';
import { errorMessage } from '../../api/errorMessage';
import { Button } from '../../components/Button';
import { Dialog } from '../../components/Dialog';
import { Field } from '../../components/Field';
import { describedBy } from '../../components/fieldIds';
import { challengesApi, validateRepoUrl } from './challengesApi';
import styles from './SubmitDialog.module.css';

export type SubmitDialogProps = {
  open: boolean;
  challengeId: number;
  onClose: () => void;
  onSubmitted: (submission: MySubmission) => void;
};

/** Dépôt d'un lien GitHub public, validé par format ; un dépôt par membre et par défi (CH-2). */
export function SubmitDialog({ open, challengeId, onClose, onSubmitted }: SubmitDialogProps) {
  const { t } = useTranslation();
  const [url, setUrl] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const close = () => {
    setUrl('');
    setError(null);
    onClose();
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const problem = validateRepoUrl(url);
    if (problem) {
      setError(t(problem));
      document.getElementById('repo-url')?.focus();
      return;
    }
    setBusy(true);
    try {
      onSubmitted(await challengesApi.submit(challengeId, { repositoryUrl: url.trim() }));
      close();
    } catch (err) {
      setError(errorMessage(t, err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} title={t('challenges.submit.title')} onClose={close}>
      <form onSubmit={onSubmit} noValidate>
        <Field
          id="repo-url"
          label={t('challenges.submit.label')}
          hint={t('challenges.submit.hint')}
          error={error}
        >
          <input
            id="repo-url"
            type="url"
            inputMode="url"
            autoCapitalize="none"
            spellCheck={false}
            placeholder="https://github.com/votre-compte/api-paiement"
            value={url}
            onChange={(e) => {
              setUrl(e.target.value);
              if (error && !validateRepoUrl(e.target.value)) setError(null);
            }}
            aria-invalid={!!error}
            aria-describedby={describedBy('repo-url', true, error)}
          />
        </Field>
        <p className={styles.notice}>{t('challenges.submit.notice')}</p>
        <div className={styles.actions}>
          <Button variant="secondary" onClick={close} disabled={busy}>
            {t('settings.cancel')}
          </Button>
          <Button type="submit" variant="primary" busy={busy}>
            {busy ? t('jobs.apply.busy') : t('challenges.submit.submit')}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
