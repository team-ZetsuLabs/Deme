import { useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import type { ProjectRequest, ProjectRole } from '../../api/types';
import { errorMessage } from '../../api/errorMessage';
import { Button } from '../../components/Button';
import { Dialog } from '../../components/Dialog';
import { Field } from '../../components/Field';
import { describedBy } from '../../components/fieldIds';
import { projectsApi } from './projectsApi';
import { JOIN_MESSAGE_MAX, JOIN_MESSAGE_MIN, validateJoinMessage } from './validation';
import styles from './JoinDialog.module.css';

export type JoinDialogProps = {
  open: boolean;
  projectId: number;
  projectTitle: string;
  /** Rôles ouverts proposés au choix ; la demande peut aussi être générale. */
  openRoles: ProjectRole[];
  onClose: () => void;
  onJoined: (request: ProjectRequest) => void;
};

/** Demande pour rejoindre un projet (PRJ) : rôle facultatif et message de présentation. */
export function JoinDialog({
  open,
  projectId,
  projectTitle,
  openRoles,
  onClose,
  onJoined,
}: JoinDialogProps) {
  const { t } = useTranslation();
  const [roleId, setRoleId] = useState('');
  const [message, setMessage] = useState('');
  const [messageErr, setMessageErr] = useState<string | null>(null);
  const [formErr, setFormErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const close = () => {
    setRoleId('');
    setMessage('');
    setMessageErr(null);
    setFormErr(null);
    onClose();
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const problem = validateJoinMessage(message);
    setMessageErr(problem ? t(problem, { min: JOIN_MESSAGE_MIN }) : null);
    if (problem) {
      document.getElementById('join-message')?.focus();
      return;
    }
    setBusy(true);
    setFormErr(null);
    try {
      const request = await projectsApi.join(projectId, {
        roleId: roleId ? Number(roleId) : null,
        message: message.trim(),
      });
      onJoined(request);
      close();
    } catch (err) {
      setFormErr(errorMessage(t, err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} title={t('projects.join.title', { title: projectTitle })} onClose={close}>
      <form onSubmit={onSubmit} noValidate>
        {formErr && (
          <p className={styles.alert} role="alert">
            {formErr}
          </p>
        )}

        {openRoles.length > 0 && (
          <Field id="join-role" label={t('projects.join.role')} hint={t('projects.join.roleHint')}>
            <select
              id="join-role"
              value={roleId}
              onChange={(e) => setRoleId(e.target.value)}
              aria-describedby={describedBy('join-role', true, null)}
            >
              <option value="">{t('projects.join.roleAny')}</option>
              {openRoles.map((role) => (
                <option key={role.id} value={String(role.id)}>
                  {role.title}
                </option>
              ))}
            </select>
          </Field>
        )}

        <Field
          id="join-message"
          label={t('projects.join.message')}
          hint={t('projects.join.messageHint')}
          error={messageErr}
          labelAside={
            <span className={styles.count} aria-hidden="true">
              {message.length}/{JOIN_MESSAGE_MAX}
            </span>
          }
        >
          <textarea
            id="join-message"
            rows={5}
            maxLength={JOIN_MESSAGE_MAX}
            value={message}
            onChange={(e) => {
              setMessage(e.target.value);
              if (messageErr && !validateJoinMessage(e.target.value)) setMessageErr(null);
            }}
            aria-invalid={!!messageErr}
            aria-describedby={describedBy('join-message', true, messageErr)}
          />
        </Field>

        <div className={styles.actions}>
          <Button variant="secondary" onClick={close} disabled={busy}>
            {t('settings.cancel')}
          </Button>
          <Button type="submit" variant="primary" busy={busy}>
            {busy ? t('projects.join.busy') : t('projects.join.submit')}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
