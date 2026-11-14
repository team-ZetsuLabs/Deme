import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { Trans, useTranslation } from 'react-i18next';
import { CountrySelect } from '../../components/CountrySelect';
import { Button } from '../../components/Button';
import { Field } from '../../components/Field';
import { describedBy } from '../../components/fieldIds';
import { useValidatedForm, type Validators } from '../../hooks/useValidatedForm';
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
  const { t } = useTranslation();
  const { register } = useSession();
  const [busy, setBusy] = useState(false);
  const [website, setWebsite] = useState('');
  const form = useValidatedForm<RegisterValues>(
    { name: '', email: '', country: '', password: '' },
    VALIDATORS,
  );
  // Le contrat nomme les champs displayName et countryCode.
  const submitError = useSubmitError(({ displayName, countryCode, ...rest }) =>
    form.setServerErrors({ ...rest, name: displayName, country: countryCode }),
  );
  const { values, errors } = form;

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    submitError.clear();
    const invalid = form.validateAll();
    if (invalid.length) {
      document.getElementById(IDS[invalid[0]])?.focus();
      return;
    }
    // Champ piège rempli : un robot. On ne crée rien et on ne lui dit rien.
    if (website) return;
    setBusy(true);
    try {
      await register({
        displayName: values.name.trim(),
        email: values.email.trim(),
        countryCode: values.country,
        password: values.password,
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

      <div className={styles.row}>
        <Field id={IDS.name} label={t('auth.fields.name')} error={nameError}>
          <input
            id={IDS.name}
            autoComplete="name"
            maxLength={NAME_MAX}
            value={values.name}
            onChange={(e) => form.setValue('name', e.target.value)}
            onBlur={() => form.onBlur('name')}
            aria-invalid={!!nameError}
            aria-describedby={describedBy(IDS.name, false, nameError)}
          />
        </Field>

        <Field id={IDS.country} label={t('auth.fields.country')} error={countryError}>
          <CountrySelect
            id={IDS.country}
            value={values.country}
            onChange={(value) => form.setValue('country', value)}
            onBlur={() => form.onBlur('country')}
            emptyLabel={t('auth.fields.countryPlaceholder')}
            otherLabel={t('auth.fields.countryOther')}
            invalid={!!countryError}
            describedBy={describedBy(IDS.country, false, countryError)}
          />
        </Field>
      </div>

      <div className={styles.row}>
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
      </div>

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
