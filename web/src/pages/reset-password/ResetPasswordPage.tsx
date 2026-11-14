import { useState, type FormEvent } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ApiError } from '../../api/api';
import { Button } from '../../components/Button';
import { Field } from '../../components/Field';
import { describedBy } from '../../components/fieldIds';
import { useToast } from '../../components/useToast';
import { authApi } from '../../features/auth/authApi';
import { PasswordInput } from '../../features/auth/PasswordInput';
import { StrengthMeter } from '../../features/auth/StrengthMeter';
import {
  passwordStrength,
  validateConfirmPassword,
  validateNewPassword,
} from '../../features/auth/validation';
import { fieldErrorText } from '../../hooks/fieldErrorText';
import { usePageTitle } from '../../hooks/usePageTitle';
import { useSubmitError } from '../../hooks/useSubmitError';
import { useValidatedForm, type Validators } from '../../hooks/useValidatedForm';
import { AuthShell } from '../auth/AuthShell';
import form from '../../features/auth/AuthForm.module.css';
import styles from '../auth/AuthPage.module.css';

type Values = { password: string; confirm: string };
const VALIDATORS: Validators<Values> = {
  password: validateNewPassword,
  confirm: validateConfirmPassword,
};
const IDS: Record<keyof Values, string> = { password: 'reset-password', confirm: 'reset-confirm' };

/** Codes renvoyés quand le lien n'est plus utilisable : on propose d'en demander un autre. */
const DEAD_LINK = ['RESET_TOKEN_INVALID', 'RESET_TOKEN_EXPIRED'];

/** Nouveau mot de passe à partir du lien reçu par email, à durée limitée (AUTH-4). */
export default function ResetPasswordPage() {
  const { t } = useTranslation();
  usePageTitle(t('password.reset.pageTitle'));
  const navigate = useNavigate();
  const toast = useToast();
  const [params] = useSearchParams();
  const token = params.get('token')?.trim() ?? '';
  const [busy, setBusy] = useState(false);
  const [deadLink, setDeadLink] = useState(!token);
  const f = useValidatedForm<Values>({ password: '', confirm: '' }, VALIDATORS);
  const submitError = useSubmitError(f.setServerErrors);
  const passwordError = fieldErrorText(t, f.errors.password);
  const confirmError = fieldErrorText(t, f.errors.confirm);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    submitError.clear();
    const invalid = f.validateAll();
    if (invalid.length) {
      document.getElementById(IDS[invalid[0]])?.focus();
      return;
    }
    setBusy(true);
    try {
      await authApi.resetPassword(token, f.values.password);
      toast(t('password.reset.done'));
      navigate('/login', { replace: true });
    } catch (error) {
      if (error instanceof ApiError && DEAD_LINK.includes(error.code)) setDeadLink(true);
      else submitError.report(error);
      setBusy(false);
    }
  };

  if (deadLink) {
    return (
      <AuthShell title={t('password.reset.deadTitle')}>
        <p className={styles.lead} role="alert">
          {t('password.reset.deadText')}
        </p>
        <p className={styles.switch}>
          <Link to="/forgot-password">{t('password.reset.newLink')}</Link>
        </p>
      </AuthShell>
    );
  }

  return (
    <AuthShell title={t('password.reset.title')} lead={t('password.reset.lead')}>
      <form onSubmit={onSubmit} noValidate className={styles.spaced}>
        {submitError.message && (
          <div ref={submitError.alertRef} className={form.alert} role="alert" tabIndex={-1}>
            {submitError.message}
          </div>
        )}
        <Field
          id={IDS.password}
          label={t('password.reset.new')}
          hint={t('auth.fields.passwordHint')}
          error={passwordError}
        >
          <PasswordInput
            id={IDS.password}
            autoComplete="new-password"
            value={f.values.password}
            onChange={(e) => f.setValue('password', e.target.value)}
            onBlur={() => f.onBlur('password')}
            aria-invalid={!!passwordError}
            aria-describedby={describedBy(IDS.password, true, passwordError)}
          />
          <StrengthMeter level={passwordStrength(f.values.password)} />
        </Field>
        <Field id={IDS.confirm} label={t('password.reset.confirm')} error={confirmError}>
          <PasswordInput
            id={IDS.confirm}
            autoComplete="new-password"
            value={f.values.confirm}
            onChange={(e) => f.setValue('confirm', e.target.value)}
            onBlur={() => f.onBlur('confirm')}
            aria-invalid={!!confirmError}
            aria-describedby={describedBy(IDS.confirm, false, confirmError)}
          />
        </Field>
        <div className={form.actions}>
          <Button type="submit" variant="primary" block busy={busy}>
            {busy ? t('password.reset.busy') : t('password.reset.submit')}
          </Button>
        </div>
      </form>
    </AuthShell>
  );
}
