import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import type { Me } from '../../api/types';
import { Button } from '../../components/Button';
import { buttonClass } from '../../components/buttonClass';
import { CountrySelect } from '../../components/CountrySelect';
import { Field } from '../../components/Field';
import { describedBy } from '../../components/fieldIds';
import { fieldErrorText } from '../../hooks/fieldErrorText';
import { useSubmitError } from '../../hooks/useSubmitError';
import { useValidatedForm, type Validators } from '../../hooks/useValidatedForm';
import { NAME_MAX, validateName } from '../auth/validation';
import { useSession } from '../auth/useSession';
import { PhotoField } from './PhotoField';
import { SkillPicker } from './SkillPicker';
import styles from './ProfileForm.module.css';

export const BIO_MAX = 200;

type ProfileValues = { name: string; country: string; city: string; bio: string };

const VALIDATORS: Validators<ProfileValues> = {
  name: validateName,
  bio: (value) => (value.length > BIO_MAX ? 'settings.profile.bioTooLong' : null),
};

const IDS: Record<keyof ProfileValues, string> = {
  name: 'profile-name',
  country: 'profile-country',
  city: 'profile-city',
  bio: 'profile-bio',
};

export type ProfileFormProps = {
  user: Me;
  /** Appelé après l'enregistrement, pour revenir au profil. */
  onSaved: () => void;
};

/** Tout ce que les autres membres voient (SET-1), et la visibilité pour les recruteurs (REP-5). */
export function ProfileForm({ user, onSaved }: ProfileFormProps) {
  const { t } = useTranslation();
  const { updateMe } = useSession();
  const form = useValidatedForm<ProfileValues>(
    {
      name: user.displayName,
      country: user.countryCode ?? '',
      city: user.city ?? '',
      bio: user.bio ?? '',
    },
    VALIDATORS,
  );
  // Le contrat nomme les champs displayName et countryCode.
  const submitError = useSubmitError(({ displayName, countryCode, ...rest }) =>
    form.setServerErrors({ ...rest, name: displayName, country: countryCode }),
  );
  const [skills, setSkills] = useState(user.skills ?? []);
  const [recruiterVisible, setRecruiterVisible] = useState(user.visibleToRecruiters);
  const [busy, setBusy] = useState(false);
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
      await updateMe({
        displayName: values.name.trim(),
        countryCode: values.country || undefined,
        city: values.city.trim() || null,
        bio: values.bio.trim() || null,
        skills,
        visibleToRecruiters: recruiterVisible,
      });
      onSaved();
    } catch (error) {
      submitError.report(error);
      setBusy(false);
    }
  };

  const nameError = fieldErrorText(t, errors.name);
  const countryError = fieldErrorText(t, errors.country);
  const bioError = fieldErrorText(t, errors.bio);

  return (
    <>
      <section className={styles.block} aria-labelledby="profile-photo-title">
        <h2 id="profile-photo-title" className={styles.subTitle}>
          {t('settings.photo.title')}
        </h2>
        <PhotoField user={user} />
      </section>

      <form onSubmit={onSubmit} noValidate className={styles.block}>
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
        <div className={styles.row}>
          <Field id={IDS.country} label={t('auth.fields.country')} error={countryError}>
            <CountrySelect
              id={IDS.country}
              value={values.country}
              onChange={(value) => form.setValue('country', value)}
              emptyLabel={t('auth.fields.countryPlaceholder')}
              otherLabel={t('auth.fields.countryOther')}
              invalid={!!countryError}
              describedBy={describedBy(IDS.country, false, countryError)}
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
        </div>
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

        <h2 className={styles.subTitle}>{t('settings.profile.skills')}</h2>
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
          <Link to={`/users/${user.username}`} className={buttonClass({ variant: 'ghost' })}>
            {t('settings.cancel')}
          </Link>
          <Button type="submit" variant="primary" busy={busy}>
            {busy ? t('settings.saving') : t('settings.save')}
          </Button>
        </div>
      </form>
    </>
  );
}
