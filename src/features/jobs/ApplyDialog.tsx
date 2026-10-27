import { useState, type ChangeEvent, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import type { Me, MyApplication } from '../../api/types';
import { errorMessage } from '../../api/errorMessage';
import { Avatar } from '../../components/Avatar';
import { Button } from '../../components/Button';
import { Dialog } from '../../components/Dialog';
import { Field } from '../../components/Field';
import { describedBy } from '../../components/fieldIds';
import { jobsApi } from './jobsApi';
import { cvError, MESSAGE_MAX, MESSAGE_MIN, validateMessage } from './validation';
import styles from './ApplyDialog.module.css';

export type ApplyDialogProps = {
  open: boolean;
  jobId: number;
  company: string;
  user: Me;
  onClose: () => void;
  onApplied: (application: MyApplication) => void;
};

/** Candidature (JOB-3) : profil Zetsu transmis, message de 40 caractères, CV PDF facultatif. */
export function ApplyDialog({ open, jobId, company, user, onClose, onApplied }: ApplyDialogProps) {
  const { t, i18n } = useTranslation();
  const [message, setMessage] = useState('');
  const [cv, setCv] = useState<File | null>(null);
  const [messageErr, setMessageErr] = useState<string | null>(null);
  const [cvErr, setCvErr] = useState<string | null>(null);
  const [formErr, setFormErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const close = () => {
    setMessage('');
    setCv(null);
    setMessageErr(null);
    setCvErr(null);
    setFormErr(null);
    onClose();
  };

  const onFile = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    const problem = file ? cvError(file) : null;
    setCvErr(problem ? t(problem) : null);
    setCv(problem ? null : file);
    if (problem) e.target.value = '';
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const problem = validateMessage(message);
    setMessageErr(problem ? t(problem, { min: MESSAGE_MIN }) : null);
    if (problem) {
      document.getElementById('apply-message')?.focus();
      return;
    }
    setBusy(true);
    setFormErr(null);
    try {
      const application = await jobsApi.apply(jobId, { message: message.trim(), cv });
      onApplied(application);
      close();
    } catch (err) {
      setFormErr(errorMessage(t, err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} title={t('jobs.apply.title', { company })} onClose={close}>
      <p className={styles.label}>{t('jobs.apply.profile')}</p>
      <div className={styles.applicant}>
        <Avatar name={user.displayName} photoUrl={user.avatarUrl ?? null} size={44} />
        <div>
          <b>{user.displayName}</b>
          <span>
            {t('question.points', { points: user.reputation.toLocaleString(i18n.language) })}
            {!!user.technologies.length && `, ${user.technologies.join(', ')}`}
          </span>
        </div>
      </div>

      <form onSubmit={onSubmit} noValidate>
        {formErr && (
          <p className={styles.alert} role="alert">
            {formErr}
          </p>
        )}
        <Field
          id="apply-message"
          label={t('jobs.apply.message')}
          hint={t('jobs.apply.messageHint')}
          error={messageErr}
          labelAside={
            <span className={styles.count} aria-hidden="true">
              {message.length}/{MESSAGE_MAX}
            </span>
          }
        >
          <textarea
            id="apply-message"
            rows={5}
            maxLength={MESSAGE_MAX}
            value={message}
            onChange={(e) => {
              setMessage(e.target.value);
              if (messageErr && !validateMessage(e.target.value)) setMessageErr(null);
            }}
            aria-invalid={!!messageErr}
            aria-describedby={describedBy('apply-message', true, messageErr)}
          />
        </Field>
        <Field
          id="apply-cv"
          label={
            <>
              {t('jobs.apply.cv')} <span className="muted">{t('question.optional')}</span>
            </>
          }
          hint={t('jobs.apply.cvHint')}
          error={cvErr}
        >
          <input
            id="apply-cv"
            type="file"
            accept="application/pdf"
            className={styles.file}
            onChange={onFile}
            aria-invalid={!!cvErr}
            aria-describedby={describedBy('apply-cv', true, cvErr)}
          />
        </Field>
        <div className={styles.actions}>
          <Button variant="secondary" onClick={close} disabled={busy}>
            {t('settings.cancel')}
          </Button>
          <Button type="submit" variant="primary" busy={busy}>
            {busy ? t('jobs.apply.busy') : t('jobs.apply.submit')}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
