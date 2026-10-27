import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import type { JobDetail, JobType } from '../../api/types';
import { CountrySelect } from '../../components/CountrySelect';
import { Button } from '../../components/Button';
import { buttonClass } from '../../components/buttonClass';
import { Field } from '../../components/Field';
import { describedBy } from '../../components/fieldIds';
import { fieldErrorText } from '../../hooks/fieldErrorText';
import { useSubmitError } from '../../hooks/useSubmitError';
import { useValidatedForm, type Validators } from '../../hooks/useValidatedForm';
import { parseTags } from '../questions/validation';
import { JOB_TYPES, jobsApi } from './jobsApi';
import {
  validateCompany,
  validateDescription,
  validateJobTitle,
  validateWebsite,
} from './validation';
import styles from './JobForm.module.css';

type JobValues = {
  title: string;
  company: string;
  website: string;
  technologies: string;
  description: string;
};

const VALIDATORS: Validators<JobValues> = {
  title: validateJobTitle,
  company: validateCompany,
  website: validateWebsite,
  technologies: (value) => (parseTags(value).length ? null : 'jobs.new.errors.technologies'),
  description: validateDescription,
};

const IDS: Record<keyof JobValues, string> = {
  title: 'job-title',
  company: 'job-company',
  website: 'job-website',
  technologies: 'job-technologies',
  description: 'job-description',
};

export type JobFormProps = {
  /** Offre à modifier ; absente pour une nouvelle offre. */
  initial?: JobDetail;
  onSaved: (job: JobDetail) => void;
};

/**
 * Publication d'une offre par une entreprise (JOB-4), « En attente » jusqu'à validation.
 * Sert aussi à la modifier : elle repasse alors en validation.
 */
export function JobForm({ initial, onSaved }: JobFormProps) {
  const { t } = useTranslation();
  const form = useValidatedForm<JobValues>(
    {
      title: initial?.title ?? '',
      company: initial?.companyName ?? '',
      website: initial?.companyWebsite ?? '',
      technologies: initial?.technologies.join(', ') ?? '',
      description: initial?.descriptionMarkdown ?? '',
    },
    VALIDATORS,
  );
  const submitError = useSubmitError(form.setServerErrors);
  const [jobType, setJobType] = useState<JobType>(initial?.type ?? 'PERMANENT');
  const [city, setCity] = useState(initial?.city ?? '');
  const [country, setCountry] = useState(initial?.countryCode ?? '');
  const [salary, setSalary] = useState(initial?.compensation ?? '');
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
      const body = {
        title: values.title.trim(),
        companyName: values.company.trim(),
        companyWebsite: values.website.trim() || null,
        city: city.trim() || null,
        countryCode: country || null,
        type: jobType,
        technologies: parseTags(values.technologies),
        compensation: salary.trim() || null,
        description: values.description.trim(),
      };
      onSaved(initial ? await jobsApi.update(initial.id, body) : await jobsApi.create(body));
    } catch (error) {
      submitError.report(error);
      setBusy(false);
    }
  };

  const err = (name: keyof JobValues) => fieldErrorText(t, errors[name]);
  const input = (name: keyof JobValues, props: { hint?: boolean } = {}) => ({
    id: IDS[name],
    value: values[name],
    onChange: (e: { target: { value: string } }) => form.setValue(name, e.target.value),
    onBlur: () => form.onBlur(name),
    'aria-invalid': !!err(name),
    'aria-describedby': describedBy(IDS[name], !!props.hint, err(name)),
  });
  const optional = <span className="muted">{t('question.optional')}</span>;

  return (
    <form onSubmit={onSubmit} noValidate>
      {submitError.message && (
        <div ref={submitError.alertRef} className={styles.alert} role="alert" tabIndex={-1}>
          {submitError.message}
        </div>
      )}

      <Field id={IDS.title} label={t('jobs.new.title')} error={err('title')}>
        <input maxLength={120} {...input('title')} />
      </Field>

      <div className={styles.grid}>
        <Field id={IDS.company} label={t('jobs.new.company')} error={err('company')}>
          <input maxLength={80} autoComplete="organization" {...input('company')} />
        </Field>
        <Field
          id={IDS.website}
          label={
            <>
              {t('jobs.new.website')} {optional}
            </>
          }
          hint={t('jobs.new.websiteHint')}
          error={err('website')}
        >
          <input
            type="url"
            inputMode="url"
            placeholder="https://"
            {...input('website', { hint: true })}
          />
        </Field>
      </div>

      <fieldset className={styles.fieldset}>
        <legend className={styles.legend}>{t('jobs.new.contract')}</legend>
        <div className={styles.radios}>
          {JOB_TYPES.map((value) => (
            <label key={value} className={styles.radio}>
              <input
                type="radio"
                name="job-contract"
                checked={jobType === value}
                onChange={() => setJobType(value)}
              />
              {t(`jobs.contract.${value}`)}
            </label>
          ))}
        </div>
      </fieldset>

      <div className={styles.grid}>
        <Field
          id="job-city"
          label={
            <>
              {t('settings.profile.city')} {optional}
            </>
          }
        >
          <input
            id="job-city"
            maxLength={60}
            value={city}
            onChange={(e) => setCity(e.target.value)}
          />
        </Field>
        <Field
          id="job-country"
          label={
            <>
              {t('auth.fields.country')} {optional}
            </>
          }
        >
          <CountrySelect
            id="job-country"
            value={country}
            onChange={setCountry}
            emptyLabel={t('ask.fields.noCountry')}
          />
        </Field>
      </div>

      <Field
        id={IDS.technologies}
        label={t('jobs.technologies')}
        hint={t('jobs.new.technologiesHint')}
        error={err('technologies')}
      >
        <input
          autoCapitalize="none"
          spellCheck={false}
          {...input('technologies', { hint: true })}
        />
      </Field>

      <Field id="job-salary" label={t('jobs.new.salary')} hint={t('jobs.new.salaryHint')}>
        <input
          id="job-salary"
          maxLength={80}
          value={salary}
          onChange={(e) => setSalary(e.target.value)}
          aria-describedby="job-salary-hint"
        />
      </Field>

      <Field
        id={IDS.description}
        label={t('jobs.new.description')}
        hint={t('jobs.new.descriptionHint')}
        error={err('description')}
      >
        <textarea rows={10} {...input('description', { hint: true })} />
      </Field>

      <p className={styles.notice}>{t(initial ? 'jobs.edit.notice' : 'jobs.new.notice')}</p>
      <div className={styles.actions}>
        {initial && (
          <Link to={`/jobs/${initial.id}`} className={buttonClass({ variant: 'secondary' })}>
            {t('settings.cancel')}
          </Link>
        )}
        <Button type="submit" variant="primary" busy={busy}>
          {busy ? t('jobs.new.busy') : t(initial ? 'jobs.edit.submit' : 'jobs.new.submit')}
        </Button>
      </div>
    </form>
  );
}
