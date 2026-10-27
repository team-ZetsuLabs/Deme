import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import type { MyModeratedContent } from '../../api/types';
import { errorMessage } from '../../api/errorMessage';
import { Button } from '../../components/Button';
import { Dialog } from '../../components/Dialog';
import { Field } from '../../components/Field';
import { describedBy } from '../../components/fieldIds';
import { Icon } from '../../components/Icon';
import { useToast } from '../../components/useToast';
import { APPEAL_MAX, APPEAL_MIN, appealsApi } from './appealsApi';
import styles from './HiddenNotice.module.css';

export type HiddenNoticeProps = {
  /** Élément de GET /users/me/moderation. */
  item: MyModeratedContent;
  /** Appelé après l'envoi d'une contestation, avec le dossier à jour (APPEALED). */
  onAppealed: (item: MyModeratedContent) => void;
};

/**
 * Avis montré à l'auteur d'un contenu masqué (MOD-2), qui reste seul à le voir,
 * avec la possibilité de contester la décision devant l'équipe (MOD-3).
 */
export function HiddenNotice({ item, onAppealed }: HiddenNoticeProps) {
  const { t } = useTranslation();
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const fieldId = `appeal-${item.caseId}`;
  // Sans décision, le masquage vient des signalements (MOD-2) ; sinon d'un Référent ou de l'équipe.
  const reason = t(item.decision ? 'hidden.byReferent' : 'hidden.byReports');
  const rejected = item.status === 'HIDDEN' && !item.canAppeal;

  const close = () => {
    setOpen(false);
    setMessage('');
    setError(null);
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const text = message.trim();
    if (text.length < APPEAL_MIN) {
      setError(t('hidden.messageLength', { min: APPEAL_MIN }));
      return;
    }
    setBusy(true);
    try {
      const updated = await appealsApi.create(item.caseId, text);
      close();
      onAppealed(updated);
      toast(t('hidden.sent'));
    } catch (err) {
      setError(errorMessage(t, err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className={styles.notice} role="note">
      <p className={styles.title}>
        <Icon name="flag" size={14} />
        {t('hidden.title')}
      </p>
      <p className={styles.text}>
        {reason} {t('hidden.onlyYou')}
      </p>
      {item.canAppeal && (
        <div className={styles.actions}>
          <Button size="sm" variant="secondary" onClick={() => setOpen(true)}>
            {t('hidden.appeal')}
          </Button>
          <Link to="/rules" className={styles.link}>
            {t('hidden.rules')}
          </Link>
        </div>
      )}
      {item.status === 'APPEALED' && <p className={styles.status}>{t('hidden.pending')}</p>}
      {rejected && <p className={styles.status}>{t('hidden.rejected')}</p>}

      <Dialog open={open} title={t('hidden.dialogTitle')} onClose={close}>
        <p className={styles.lead}>{t('hidden.dialogLead')}</p>
        <form onSubmit={onSubmit} noValidate>
          <Field
            id={fieldId}
            label={t('hidden.message')}
            hint={t('hidden.messageHint', { min: APPEAL_MIN, max: APPEAL_MAX })}
            error={error}
          >
            <textarea
              id={fieldId}
              rows={5}
              maxLength={APPEAL_MAX}
              value={message}
              onChange={(e) => {
                setMessage(e.target.value);
                setError(null);
              }}
              aria-invalid={!!error}
              aria-describedby={describedBy(fieldId, true, error)}
            />
          </Field>
          <div className={styles.dialogActions}>
            <Button variant="secondary" onClick={close} disabled={busy}>
              {t('question.cancel')}
            </Button>
            <Button type="submit" variant="primary" busy={busy}>
              {busy ? t('hidden.busy') : t('hidden.submit')}
            </Button>
          </div>
        </form>
      </Dialog>
    </div>
  );
}
