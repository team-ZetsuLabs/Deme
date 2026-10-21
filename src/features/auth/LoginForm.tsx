import { useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '../../components/Button';
import { Field } from '../../components/Field';
import { describedBy } from '../../components/fieldIds';
import { useValidatedForm, type Validators } from '../../hooks/useValidatedForm';
import { fieldErrorText } from '../../hooks/fieldErrorText';
import { PasswordInput } from './PasswordInput';
import { useSession } from './useSession';
import { useSubmitError } from '../../hooks/useSubmitError';
import { validateEmail, validateLoginPassword } from './validation';
import styles from './AuthForm.module.css';

type LoginValues = { email: string; password: string };

const VALIDATORS: Validators<LoginValues> = {
  email: validateEmail,
  password: validateLoginPassword,
};

const IDS: Record<keyof LoginValues, string> = { email: 'login-email', password: 'login-password' };

export type LoginFormProps = { onSignedIn: () => void };

export function LoginForm({ onSignedIn }: LoginFormProps) {
  const { t } = useTranslation();
  const { login } = useSession();
  const [busy, setBusy] = useState(false);
  const form = useValidatedForm<LoginValues>({ email: '', password: '' }, VALIDATORS);
  const submitError = useSubmitError(form.setServerErrors);
  const { values, errors } = form;

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    submitError.clear();
    const invalid = form.validateAll();
    if (invalid.length) {
      document.getElementById(IDS[invalid[0]])?.focus();
      return;
    }
    setBusy(true);
    try {
      await login({ email: values.email.trim(), password: values.password });
      onSignedIn();
    } catch (error) {
      submitError.report(error);
      setBusy(false);
    }
  };

  const emailError = fieldErrorText(t, errors.email);
  const passwordError = fieldErrorText(t, errors.password);

  return (
    <form onSubmit={onSubmit} noValidate>
      {submitError.message && (
        <div ref={submitError.alertRef} className={styles.alert} role="alert" tabIndex={-1}>
          {submitError.message}
        </div>
      )}

      <Field id={IDS.email} label={t('auth.fields.email')} error={emailError}>
        <input
          id={IDS.email}
          type="email"
          inputMode="email"
          autoComplete="email"
          value={values.email}
          onChange={(e) => form.setValue('email', e.target.value)}
          onBlur={() => form.onBlur('email')}
          aria-invalid={!!emailError}
          aria-describedby={describedBy(IDS.email, false, emailError)}
        />
      </Field>

      <Field id={IDS.password} label={t('auth.fields.password')} error={passwordError}>
        <PasswordInput
          id={IDS.password}
          autoComplete="current-password"
          value={values.password}
          onChange={(e) => form.setValue('password', e.target.value)}
          onBlur={() => form.onBlur('password')}
          aria-invalid={!!passwordError}
          aria-describedby={describedBy(IDS.password, false, passwordError)}
        />
      </Field>

      <div className={styles.actions}>
        <Button type="submit" variant="primary" block busy={busy}>
          {busy ? t('auth.login.busy') : t('auth.login.submit')}
        </Button>
      </div>
    </form>
  );
}
