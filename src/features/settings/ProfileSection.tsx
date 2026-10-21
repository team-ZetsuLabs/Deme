import { useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import type { Me } from '../../api/provisional-types';
import { Button } from '../../components/Button';
import { Field } from '../../components/Field';
import { describedBy } from '../../components/fieldIds';
import { useToast } from '../../components/useToast';
import { fieldErrorText } from '../../hooks/fieldErrorText';
import { useSubmitError } from '../../hooks/useSubmitError';
import { useValidatedForm, type Validators } from '../../hooks/useValidatedForm';
import { NAME_MAX, validateName } from '../auth/validation';
import { useSession } from '../auth/useSession';
import { SkillPicker } from '../profile/SkillPicker';
import { PhotoField } from './PhotoField';
import styles from './Settings.module.css';

export const BIO_MAX = 200;

type ProfileValues = { name: string; city: string; bio: string };

const VALIDATORS: Validators<ProfileValues> = {
  name: validateName,
  bio: (value) => (value.length > BIO_MAX ? 'settings.profile.bioTooLong' : null),
};

const IDS: Record<keyof ProfileValues, string> = {
  name: 'settings-name',
  city: 'settings-city',
  bio: 'settings-bio',
};

export type ProfileSectionProps = { user: Me };

/** Profil public (SET-1) et visibilité pour les recruteurs (REP-5). */
export function ProfileSection({ user }: ProfileSectionProps) {
  const { t } = useTranslation();
  const { updateMe } = useSession();
  const toast = useToast();
  const initial = { name: user.name, city: user.city ?? '', bio: user.bio ?? '' };
  const form = useValidatedForm<ProfileValues>(initial, VALIDATORS);
  const submitError = useSubmitError(form.setServerErrors);
  const [skills, setSkills] = useState(user.skills);
  const [recruiterVisible, setRecruiterVisible] = useState(user.recruiterVisible);
  const [busy, setBusy] = useState(false);
  const { values, errors } = form;

  const reset = () => {
    form.reset(initial);
    setSkills(user.skills);
    setRecruiterVisible(user.recruiterVisible);
    submitError.clear();
  };

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
      await updateMe({
        name: values.name.trim(),
        city: values.city.trim() || null,
        bio: values.bio.trim() || null,
        skills,
        recruiterVisible,
      });
      toast(t('settings.saved'));
    } catch (error) {
      submitError.report(error);
    } finally {
      setBusy(false);
    }
  };

  const nameError = fieldErrorText(t, errors.name);
  const bioError = fieldErrorText(t, errors.bio);

  return (
    <section className={styles.section} aria-labelledby="settings-profile-title">
      <h2 id="settings-profile-title" className={styles.title}>
        {t('settings.profile.title')}
      </h2>
      <p className={styles.intro}>{t('settings.profile.intro')}</p>

      <PhotoField user={user} />

      <form onSubmit={onSubmit} noValidate>
        {submitError.message && (
          <div ref={submitError.alertRef} role="alert" tabIndex={-1} className={styles.alert}>
            {submitError.message}
          </div>
        )}
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
        <Field id={IDS.city} label={t('settings.profile.city')}>
          <input
            id={IDS.city}
            autoComplete="address-level2"
            maxLength={60}
            value={values.city}
            onChange={(e) => form.setValue('city', e.target.value)}
          />
        </Field>
        <Field
          id={IDS.bio}
          label={t('settings.profile.bio')}
          hint={t('settings.profile.bioHint')}
          error={bioError}
          labelAside={
            <span className={styles.count} aria-hidden="true">
              {values.bio.length}/{BIO_MAX}
            </span>
          }
        >
          <textarea
            id={IDS.bio}
            rows={3}
            value={values.bio}
            onChange={(e) => form.setValue('bio', e.target.value)}
            onBlur={() => form.onBlur('bio')}
            aria-invalid={!!bioError}
            aria-describedby={describedBy(IDS.bio, true, bioError)}
          />
        </Field>

        <h3 className={styles.subTitle}>{t('settings.profile.skills')}</h3>
        <SkillPicker value={skills} onChange={setSkills} />

        <label className={styles.check}>
          <input
            type="checkbox"
            checked={recruiterVisible}
            onChange={(e) => setRecruiterVisible(e.target.checked)}
          />
          <div>
            <b>{t('settings.profile.recruiterVisible')}</b>
            <span>{t('settings.profile.recruiterHint')}</span>
          </div>
        </label>

        <div className={styles.saveBar}>
          <Button variant="ghost" onClick={reset} disabled={busy}>
            {t('settings.cancel')}
          </Button>
          <Button type="submit" variant="primary" busy={busy}>
            {busy ? t('settings.saving') : t('settings.save')}
          </Button>
        </div>
      </form>
    </section>
  );
}
