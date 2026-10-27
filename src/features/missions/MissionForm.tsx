import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import type { MissionDetail, MissionKind } from '../../api/types';
import { Button } from '../../components/Button';
import { buttonClass } from '../../components/buttonClass';
import { Field } from '../../components/Field';
import { describedBy } from '../../components/fieldIds';
import { fieldErrorText } from '../../hooks/fieldErrorText';
import { useSubmitError } from '../../hooks/useSubmitError';
import { useValidatedForm, type Validators } from '../../hooks/useValidatedForm';
import { parseTags } from '../questions/validation';
import { MISSION_KINDS, missionsApi } from './missionsApi';
import { CURRENCIES } from './money';
import styles from './MissionForm.module.css';

type MissionValues = {
  title: string;
  description: string;
  technologies: string;
  delay: string;
  budget: string;
};

export const DELAY_MAX = 90;

const VALIDATORS: Validators<MissionValues> = {
  title: (v) =>
    v.trim().length < 10 || v.trim().length > 120 ? 'missions.new.errors.title' : null,
  description: (v) => (v.trim().length < 50 ? 'missions.new.errors.description' : null),
  technologies: (v) => (parseTags(v).length ? null : 'jobs.new.errors.technologies'),
  delay: (v) => {
    const days = Number(v);
    return Number.isInteger(days) && days >= 1 && days <= DELAY_MAX
      ? null
      : 'missions.new.errors.delay';
  },
  budget: (v) => (Number(v) > 0 ? null : 'missions.new.errors.budget'),
};

const IDS: Record<keyof MissionValues, string> = {
  title: 'mission-title',
  description: 'mission-description',
  technologies: 'mission-technologies',
  delay: 'mission-delay',
  budget: 'mission-budget',
};

export type MissionFormProps = {
  /** Mission à modifier ; absente pour une nouvelle mission. */
  initial?: MissionDetail;
  onSaved: (mission: MissionDetail) => void;
};

/** Publier ou modifier une mission courte entre pairs (JOB-5), avec budget indicatif et délai. */
export function MissionForm({ initial, onSaved }: MissionFormProps) {
  const { t } = useTranslation();
  const form = useValidatedForm<MissionValues>(
    {
      title: initial?.title ?? '',
      description: initial?.descriptionMarkdown ?? '',
      technologies: initial?.technologies.join(', ') ?? '',
      delay: String(initial?.durationDays ?? 3),
      budget: initial ? String(initial.budget.amount) : '',
    },
    VALIDATORS,
  );
  const submitError = useSubmitError(form.setServerErrors);
  const [kind, setKind] = useState<MissionKind>(initial?.kind ?? 'TROUBLESHOOTING');
  const [currency, setCurrency] = useState(initial?.budget.currency ?? CURRENCIES[0]);
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
        kind,
        description: values.description.trim(),
        budget: { amount: Number(values.budget), currency },
        durationDays: Number(values.delay),
        technologies: parseTags(values.technologies),
        // Pas de champ pays dans le formulaire : on garde celui de la mission modifiée.
        countryCode: initial?.countryCode ?? null,
      };
      onSaved(
        initial ? await missionsApi.update(initial.id, body) : await missionsApi.create(body),
      );
    } catch (error) {
      submitError.report(error);
      setBusy(false);
    }
  };

  const err = (name: keyof MissionValues) => fieldErrorText(t, errors[name]);
  const bind = (name: keyof MissionValues, hint = false) => ({
    id: IDS[name],
    value: values[name],
    onChange: (e: { target: { value: string } }) => form.setValue(name, e.target.value),
    onBlur: () => form.onBlur(name),
    'aria-invalid': !!err(name),
    'aria-describedby': describedBy(IDS[name], hint, err(name)),
  });

  return (
    <form onSubmit={onSubmit} noValidate>
      {submitError.message && (
        <div ref={submitError.alertRef} className={styles.alert} role="alert" tabIndex={-1}>
          {submitError.message}
        </div>
      )}

      <fieldset className={styles.fieldset}>
        <legend className={styles.legend}>{t('missions.new.kind')}</legend>
        <div className={styles.kinds}>
          {MISSION_KINDS.map((value) => (
            <label key={value} className={styles.kind}>
              <input
                type="radio"
                name="mission-kind"
                checked={kind === value}
                onChange={() => setKind(value)}
              />
              <span>
                <b>{t(`missions.kind.${value}`)}</b>
                <small>{t(`missions.kindHint.${value}`)}</small>
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      <Field id={IDS.title} label={t('missions.new.title')} error={err('title')}>
        <input
          maxLength={120}
          placeholder={t('missions.new.titlePlaceholder')}
          {...bind('title')}
        />
      </Field>

      <Field
        id={IDS.description}
        label={t('missions.new.description')}
        hint={t('missions.new.descriptionHint')}
        error={err('description')}
      >
        <textarea rows={7} {...bind('description', true)} />
      </Field>

      <Field
        id={IDS.technologies}
        label={t('jobs.technologies')}
        hint={t('jobs.new.technologiesHint')}
        error={err('technologies')}
      >
        <input autoCapitalize="none" spellCheck={false} {...bind('technologies', true)} />
      </Field>

      <div className={styles.grid}>
        <Field
          id={IDS.budget}
          label={<>{t('missions.new.budget')}</>}
          hint={t('missions.new.budgetHint')}
          error={err('budget')}
        >
          <div className={styles.money}>
            <input type="number" inputMode="numeric" min={0} step={500} {...bind('budget', true)} />
            <label className="sr-only" htmlFor="mission-currency">
              {t('missions.new.currency')}
            </label>
            <select
              id="mission-currency"
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
            >
              {CURRENCIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
        </Field>
        <Field
          id={IDS.delay}
          label={t('missions.new.delay')}
          hint={t('missions.new.delayHint', { max: DELAY_MAX })}
          error={err('delay')}
        >
          <input
            type="number"
            inputMode="numeric"
            min={1}
            max={DELAY_MAX}
            {...bind('delay', true)}
          />
        </Field>
      </div>

      <p className={styles.notice}>{t('missions.new.notice')}</p>
      <div className={styles.actions}>
        {initial && (
          <Link to={`/missions/${initial.id}`} className={buttonClass({ variant: 'secondary' })}>
            {t('settings.cancel')}
          </Link>
        )}
        <Button type="submit" variant="primary" busy={busy}>
          {busy
            ? t('missions.new.busy')
            : t(initial ? 'missions.edit.submit' : 'missions.new.submit')}
        </Button>
      </div>
    </form>
  );
}
