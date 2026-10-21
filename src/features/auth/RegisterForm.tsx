import { useMemo, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { Trans, useTranslation } from 'react-i18next';
import { Button } from '../../components/Button';
import { Field } from '../../components/Field';
import { describedBy } from '../../components/fieldIds';
import { useValidatedForm, type Validators } from '../../hooks/useValidatedForm';
import { countryOptions, OTHER_COUNTRY } from '../../i18n/countries';
import { fieldErrorText } from '../../hooks/fieldErrorText';
import { PasswordInput } from './PasswordInput';
import { StrengthMeter } from './StrengthMeter';
import { useSession } from './useSession';
import { useSubmitError } from '../../hooks/useSubmitError';
import {
  NAME_MAX,
  passwordStrength,
  validateCountry,
  validateEmail,
  validateName,
  validateNewPassword,
} from './validation';
import styles from './AuthForm.module.css';

type RegisterValues = { name: string; email: string; country: string; password: string };

const VALIDATORS: Validators<RegisterValues> = {
  name: validateName,
  email: validateEmail,
  country: validateCountry,
  password: validateNewPassword,
};

const IDS: Record<keyof RegisterValues, string> = {
  name: 'register-name',
  email: 'register-email',
  country: 'register-country',
  password: 'register-password',
};

export type RegisterFormProps = { onSignedIn: () => void };

export function RegisterForm({ onSignedIn }: RegisterFormProps) {
  const { t, i18n } = useTranslation();
  const { register } = useSession();
  const [busy, setBusy] = useState(false);
  const [website, setWebsite] = useState('');
  const form = useValidatedForm<RegisterValues>(
    { name: '', email: '', country: '', password: '' },
    VALIDATORS,
  );
  const submitError = useSubmitError(form.setServerErrors);
  const { values, errors } = form;
  const countries = useMemo(() => countryOptions(i18n.language), [i18n.language]);

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
      await register({
        name: values.name.trim(),
        email: values.email.trim(),
        country: values.country,
        password: values.password,
        website,
      });
      onSignedIn();
    } catch (error) {
      submitError.report(error);
      setBusy(false);
    }
  };

  const nameError = fieldErrorText(t, errors.name);
  const emailError = fieldErrorText(t, errors.email);
  const countryError = fieldErrorText(t, errors.country);
  const passwordError = fieldErrorText(t, errors.password);

  return (
    <form onSubmit={onSubmit} noValidate>
      {submitError.message && (
        <div ref={submitError.alertRef} className={styles.alert} role="alert" tabIndex={-1}>
          {submitError.message}
        </div>
      )}

      <Field
        id={IDS.name}
        label={t('auth.fields.name')}
        hint={t('auth.fields.nameHint')}
        error={nameError}
      >
        <input
          id={IDS.name}
          autoComplete="name"
          maxLength={NAME_MAX}
          value={values.name}
          onChange={(e) => form.setValue('name', e.target.value)}
          onBlur={() => form.onBlur('name')}
          aria-invalid={!!nameError}
          aria-describedby={describedBy(IDS.name, true, nameError)}
        />
      </Field>

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

      <Field
        id={IDS.country}
        label={t('auth.fields.country')}
        hint={t('auth.fields.countryHint')}
        error={countryError}
      >
        <select
          id={IDS.country}
          autoComplete="country"
          value={values.country}
          onChange={(e) => form.setValue('country', e.target.value)}
          onBlur={() => form.onBlur('country')}
          aria-invalid={!!countryError}
          aria-describedby={describedBy(IDS.country, true, countryError)}
        >
          <option value="">{t('auth.fields.countryPlaceholder')}</option>
          {countries.map((c) => (
            <option key={c.code} value={c.code}>
              {c.name}
            </option>
          ))}
          <option value={OTHER_COUNTRY}>{t('auth.fields.countryOther')}</option>
        </select>
      </Field>

      <Field
        id={IDS.password}
        label={t('auth.fields.password')}
        hint={t('auth.fields.passwordHint')}
        error={passwordError}
      >
        <PasswordInput
          id={IDS.password}
          autoComplete="new-password"
          value={values.password}
          onChange={(e) => form.setValue('password', e.target.value)}
          onBlur={() => form.onBlur('password')}
          aria-invalid={!!passwordError}
          aria-describedby={describedBy(IDS.password, true, passwordError)}
        />
        <StrengthMeter level={passwordStrength(values.password)} />
      </Field>

      <div className={styles.trap} aria-hidden="true">
        <label htmlFor="register-website">{t('auth.fields.website')}</label>
        <input
          id="register-website"
          name="website"
          tabIndex={-1}
          autoComplete="off"
          value={website}
          onChange={(e) => setWebsite(e.target.value)}
        />
      </div>

      <div className={styles.actions}>
        <Button type="submit" variant="primary" block busy={busy}>
          {busy ? t('auth.register.busy') : t('auth.register.submit')}
        </Button>
      </div>

      <p className={styles.legal}>
        <Trans
          i18nKey="auth.register.legal"
          components={{ terms: <Link to="/terms" />, privacy: <Link to="/privacy" /> }}
        />
      </p>
    </form>
  );
}
