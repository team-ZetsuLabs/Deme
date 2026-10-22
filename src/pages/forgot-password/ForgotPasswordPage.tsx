import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button } from '../../components/Button';
import { Field } from '../../components/Field';
import { describedBy } from '../../components/fieldIds';
import { authApi } from '../../features/auth/authApi';
import { validateEmail } from '../../features/auth/validation';
import { fieldErrorText } from '../../hooks/fieldErrorText';
import { usePageTitle } from '../../hooks/usePageTitle';
import { useSubmitError } from '../../hooks/useSubmitError';
import { useValidatedForm, type Validators } from '../../hooks/useValidatedForm';
import { AuthShell } from '../auth/AuthShell';
import form from '../../features/auth/AuthForm.module.css';
import styles from '../auth/AuthPage.module.css';

type Values = { email: string };
const VALIDATORS: Validators<Values> = { email: validateEmail };
const EMAIL_ID = 'forgot-email';

/**
 * Mot de passe oublié (AUTH-4). La réponse est la même que l'adresse existe ou non,
 * pour ne rien révéler sur les comptes.
 */
export default function ForgotPasswordPage() {
  const { t } = useTranslation();
  usePageTitle(t('password.forgot.pageTitle'));
  const [busy, setBusy] = useState(false);
  const [sentTo, setSentTo] = useState<string | null>(null);
  const f = useValidatedForm<Values>({ email: '' }, VALIDATORS);
  const submitError = useSubmitError(f.setServerErrors);
  const emailError = fieldErrorText(t, f.errors.email);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    submitError.clear();
    if (f.validateAll().length) {
      document.getElementById(EMAIL_ID)?.focus();
      return;
    }
    setBusy(true);
    try {
      const email = f.values.email.trim();
      await authApi.requestPasswordReset(email);
      setSentTo(email);
    } catch (error) {
      submitError.report(error);
    } finally {
      setBusy(false);
    }
  };

  if (sentTo) {
    return (
      <AuthShell title={t('password.forgot.sentTitle')}>
        <p className={styles.lead} role="status">
          {t('password.forgot.sentText', { email: sentTo })}
        </p>
        <p className={styles.switch}>
          <Link to="/login">{t('password.backToLogin')}</Link>
        </p>
      </AuthShell>
    );
  }

  return (
    <AuthShell title={t('password.forgot.title')} lead={t('password.forgot.lead')}>
      <form onSubmit={onSubmit} noValidate className={styles.spaced}>
        {submitError.message && (
          <div ref={submitError.alertRef} className={form.alert} role="alert" tabIndex={-1}>
            {submitError.message}
          </div>
        )}
        <Field id={EMAIL_ID} label={t('auth.fields.email')} error={emailError}>
          <input
            id={EMAIL_ID}
            type="email"
            inputMode="email"
            autoComplete="email"
            value={f.values.email}
            onChange={(e) => f.setValue('email', e.target.value)}
            onBlur={() => f.onBlur('email')}
            aria-invalid={!!emailError}
            aria-describedby={describedBy(EMAIL_ID, false, emailError)}
          />
        </Field>
        <div className={form.actions}>
          <Button type="submit" variant="primary" block busy={busy}>
            {busy ? t('password.forgot.busy') : t('password.forgot.submit')}
          </Button>
        </div>
      </form>
      <p className={styles.switch}>
        <Link to="/login">{t('password.backToLogin')}</Link>
      </p>
    </AuthShell>
  );
}
