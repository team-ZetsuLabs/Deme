import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { errorMessage } from '../../api/errorMessage';
import { Button } from '../../components/Button';
import { Dialog } from '../../components/Dialog';
import { Field } from '../../components/Field';
import { useToast } from '../../components/useToast';
import { useSession } from '../auth/useSession';
import styles from './Settings.module.css';

/** Suppression du compte (AUTH-6), confirmée en tapant un mot. */
export function DeleteAccountSection() {
  const { t } = useTranslation();
  const { user, deleteAccount } = useSession();
  const navigate = useNavigate();
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  // Le contrat demande de recopier son pseudo (AUTH-6).
  const word = user?.username ?? '';

  const close = () => {
    setOpen(false);
    setConfirm('');
    setError(null);
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (confirm.trim() !== word) {
      setError(t('settings.delete.mismatch', { word }));
      return;
    }
    setBusy(true);
    try {
      await deleteAccount(confirm.trim());
      close();
      navigate('/questions', { replace: true });
      toast(t('settings.delete.done'));
    } catch (err) {
      setError(errorMessage(t, err));
      setBusy(false);
    }
  };

  return (
    <section
      id="delete"
      className={`${styles.section} ${styles.danger}`}
      aria-labelledby="settings-delete-title"
    >
      <h2 id="settings-delete-title" className={styles.title}>
        {t('settings.delete.title')}
      </h2>
      <p className={styles.intro}>{t('settings.delete.intro')}</p>
      <Button variant="danger" onClick={() => setOpen(true)}>
        {t('settings.delete.button')}
      </Button>

      <Dialog open={open} title={t('settings.delete.title')} onClose={close}>
        <p className={styles.intro}>{t('settings.delete.explain')}</p>
        <form onSubmit={onSubmit} noValidate>
          <Field
            id="delete-confirm"
            label={t('settings.delete.confirmLabel', { word })}
            error={error}
          >
            <input
              id="delete-confirm"
              autoComplete="off"
              autoCapitalize="characters"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              aria-invalid={!!error}
              aria-describedby={error ? 'delete-confirm-error' : undefined}
            />
          </Field>
          <div className={styles.dialogActions}>
            <Button variant="secondary" onClick={close} disabled={busy}>
              {t('settings.cancel')}
            </Button>
            <Button type="submit" variant="danger" busy={busy}>
              {t('settings.delete.confirm')}
            </Button>
          </div>
        </form>
      </Dialog>
    </section>
  );
}
