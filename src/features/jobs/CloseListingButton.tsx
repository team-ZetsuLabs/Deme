import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { errorMessage } from '../../api/errorMessage';
import { Button } from '../../components/Button';
import { Dialog } from '../../components/Dialog';
import styles from './CloseListingButton.module.css';

export type CloseListingButtonProps = {
  /** Préfixe des textes : clôture d'une offre, d'une mission ou d'une campagne de test. */
  labels: 'jobs.close' | 'missions.close' | 'playtests.owner.close';
  /** Appel au serveur ; l'écran se met à jour avec la réponse. */
  onConfirm: () => Promise<void>;
};

/** Clôturer son offre ou sa mission, après confirmation : elle n'accepte plus de candidature. */
export function CloseListingButton({ labels, onConfirm }: CloseListingButtonProps) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const close = () => {
    setOpen(false);
    setError(null);
  };

  const confirm = async () => {
    setBusy(true);
    setError(null);
    try {
      await onConfirm();
      close();
    } catch (err) {
      setError(errorMessage(t, err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <Button variant="secondary" block onClick={() => setOpen(true)}>
        {t(`${labels}.button`)}
      </Button>
      <Dialog open={open} title={t(`${labels}.title`)} onClose={close}>
        <p className={styles.text}>{t(`${labels}.text`)}</p>
        {error && (
          <p className={styles.alert} role="alert">
            {error}
          </p>
        )}
        <div className={styles.actions}>
          <Button variant="secondary" onClick={close} disabled={busy}>
            {t('settings.cancel')}
          </Button>
          <Button variant="primary" busy={busy} onClick={confirm}>
            {t(`${labels}.confirm`)}
          </Button>
        </div>
      </Dialog>
    </>
  );
}
