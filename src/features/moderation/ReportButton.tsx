import { useState, type FormEvent } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import type { ReportReason, ReportTargetType } from '../../api/types';
import { errorMessage } from '../../api/errorMessage';
import { Button } from '../../components/Button';
import { Dialog } from '../../components/Dialog';
import { Field } from '../../components/Field';
import { Icon } from '../../components/Icon';
import { useToast } from '../../components/useToast';
import { useSession } from '../auth/useSession';
import { COMMENT_MAX, reasonsFor, reportsApi } from './reportsApi';
import styles from './ReportButton.module.css';

export type ReportButtonProps = {
  targetType: ReportTargetType;
  /** Identifiant du contenu, ou pseudo pour un profil. */
  targetId: number;
  /** Auteur du contenu : on ne signale pas son propre contenu. */
  authorUsername: string;
};

/**
 * Signaler un contenu (MOD-1), à partir du niveau Membre (section 8 du cahier).
 * Le masquage après 5 signalements (MOD-2) est fait par le serveur.
 */
export function ReportButton({ targetType, targetId, authorUsername }: ReportButtonProps) {
  const { t } = useTranslation();
  const { user } = useSession();
  const toast = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState<ReportReason | null>(null);
  const [comment, setComment] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const idPrefix = `report-${targetType.toLowerCase()}-${targetId}`;

  if (user?.username === authorUsername) return null;

  const onOpen = () => {
    if (!user) {
      navigate('/login', { state: { from: location.pathname } });
      return;
    }
    if (user.level === 'NEWCOMER') {
      toast(t('report.level'));
      return;
    }
    setOpen(true);
  };

  const close = () => {
    setOpen(false);
    setReason(null);
    setComment('');
    setError(null);
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!reason) {
      setError(t('report.reasonRequired'));
      return;
    }
    setBusy(true);
    try {
      await reportsApi.create({ targetType, targetId, reason, comment: comment.trim() || null });
      close();
      toast(t('report.sent'));
    } catch (err) {
      setError(errorMessage(t, err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <Button size="sm" variant="ghost" onClick={onOpen}>
        <Icon name="flag" size={14} />
        {t('report.button')}
      </Button>
      <Dialog open={open} title={t('report.title')} onClose={close}>
        <p className={styles.lead}>{t('report.lead')}</p>
        <form onSubmit={onSubmit} noValidate>
          <fieldset
            className={styles.reasons}
            aria-describedby={error ? `${idPrefix}-error` : undefined}
          >
            <legend className={styles.legend}>{t('report.reasonLegend')}</legend>
            {reasonsFor(targetType).map((value) => (
              <label key={value} className={styles.reason}>
                <input
                  type="radio"
                  name={`${idPrefix}-reason`}
                  value={value}
                  checked={reason === value}
                  onChange={() => {
                    setReason(value);
                    setError(null);
                  }}
                />
                {t(`report.reasons.${value}`)}
              </label>
            ))}
          </fieldset>
          {error && (
            <p id={`${idPrefix}-error`} className={styles.error} role="alert">
              {error}
            </p>
          )}
          <Field
            id={`${idPrefix}-comment`}
            label={
              <>
                {t('report.comment')} <span className="muted">{t('question.optional')}</span>
              </>
            }
            hint={t('report.commentHint')}
          >
            <textarea
              id={`${idPrefix}-comment`}
              rows={3}
              maxLength={COMMENT_MAX}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              aria-describedby={`${idPrefix}-comment-hint`}
            />
          </Field>
          <div className={styles.actions}>
            <Button variant="secondary" onClick={close} disabled={busy}>
              {t('question.cancel')}
            </Button>
            <Button type="submit" variant="primary" busy={busy}>
              {busy ? t('report.busy') : t('report.submit')}
            </Button>
          </div>
        </form>
      </Dialog>
    </>
  );
}
